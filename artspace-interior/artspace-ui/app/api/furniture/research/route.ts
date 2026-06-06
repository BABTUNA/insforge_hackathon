import { NextRequest, NextResponse } from 'next/server'
import { spawnAgent, readAgent, type ShoppingResult } from '@/lib/fleet/replicas'
import { FALLBACK_PRODUCTS } from '@/lib/fleet/fallback'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Pick a canned product whose category best matches the free-text query.
function mockResult(query: string): ShoppingResult {
  const q = query.toLowerCase()
  const map: Array<[string[], string]> = [
    [['sofa', 'couch', 'sectional', 'loveseat'], 'sofa'],
    [['coffee table', 'side table', 'table', 'desk'], 'coffee_table'],
    [['rug', 'carpet'], 'rug'],
    [['lamp', 'light', 'lighting'], 'floor_lamp'],
    [['chair', 'armchair', 'stool', 'seat'], 'accent_chair'],
    [['art', 'painting', 'print', 'poster', 'frame'], 'wall_art'],
    [['plant', 'tree', 'greenery'], 'plant'],
    [['book', 'shelf', 'shelving', 'storage', 'cabinet'], 'bookshelf'],
  ]
  for (const [keys, slot] of map) {
    if (keys.some((k) => q.includes(k))) return FALLBACK_PRODUCTS[slot]
  }
  return FALLBACK_PRODUCTS.accent_chair
}

function prompt(query: string): string {
  return [
    `You are an expert interior-design shopping agent.`,
    `Find ONE real, currently-purchasable item matching this request: "${query}".`,
    `Use your browser to search real retailers (IKEA, Wayfair, West Elm, CB2, Article, Target, Amazon) and open the actual product page.`,
    `Return ONLY a single-line JSON object as the FINAL line: {"name":string,"price_usd":number,"retailer":string,"product_url":string,"image_url":string,"why":string}.`,
    `Nothing after the JSON.`,
  ].join('\n')
}

export async function POST(req: NextRequest) {
  let body: { query?: string; mock?: boolean }
  try {
    body = await req.json()
  } catch {
    body = {}
  }
  const query = (body.query || '').trim()
  if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 })

  if (body.mock) {
    return NextResponse.json({ result: mockResult(query), source: 'mock' })
  }

  try {
    const agentId = await spawnAgent('chat-shop', prompt(query))
    // Poll up to ~100s for the agent to return a product.
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 2500))
      const snap = await readAgent(agentId)
      if (snap.status === 'done' && snap.result) {
        return NextResponse.json({ result: snap.result, source: 'agent', agentId })
      }
    }
  } catch {
    /* fall through to mock */
  }
  return NextResponse.json({ result: mockResult(query), source: 'fallback' })
}
