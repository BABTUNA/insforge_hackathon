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
    <main className="min-h-screen w-full bg-[#ffffff] px-6 py-6 text-[#111111] sm:px-9">
      <div className="w-full">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="serif text-[40px] font-semibold leading-none tracking-tight">Saved Rooms</h1>
            <span className="rounded-full bg-black/[0.04] px-3.5 py-1.5 text-base text-[#ff22cc]">{designs.length}</span>
          </div>
          <Link
            href="/studio"
            className="rounded-full bg-[#ff22cc] px-6 py-3 text-base font-semibold text-[#ffffff] transition-colors hover:bg-[#d600a8]"
          >
            + Furnish a new room
          </Link>
        </div>

        {designs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-black/10 bg-black/[0.035] p-16 text-center text-[#6b6b6b]">
            No saved rooms yet. Furnish one in the studio to see it here.
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {designs.map((d) => (
              <div key={d.id} className="rounded-3xl border border-black/[0.08] bg-[#ffffff] p-6">
                <div className="mb-4 flex items-center justify-between text-sm text-[#6b6b6b]">
                  <span>
                    <span className="font-semibold text-[#111111]">{d.found}</span> pieces ·{' '}
                    <span className="font-semibold text-[#ff22cc]">{money(d.total)}</span>
                  </span>
                  <Link
                    href={`/studio?room=${d.id}`}
                    className="rounded-full bg-[#ff22cc] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#d600a8]"
                  >
                    Open in studio →
                  </Link>
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
                      <div className="aspect-square overflow-hidden rounded-2xl border border-black/10 bg-black/[0.035]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={it.result?.image_url}
                          alt={it.result?.name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <div className="mt-1.5 truncate text-[11px] font-medium text-[#444444]">{it.label}</div>
                      <div className="text-[11px] text-[#ff22cc]">{money(it.result?.price_usd)}</div>
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
