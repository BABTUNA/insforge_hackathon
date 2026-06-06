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
  return `You are an expert Three.js developer creating photorealistic room scenes. Analyze this image and generate COMPLETE Three.js code that recreates EVERY object in the room as real 3D geometry.

REQUIREMENTS:
1. Define a function createCompleteRoom() that returns a THREE.Scene.
2. Build room structure: floor, back + side walls, ceiling — approx 6m x 6m x 3m, colors matching the image.
3. Recreate EVERY visible object as 3D geometry (sofa, chairs, tables, bed, lamps, rugs, art, plants, shelving, curtains, decor) using only built-in geometries (Box, Cylinder, Sphere, Cone, Torus, Plane).
4. Position and scale each object as in the photo; sit everything on the floor (lowest point near y=0).
5. Use MeshStandardMaterial/MeshPhongMaterial with colors matching the image.
6. Lighting: AmbientLight + DirectionalLight + PointLights inside any lamps.
7. Set scene.userData.camera to a PerspectiveCamera positioned for a good 3/4 view.
8. THREE is already in scope. No imports, no require, no markdown.

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
  if (key) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 8000,
          temperature: 0.6,
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
        signal: AbortSignal.timeout(90_000),
      })
      if (res.ok) {
        const data = await res.json()
        const text: string = data?.choices?.[0]?.message?.content ?? ''
        const code = extractCode(text)
        if (code) return NextResponse.json({ code, source: 'ai-vision' })
      }
    } catch {
      /* fall through to fallback */
    }
  }

  return NextResponse.json({ code: FALLBACK_ROOM, source: 'fallback' })
}
