import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { pickSlots, buildSlotPrompt } from '@/lib/fleet/slots'
import { spawnAgent } from '@/lib/fleet/replicas'
import { putRun, type RunState, type SlotState } from '@/lib/fleet/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let body: { styles?: string[]; budget?: number; fleetSize?: number; demo?: boolean }
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const styles = Array.isArray(body.styles) ? body.styles.slice(0, 6) : []
  const budget = Number.isFinite(body.budget) ? Math.max(200, Number(body.budget)) : 3000
  const fleetSize = Number.isFinite(body.fleetSize) ? Number(body.fleetSize) : 6
  // Demo mode (?demo or {demo:true}): simulate the swarm with canned products —
  // a guaranteed run when the venue network / Replicas is unavailable.
  const demo = body.demo === true || req.nextUrl.searchParams.get('demo') === '1'

  const slotDefs = pickSlots(fleetSize)
  const runId = randomUUID()

  // In demo mode, skip spawning; the stream simulates progress to "done".
  const slots: SlotState[] = demo
    ? slotDefs.map((def): SlotState => ({
        key: def.key,
        label: def.label,
        icon: def.icon,
        budget: Math.max(40, Math.round(budget * def.budgetShare)),
        result: null,
        agentId: null,
        status: 'working',
        activity: 'Starting up…',
      }))
    : await Promise.all(
        slotDefs.map(async (def): Promise<SlotState> => {
          const slotBudget = Math.max(40, Math.round(budget * def.budgetShare))
          const prompt = buildSlotPrompt({ label: def.label, styles, slotBudget })
          const base = {
            key: def.key,
            label: def.label,
            icon: def.icon,
            budget: slotBudget,
            result: null,
          }
          try {
            const agentId = await spawnAgent(`shop-${def.key}`, prompt)
            return { ...base, agentId, status: 'working', activity: 'Starting up…' }
          } catch (err) {
            return {
              ...base,
              agentId: null,
              status: 'error',
              activity: err instanceof Error ? err.message : 'Failed to spawn',
            }
          }
        })
      )

  const run: RunState = { runId, styles, budget, createdAt: Date.now(), demo, slots }
  putRun(run)

  return NextResponse.json({
    runId,
    styles,
    budget,
    slots: slots.map((s) => ({
      key: s.key,
      label: s.label,
      icon: s.icon,
      budget: s.budget,
      status: s.status,
      activity: s.activity,
    })),
  })
}
