import { NextRequest, NextResponse } from 'next/server'
import { insforgeAdmin } from '@/lib/insforge-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Save a furnished-room design to InsForge.
export async function POST(req: NextRequest) {
  let body: {
    styles?: string[]
    budget?: number
    total?: number
    found?: number
    items?: unknown[]
    room_code?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const row = {
    styles: body.styles ?? [],
    budget: Number(body.budget) || 0,
    total: Number(body.total) || 0,
    found: Number(body.found) || 0,
    items: body.items ?? [],
    room_code: body.room_code ?? null,
  }

  const { data, error } = await insforgeAdmin.database.from('designs').insert([row]).select()
  if (error) {
    return NextResponse.json({ error: error.message || 'Save failed' }, { status: 500 })
  }
  return NextResponse.json({ id: Array.isArray(data) ? data[0]?.id : undefined })
}

// List recent designs (newest first).
export async function GET() {
  const { data, error } = await insforgeAdmin.database
    .from('designs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message || 'Load failed' }, { status: 500 })
  }
  return NextResponse.json({ designs: data ?? [] })
}
