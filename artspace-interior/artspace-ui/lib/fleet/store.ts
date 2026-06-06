/**
 * In-memory store for active fleet runs. Single Next.js server process in dev,
 * so a module-level Map is fine. Pinned to globalThis to survive HMR reloads.
 */
import type { ShoppingResult } from './replicas'

export type SlotStatus = 'spawning' | 'working' | 'done' | 'error'

export type SlotState = {
  key: string
  label: string
  icon: string
  budget: number
  agentId: string | null
  status: SlotStatus
  activity: string
  result: ShoppingResult | null
}

export type RunState = {
  runId: string
  styles: string[]
  budget: number
  createdAt: number
  slots: SlotState[]
}

const store: Map<string, RunState> =
  (globalThis as any).__fleetRuns ?? ((globalThis as any).__fleetRuns = new Map())

export function putRun(run: RunState) {
  store.set(run.runId, run)
}

export function getRun(runId: string): RunState | undefined {
  return store.get(runId)
}
