import { NextRequest, NextResponse } from 'next/server'
import { FALLBACK_ROOM } from '@/lib/three/fallback-room'
import { pickFromCatalog, categoryOf } from '@/lib/fleet/catalog'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const search = (q: string, site = 'westelm.com') => `https://www.google.com/search?q=${encodeURIComponent(q + ' ' + site)}`
const tile = (name: string) => `https://placehold.co/600x600/ece5d8/9a8c78?text=${encodeURIComponent(name.split(',')[0])}`

type IdItem = {
  label: string
  category: string
  x: number
  z: number
  result: { name: string; price_usd: number; retailer: string; product_url: string; image_url: string; why: string }
}

const item = (
  label: string,
  category: string,
  x: number,
  z: number,
  name: string,
  price: number,
  retailer: string,
  why: string
): IdItem => ({
  label,
  category,
  x,
  z,
  result: { name, price_usd: price, retailer, product_url: search(name, `${retailer.toLowerCase().replace(/\s/g, '')}.com`), image_url: tile(name), why },
})

// Hardcoded identification for the demo example image (matched by filename).
const PRESET: { room_code: string; items: IdItem[] } = {
  room_code: FALLBACK_ROOM,
  items: [
    item('Rug', 'rug', 0, 0.3, 'Hand-Woven Wool Rug, Ivory', 299, 'West Elm', 'Textured ivory wool rug grounding the seating area.'),
    item('Sofa', 'sofa', 0, -1.7, 'Harmony Modular Sofa, Performance Linen', 1899, 'West Elm', 'Deep, cloud-like cream linen sofa.'),
    item('Coffee Table', 'coffee_table', 0, -0.4, 'Fluted Round Coffee Table, Oatmeal', 649, 'CB2', 'Round fluted plinth table in warm oatmeal.'),
    item('Accent Chair', 'accent_chair', 1.9, 0.4, 'Boucle Swivel Accent Chair, Cream', 799, 'Article', 'Curvy cream boucle lounge chair.'),
    item('Wall Art', 'wall_art', 0, -2.85, 'Abstract Line Framed Print, 40x30', 229, 'Crate & Barrel', 'Oversized abstract line art in a light frame.'),
    item('Plant', 'plant', -2.1, -1.7, 'Faux Areca Palm, 6 ft', 189, 'Pottery Barn', 'Tall faux palm softening the corner.'),
    item('Table Lamp', 'floor_lamp', 2.2, -1.6, 'Ceramic Table Lamp, Bone', 149, 'West Elm', 'Sculptural bone-glaze ceramic lamp.'),
  ],
}

async function visionDetect(imageData: string): Promise<IdItem[]> {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) return []
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENROUTER_VISION_MODEL || 'anthropic/claude-sonnet-4.5',
        max_tokens: 600,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'List the distinct furniture/decor pieces visible in this room as a JSON array of short shopping queries, e.g. ["beige linen sofa","round wood coffee table"]. Max 7. Output ONLY the JSON array.',
              },
              { type: 'image_url', image_url: { url: imageData } },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(60_000),
    })
    if (!res.ok) return []
    const data = await res.json()
    const text: string = data?.choices?.[0]?.message?.content ?? ''
    const m = text.match(/\[[\s\S]*\]/)
    if (!m) return []
    const queries: string[] = JSON.parse(m[0])
    // Lay detected pieces out in a simple arc so they don't overlap.
    return queries.slice(0, 7).map((q, i) => {
      const r = pickFromCatalog(q, null)
      return {
        label: q,
        category: categoryOf(q),
        x: -2 + (i % 4) * 1.3,
        z: -1.5 + Math.floor(i / 4) * 1.4,
        result: { ...r, why: r.why ?? '' },
      }
    })
  } catch {
    return []
  }
}

export async function POST(req: NextRequest) {
  let body: { image_data?: string; image_name?: string }
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  // Demo hardcode: match the example image by filename.
  if (body.image_name && /example3/i.test(body.image_name)) {
    return NextResponse.json({ ...PRESET, source: 'preset' })
  }

  // Generic best-effort: detect furniture from the photo, map to catalog items.
  const items = body.image_data ? await visionDetect(body.image_data) : []
  return NextResponse.json({ room_code: FALLBACK_ROOM, items, source: items.length ? 'vision' : 'empty' })
}
