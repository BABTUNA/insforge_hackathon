import { NextRequest, NextResponse } from 'next/server'
import { insforgeAdmin } from '@/lib/insforge-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Load one saved design (room + furniture) for resuming in the studio.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { data, error } = await insforgeAdmin.database.from('designs').select('*').eq('id', id).limit(1)
  if (error) {
    return NextResponse.json({ error: error.message || 'Load failed' }, { status: 500 })
  }
  const design = Array.isArray(data) ? data[0] : null
  if (!design) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(design)
}
