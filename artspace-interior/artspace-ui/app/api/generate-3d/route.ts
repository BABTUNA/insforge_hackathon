import { NextRequest, NextResponse } from 'next/server'
import { fallbackCode } from '@/lib/three/fallback-furniture'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MODEL = process.env.OPENROUTER_3D_MODEL || 'anthropic/claude-sonnet-4.5'

// Cache generated code by type|style so repeat demos are instant.
const cache: Map<string, string> =
  (globalThis as any).__gen3dCache ?? ((globalThis as any).__gen3dCache = new Map())

type Body = {
  furniture_type?: string
  style?: string
  colors?: string[]
  materials?: string[]
  dimensions?: { width?: number; depth?: number; height?: number }
}

function buildPrompt(b: Body): string {
  const dims = b.dimensions
    ? `Approximate dimensions (meters): width=${b.dimensions.width}, depth=${b.dimensions.depth}, height=${b.dimensions.height}`
    : ''
  return `You are an expert in Three.js procedural modeling. Generate Three.js code for a realistic ${b.furniture_type}.
Style: ${b.style}
Colors: ${(b.colors || ['neutral']).join(', ')}
Materials: ${(b.materials || ['wood']).join(', ')}
${dims}

RULES:
1. Return ONLY JavaScript code, no markdown, no explanation.
2. Define exactly: function createFurniture() { ... return group; } returning a THREE.Group.
3. Use only built-in geometries (BoxGeometry, CylinderGeometry, SphereGeometry, ConeGeometry, TorusGeometry).
4. Use MeshStandardMaterial or MeshPhongMaterial. THREE is already in scope — no imports, no require.
5. Sit the piece on the floor: its lowest point near y=0, centered on x/z=0.
6. Keep realistic proportions in meters. Add style-appropriate detail (legs, cushions, frames, shade, etc.).
7. Self-contained. No external variables. Do not call createFurniture yourself.`
}

function balanced(code: string): boolean {
  let depth = 0
  for (const ch of code) {
    if (ch === '{') depth++
    else if (ch === '}') depth--
    if (depth < 0) return false
  }
  return depth === 0
}

function extractCode(text: string): string | null {
  const clean = text.replace(/```(?:javascript|js)?/gi, '').replace(/```/g, '').trim()
  const m = clean.match(/function\s+createFurniture[\s\S]*\}\s*$/)
  const code = m ? m[0] : clean
  // Reject truncated/unbalanced output so the caller can use a clean fallback.
  if (!code.includes('createFurniture') || !code.includes('return') || !balanced(code)) return null
  return code
}

async function generateWithAI(b: Body): Promise<string | null> {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) return null
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        temperature: 0.6,
        messages: [{ role: 'user', content: buildPrompt(b) }],
      }),
      signal: AbortSignal.timeout(40_000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const text: string = data?.choices?.[0]?.message?.content ?? ''
    return extractCode(text)
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    body = {}
  }
  const type = body.furniture_type || 'furniture'
  const cacheKey = `${type}|${body.style || ''}`

  const cached = cache.get(cacheKey)
  if (cached) return NextResponse.json({ code: cached, source: 'cache' })

  const ai = await generateWithAI(body)
  if (ai) {
    cache.set(cacheKey, ai)
    return NextResponse.json({ code: ai, source: 'ai' })
  }

  return NextResponse.json({ code: fallbackCode(type), source: 'fallback' })
}
