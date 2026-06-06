'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trash2, Box } from 'lucide-react'

type Item = {
  label?: string
  result?: { name?: string; price_usd?: number; image_url?: string; product_url?: string }
}
export type Design = {
  id: string
  found?: number
  total?: number
  items?: Item[]
}

const money = (n?: number) => `$${Math.round(Number(n) || 0).toLocaleString()}`

// <img> that hides itself and shows an icon placeholder when the URL 404s.
function SafeImg({ src, alt }: { src?: string; alt?: string }) {
  const [ok, setOk] = useState(Boolean(src))
  if (!ok) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black/[0.06] text-[#bbb]">
        <Box className="h-5 w-5" />
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt || ''}
      className="h-full w-full object-cover transition-transform group-hover:scale-105"
      onError={() => setOk(false)}
    />
  )
}

export function GalleryGrid({ designs }: { designs: Design[] }) {
  const [list, setList] = useState(designs)
  const [busy, setBusy] = useState<string | null>(null)

  const remove = async (id: string) => {
    if (busy) return
    setBusy(id)
    try {
      const res = await fetch(`/api/designs/${id}`, { method: 'DELETE' })
      if (res.ok) setList((l) => l.filter((d) => d.id !== id))
    } finally {
      setBusy(null)
    }
  }

  if (list.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-black/10 bg-black/[0.035] p-16 text-center text-[#6b6b6b]">
        No saved rooms yet. Furnish one in the studio to see it here.
      </div>
    )
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {list.map((d) => (
        <div key={d.id} className="rounded-3xl border border-black/[0.08] bg-white p-6">
          <div className="mb-4 flex items-center justify-between text-sm text-[#6b6b6b]">
            <span>
              <span className="font-semibold text-[#111]">{d.found ?? d.items?.length ?? 0}</span> pieces ·{' '}
              <span className="font-semibold text-[#ff22cc]">{money(d.total)}</span>
            </span>
            <div className="flex items-center gap-2">
              <Link
                href={`/studio?room=${d.id}`}
                className="rounded-full bg-[#ff22cc] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#d600a8]"
              >
                Open in studio →
              </Link>
              <button
                onClick={() => remove(d.id)}
                disabled={busy === d.id}
                aria-label="Delete room"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-[#6b6b6b] transition-colors hover:border-rose-300 hover:text-rose-500 disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
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
                  <SafeImg src={it.result?.image_url} alt={it.result?.name} />
                </div>
                <div className="mt-1.5 truncate text-[11px] font-medium text-[#444]">{it.label}</div>
                <div className="text-[11px] text-[#ff22cc]">{money(it.result?.price_usd)}</div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
