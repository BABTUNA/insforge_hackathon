import { NextRequest, NextResponse } from 'next/server'
import { FALLBACK_ROOM } from '@/lib/three/fallback-room'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MODEL = process.env.OPENROUTER_VISION_MODEL || 'anthropic/claude-sonnet-4.5'

type Body = { image_data?: string; description?: string; existing_code?: string }

function buildPrompt(description?: string, existing?: string): string {
  if (existing) {
    return `You are an expert Three.js developer. Analyze this image and MODIFY the existing room code to add any new objects you see that aren't already present. Keep all existing objects.

EXISTING CODE:
${existing}

${description || ''}
OUTPUT ONLY THE COMPLETE MODIFIED JAVASCRIPT (function createCompleteRoom() returning a THREE.Scene). NO markdown, NO explanation.`
  }
  return `You are an expert Three.js developer. Look carefully at THIS photo and generate Three.js code that faithfully reconstructs THIS specific room as real 3D geometry.

CRITICAL — FIDELITY:
- Reconstruct ONLY what is actually visible in the photo. Do NOT invent, assume, or add any furniture or objects that are not clearly present.
- If the room is EMPTY (no furniture), generate ONLY the empty room shell: floor, walls, ceiling, windows/doors, and lighting — and NOTHING else. An empty photo must produce an empty room.
- Match the real wall/floor colors, window and door positions, and overall proportions from the photo.

REQUIREMENTS:
1. Define a function createCompleteRoom() that returns a THREE.Scene.
2. Build the room structure (floor, walls, ceiling) sized to match the photo's proportions, ~6m x 6m x 3m.
3. For each object that IS visible, recreate it with built-in geometries only (Box, Cylinder, Sphere, Cone, Torus, Plane), positioned and scaled as in the photo, sitting on the floor (lowest point near y=0).
4. Use MeshStandardMaterial/MeshPhongMaterial with colors matching the photo.
5. Lighting: AmbientLight + DirectionalLight + PointLights only inside lamps that are actually visible.
6. Set scene.userData.camera to a PerspectiveCamera positioned for a good 3/4 view.
7. THREE is already in scope. No imports, no require, no markdown.

${description || ''}
The function MUST end with "return scene;" then a closing brace. OUTPUT ONLY PURE JAVASCRIPT.`
}

function extractCode(text: string): string | null {
  let clean = text.trim()
  const fence = clean.match(/```(?:javascript|js)?\s*([\s\S]*?)```/i)
  if (fence) clean = fence[1].trim()
  else clean = clean.replace(/```(?:javascript|js)?/gi, '').replace(/```/g, '').trim()
  const idx = clean.indexOf('function createCompleteRoom')
  if (idx >= 0) clean = clean.slice(idx)
  return clean.includes('createCompleteRoom') && clean.includes('return scene') ? clean : null
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    body = {}
  }
  if (!body.image_data) {
    return NextResponse.json({ error: 'image_data required' }, { status: 400 })
  }

  const key = process.env.OPENROUTER_API_KEY
  if (!key) {
    console.warn('[generate-complete-room] No OPENROUTER_API_KEY → empty fallback room')
    return NextResponse.json({ code: FALLBACK_ROOM, source: 'fallback' })
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8000,
        temperature: 0.5,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: buildPrompt(body.description, body.existing_code) },
              { type: 'image_url', image_url: { url: body.image_data } },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(120_000),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`[generate-complete-room] OpenRouter ${res.status}: ${detail.slice(0, 300)} → empty fallback`)
      return NextResponse.json({ code: FALLBACK_ROOM, source: 'fallback' })
    }
    const data = await res.json()
    const text: string = data?.choices?.[0]?.message?.content ?? ''
    const code = extractCode(text)
    if (code) return NextResponse.json({ code, source: 'ai-vision' })
    console.error(
      `[generate-complete-room] AI returned unusable code (len=${text.length}, head="${text.slice(0, 120)}") → empty fallback`
    )
  } catch (err) {
    console.error(`[generate-complete-room] request failed: ${err instanceof Error ? err.message : err} → empty fallback`)
  }

  return NextResponse.json({ code: FALLBACK_ROOM, source: 'fallback' })
}
