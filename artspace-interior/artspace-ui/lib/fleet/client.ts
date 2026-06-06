/**
 * Browser-side client for the agent fleet: kick off a run, then subscribe to
 * live status updates over Server-Sent Events.
 */

export type ShoppingResult = {
  name: string
  price_usd: number
  retailer: string
  product_url: string
  image_url: string
  why?: string
}

export type SlotView = {
  key: string
  label: string
  icon: string
  budget: number
  status: 'spawning' | 'working' | 'done' | 'error'
  activity: string
  result: ShoppingResult | null
}

export type StartResponse = {
  runId: string
  styles: string[]
  budget: number
  slots: SlotView[]
}

export async function startFleet(opts: {
  styles: string[]
  budget: number
  fleetSize?: number
}): Promise<StartResponse> {
  const res = await fetch('/api/fleet/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Fleet failed to start (${res.status})`)
  }
  return res.json()
}

export type StreamHandlers = {
  onUpdate: (slots: SlotView[]) => void
  onDone: (slots: SlotView[], summary: { found: number; total: number }) => void
  onError?: (msg: string) => void
}

/** Subscribe to a run's live updates. Returns a cleanup function. */
export function subscribeFleet(runId: string, handlers: StreamHandlers): () => void {
  const es = new EventSource(`/api/fleet/stream?runId=${encodeURIComponent(runId)}`)

  es.addEventListener('update', (e) => {
    try {
      const data = JSON.parse((e as MessageEvent).data)
      handlers.onUpdate(data.slots as SlotView[])
    } catch {
      /* ignore malformed frame */
    }
  })

  es.addEventListener('done', (e) => {
    try {
      const data = JSON.parse((e as MessageEvent).data)
      handlers.onDone(data.slots as SlotView[], data.summary)
    } catch {
      /* ignore */
    }
    es.close()
  })

  es.addEventListener('error', (e) => {
    // Native EventSource error (connection closed). Treat as benign if already done.
    const data = (e as MessageEvent).data
    if (data && handlers.onError) {
      try {
        handlers.onError(JSON.parse(data).error || 'stream error')
      } catch {
        handlers.onError('stream error')
      }
    }
  })

  return () => es.close()
}
