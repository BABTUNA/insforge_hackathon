import Link from 'next/link'
import { insforgeAdmin, type SavedDesign } from '@/lib/insforge-server'

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

function money(n: number) {
  return `$${Math.round(Number(n) || 0).toLocaleString()}`
}

export default async function GalleryPage() {
  const designs = await getDesigns()

  return (
    <main className="min-h-screen w-full bg-[#d2d0cc] p-3 sm:p-5">
      <div className="mx-auto w-full max-w-[1500px] rounded-[28px] bg-[#1a1813] p-5 text-[#f4f2ec] shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:p-7">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">Saved Rooms</h1>
            <span className="rounded-full bg-white/5 px-3 py-1 text-sm text-[#cdd1a0]">{designs.length}</span>
          </div>
          <Link
            href="/studio"
            className="rounded-full bg-[#cdd1a0] px-5 py-2.5 text-sm font-semibold text-[#1a1813] transition-colors hover:bg-[#d8dcb0]"
          >
            + Furnish a new room
          </Link>
        </div>

        {designs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-black/20 p-16 text-center text-[#8f8c80]">
            No saved rooms yet. Furnish one in the studio to see it here.
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {designs.map((d) => (
              <div key={d.id} className="rounded-3xl border border-white/[0.06] bg-[#211f17] p-6">
                <div className="mb-4 flex items-center justify-between text-sm text-[#8f8c80]">
                  <span>
                    <span className="font-semibold text-[#f4f2ec]">{d.found}</span> pieces
                  </span>
                  <span className="font-semibold text-[#cdd1a0]">{money(d.total)}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {(d.items ?? []).map((it, i) => (
                    <a
                      key={`${d.id}-${i}`}
                      href={it.result?.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block"
                    >
                      <div className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={it.result?.image_url}
                          alt={it.result?.name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <div className="mt-1.5 truncate text-[11px] font-medium text-[#cfccc2]">{it.label}</div>
                      <div className="text-[11px] text-[#cdd1a0]">{money(it.result?.price_usd)}</div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
