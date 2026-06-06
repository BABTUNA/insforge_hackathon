import Link from 'next/link'
import { insforgeAdmin, type SavedDesign } from '@/lib/insforge-server'
import { GalleryGrid, type Design } from '../components/GalleryGrid'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function getDesigns(): Promise<SavedDesign[]> {
  const { data, error } = await insforgeAdmin.database
    .from('designs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) return []
  return (data ?? []) as SavedDesign[]
}

export default async function GalleryPage() {
  const designs = await getDesigns()

  return (
    <main className="min-h-screen w-full bg-white px-6 py-6 text-[#111] sm:px-9">
      <div className="w-full">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="serif text-[40px] font-semibold leading-none tracking-tight">Saved Rooms</h1>
            <span className="rounded-full bg-black/[0.04] px-3.5 py-1.5 text-base text-[#ff22cc]">{designs.length}</span>
          </div>
          <Link
            href="/studio"
            className="rounded-full bg-[#ff22cc] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#d600a8]"
          >
            + Furnish a new room
          </Link>
        </div>

        <GalleryGrid designs={designs as unknown as Design[]} />
      </div>
    </main>
  )
}
