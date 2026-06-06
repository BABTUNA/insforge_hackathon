import { NextRequest } from 'next/server'
import { readAgent } from '@/lib/fleet/replicas'
import { getRun, type SlotState } from '@/lib/fleet/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const POLL_MS = 2500
const MAX_TICKS = 72 // ~3 min ceiling

function snapshot(slots: SlotState[]) {
  return slots.map((s) => ({
    key: s.key,
    label: s.label,
    icon: s.icon,
    budget: s.budget,
    status: s.status,
    activity: s.activity,
    result: s.result,
  }))
}

export async function GET(req: NextRequest) {
  const runId = req.nextUrl.searchParams.get('runId') || ''
  const run = getRun(runId)

  const encoder = new TextEncoder()

  if (!run) {
    return new Response(`event: error\ndata: ${JSON.stringify({ error: 'Unknown runId' })}\n\n`, {
      status: 404,
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false
      const send = (type: string, payload: unknown) => {
        if (closed) return
        controller.enqueue(encoder.encode(`event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`))
      }
      const close = () => {
        if (closed) return
        closed = true
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      }
      req.signal.addEventListener('abort', close)

      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

      // Initial snapshot so the board renders immediately.
      send('update', { runId, slots: snapshot(run.slots) })

      for (let tick = 0; tick < MAX_TICKS && !closed; tick++) {
        const pending = run.slots.filter((s) => s.status === 'working' && s.agentId)
        if (pending.length === 0) break

        await Promise.all(
          pending.map(async (slot) => {
            try {
              const snap = await readAgent(slot.agentId as string)
              slot.activity = snap.activity
              if (snap.status === 'done' && snap.result) {
                slot.status = 'done'
                slot.result = snap.result
              }
            } catch {
              /* transient read error — keep polling */
            }
          })
        )

        send('update', { runId, slots: snapshot(run.slots) })

        const stillWorking = run.slots.some((s) => s.status === 'working')
        if (!stillWorking) break
        await sleep(POLL_MS)
      }

      // Anything still working at the ceiling is marked timed out (fallback can fill later).
      for (const s of run.slots) {
        if (s.status === 'working') {
          s.status = 'error'
          s.activity = 'Timed out'
        }
      }

      const done = run.slots.filter((s) => s.status === 'done' && s.result)
      const total = done.reduce((sum, s) => sum + (Number(s.result?.price_usd) || 0), 0)
      send('done', {
        runId,
        slots: snapshot(run.slots),
        summary: { found: done.length, total: Math.round(total) },
      })
      close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
