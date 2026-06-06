import { NextRequest, NextResponse } from 'next/server'
import { spawnAgent, readAgent, type ShoppingResult } from '@/lib/fleet/replicas'
import { parseMaxPrice, pickFromCatalog } from '@/lib/fleet/catalog'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function prompt(query: string, maxPrice: number | null): string {
  const budget = maxPrice
    ? `HARD BUDGET: the price MUST be at most $${maxPrice} USD. Do not return anything above $${maxPrice}.`
    : ''
  return [
    `You are an expert interior-design shopping agent.`,
    `Find ONE real, currently-purchasable item matching this request: "${query}".`,
    budget,
    `Use your browser to search real retailers (IKEA, Wayfair, West Elm, CB2, Article, Target, Amazon) and open the actual product page to confirm the price.`,
    `Return ONLY a single-line JSON object as the FINAL line of your reply, exactly:`,
    `{"name":string,"price_usd":number,"retailer":string,"product_url":string,"image_url":string,"why":string}`,
    `price_usd must be a number (no "$"). Output nothing after the JSON.`,
  ]
    .filter(Boolean)
    .join('\n')
}

function valid(r: ShoppingResult | null, maxPrice: number | null): r is ShoppingResult {
  if (!r || typeof r.name !== 'string' || !r.name.trim()) return false
  const price = Number(r.price_usd)
  if (!Number.isFinite(price) || price <= 0) return false
  if (maxPrice != null && price > maxPrice * 1.02) return false // enforce budget (2% tolerance)
  return true
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

  const maxPrice = parseMaxPrice(query)

  // Mock mode: instant, reliable, in-budget.
  if (body.mock) {
    return NextResponse.json({ result: pickFromCatalog(query, maxPrice), source: 'mock' })
  }

  // Live: one agent, polled, with strict validation. Fall back to the catalog
  // (category + budget aware) on timeout / over-budget / unparseable result.
  try {
    const agentId = await spawnAgent('chat-shop', prompt(query, maxPrice))
    for (let i = 0; i < 32; i++) {
      await new Promise((r) => setTimeout(r, 2500)) // ~80s ceiling
      const snap = await readAgent(agentId)
      if (snap.status === 'done') {
        const got = snap.result?.price_usd
        if (valid(snap.result, maxPrice)) {
          return NextResponse.json({ result: snap.result, source: 'agent' })
        }
        // Agent finished but result is missing/over-budget → reliable fallback.
        console.warn(`[research] agent result rejected (maxPrice=${maxPrice}, got=${got}) → catalog`)
        break
      }
    }
  } catch (err) {
    console.error(`[research] agent error → catalog: ${err instanceof Error ? err.message : err}`)
  }

  return NextResponse.json({ result: pickFromCatalog(query, maxPrice), source: 'fallback' })
}
