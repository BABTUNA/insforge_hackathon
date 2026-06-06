/**
 * Thin server-side wrapper around the proven `replicas` CLI.
 * We shell out (create + read) and parse the text output, because the CLI has
 * no JSON mode. This is the engine that powers the agent fleet.
 */
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'

const ENV_ID = process.env.REPLICAS_ENV_ID || '03e76450-3e1b-4faa-bfa8-53ed8ca4416c' // Global env

// Resolve the replicas binary (installed via bun into ~/.bun/bin).
function replicasBin(): string {
  const candidate = path.join(homedir(), '.bun', 'bin', 'replicas')
  return existsSync(candidate) ? candidate : 'replicas'
}

function run(args: string[], timeoutMs = 60_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, PATH: `${path.join(homedir(), '.bun', 'bin')}:${process.env.PATH || ''}` }
    execFile(replicasBin(), args, { timeout: timeoutMs, maxBuffer: 1024 * 1024 * 8, env }, (err, stdout, stderr) => {
      if (err) return reject(new Error(`replicas ${args[0]} failed: ${stderr || err.message}`))
      resolve(stdout)
    })
  })
}

/** Spawn one agent. Returns the replica id. */
export async function spawnAgent(label: string, message: string): Promise<string> {
  const out = await run(['create', label, '-a', 'claude', '-e', ENV_ID, '-m', message])
  const m = out.match(/ID:\s*([0-9a-f-]{36})/i)
  if (!m) throw new Error(`Could not parse replica id from: ${out.slice(0, 200)}`)
  return m[1]
}

export type ShoppingResult = {
  name: string
  price_usd: number
  retailer: string
  product_url: string
  image_url: string
  why?: string
}

export type AgentSnapshot = {
  status: 'working' | 'done'
  activity: string
  result: ShoppingResult | null
}

// Map a raw CLI event header to a friendly "what the agent is doing" line.
function friendlyActivity(eventHeader: string, body: string): string {
  const h = eventHeader.toUpperCase()
  if (h.includes('WEB SEARCH')) {
    const q = body.replace(/^["']|["']$/g, '').trim().slice(0, 70)
    return q ? `Searching: ${q}` : 'Searching the web…'
  }
  if (h.includes('WEBFETCH') || h.includes('WEB FETCH')) return 'Reading a product page…'
  if (h.includes('TOOLSEARCH') || h.includes('TOOL SEARCH')) return 'Loading tools…'
  if (h.includes('TOOL:')) return 'Using a tool…'
  if (h.includes('ASSISTANT')) return 'Finalizing pick…'
  if (h.includes('USER')) return 'Starting up…'
  return 'Working…'
}

// Pull the first balanced JSON object out of a text blob.
function extractJson(text: string): ShoppingResult | null {
  const cleaned = text.replace(/```(?:json)?/gi, '')
  const start = cleaned.indexOf('{')
  if (start === -1) return null
  let depth = 0
  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === '{') depth++
    else if (cleaned[i] === '}') {
      depth--
      if (depth === 0) {
        try {
          const obj = JSON.parse(cleaned.slice(start, i + 1))
          if (obj && typeof obj.name === 'string' && typeof obj.product_url === 'string') {
            return obj as ShoppingResult
          }
        } catch {
          /* keep scanning */
        }
      }
    }
  }
  return null
}

/** Read an agent's conversation and derive its current state. */
export async function readAgent(id: string): Promise<AgentSnapshot> {
  const out = await run(['read', id, '-l', '40'], 30_000)

  // Events look like:  [11:32:25 AM] WEB SEARCH:\n  body...\n
  const eventRe = /\[\d{1,2}:\d{2}:\d{2}\s*[AP]M\]\s*([^\n]*)\n([\s\S]*?)(?=\n\[\d{1,2}:\d{2}:\d{2}\s*[AP]M\]|\n-{5,}|$)/g
  type Ev = { header: string; body: string }
  const events: Ev[] = []
  let m: RegExpExecArray | null
  while ((m = eventRe.exec(out)) !== null) {
    events.push({ header: m[1].trim(), body: m[2].trim() })
  }

  if (events.length === 0) {
    return { status: 'working', activity: 'Starting up…', result: null }
  }

  // Look for a completed pick: the last ASSISTANT event that contains JSON.
  for (let i = events.length - 1; i >= 0; i--) {
    if (/ASSISTANT/i.test(events[i].header)) {
      const result = extractJson(events[i].body)
      if (result) return { status: 'done', activity: 'Found it ✓', result }
    }
  }

  const last = events[events.length - 1]
  return { status: 'working', activity: friendlyActivity(last.header, last.body), result: null }
}
