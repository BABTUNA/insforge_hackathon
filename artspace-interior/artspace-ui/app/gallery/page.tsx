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
    <main className="min-h-screen bg-gradient-to-b from-[#f9f7f3] to-[#fefdfc] px-6 py-16 text-[#1a1a1a]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h1 className="serif text-4xl">Saved Rooms</h1>
            <p className="mt-2 text-sm text-gray-500">
              Every design furnished by the agent swarm, persisted in InsForge.
            </p>
          </div>
          <Link
            href="/studio"
            className="rounded-lg bg-[#c7a564] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#b89050]"
          >
            + Furnish a new room
          </Link>
        </div>

        {designs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d9cfb8] bg-white/60 p-16 text-center text-gray-400">
            No saved rooms yet. Run the swarm in the studio to create one.
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {designs.map((d) => (
              <div key={d.id} className="rounded-2xl border border-[#e6e2da] bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {(d.styles ?? []).map((s) => (
                      <span key={s} className="rounded-full bg-[#f4eedd] px-3 py-1 text-xs font-medium text-[#a6803f]">
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-gray-500">
                    <span className="font-semibold text-[#1a1a1a]">{d.found}</span> pieces ·{' '}
                    <span className="font-semibold text-[#c7a564]">{money(d.total)}</span> · budget {money(d.budget)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {(d.items ?? []).map((it, i) => (
                    <a
                      key={`${d.id}-${i}`}
                      href={it.result?.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block"
                    >
                      <div className="aspect-square overflow-hidden rounded-lg bg-[#f4f1ea]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={it.result?.image_url}
                          alt={it.result?.name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <div className="mt-1 truncate text-[11px] font-medium text-gray-700">{it.label}</div>
                      <div className="text-[11px] text-[#c7a564]">{money(it.result?.price_usd)}</div>
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
