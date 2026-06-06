'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { SlotView } from '@/lib/fleet/client'

type SwarmBoardProps = {
  slots: SlotView[]
  running: boolean
}

const statusMeta: Record<SlotView['status'], { label: string; dot: string; ring: string }> = {
  spawning: { label: 'Spawning', dot: 'bg-gray-400', ring: 'border-gray-200' },
  working: { label: 'Shopping', dot: 'bg-[#c7a564]', ring: 'border-[#e3d3aa]' },
  done: { label: 'Found', dot: 'bg-emerald-500', ring: 'border-emerald-200' },
  error: { label: 'No luck', dot: 'bg-rose-400', ring: 'border-rose-200' },
}

function money(n: number) {
  return `$${Math.round(n).toLocaleString()}`
}

export function SwarmBoard({ slots, running }: SwarmBoardProps) {
  const done = slots.filter((s) => s.status === 'done')
  const total = done.reduce((sum, s) => sum + (Number(s.result?.price_usd) || 0), 0)
  const progress = slots.length ? Math.round((done.length / slots.length) * 100) : 0

  return (
    <div className="w-full">
      {/* Header / progress */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="serif text-2xl text-[#1a1a1a]">
              {running ? 'The swarm is shopping…' : 'Your room, furnished'}
            </h3>
            <p className="text-sm text-gray-500">
              {done.length} of {slots.length} pieces sourced from real retailers
            </p>
          </div>
          <div className="text-right">
            <div className="serif text-3xl text-[#c7a564]">{money(total)}</div>
            <div className="text-xs uppercase tracking-wide text-gray-400">cart total</div>
          </div>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#efe9dd]">
          <motion.div
            className="h-full rounded-full bg-[#c7a564]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Agent grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {slots.map((slot, i) => {
          const meta = statusMeta[slot.status]
          return (
            <motion.div
              key={slot.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className={`relative flex flex-col rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${meta.ring}`}
            >
              {/* Top row: agent identity + status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{slot.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-[#1a1a1a]">{slot.label}</div>
                    <div className="text-[11px] text-gray-400">agent · under {money(slot.budget)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${meta.dot} ${slot.status === 'working' ? 'animate-pulse' : ''}`} />
                  <span className="text-[11px] font-medium text-gray-500">{meta.label}</span>
                </div>
              </div>

              {/* Body */}
              <div className="mt-3 min-h-[88px]">
                <AnimatePresence mode="wait">
                  {slot.status === 'done' && slot.result ? (
                    <motion.a
                      key="result"
                      href={slot.result.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex gap-3"
                    >
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-[#f4f1ea]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={slot.result.image_url}
                          alt={slot.result.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            ;(e.currentTarget as HTMLImageElement).style.opacity = '0'
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-[#1a1a1a]">{slot.result.name}</div>
                        <div className="text-sm font-semibold text-[#c7a564]">{money(slot.result.price_usd)}</div>
                        <div className="truncate text-[11px] text-gray-400">{slot.result.retailer} →</div>
                      </div>
                    </motion.a>
                  ) : slot.status === 'error' ? (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex h-full items-center text-xs text-rose-400"
                    >
                      Couldn’t source this piece in time.
                    </motion.div>
                  ) : (
                    <motion.div
                      key="working"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex h-full flex-col justify-center gap-2"
                    >
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#e3d3aa] border-t-[#c7a564]" />
                        <span className="truncate">{slot.activity}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded bg-[#f4f1ea]">
                        <div className="h-full w-1/3 animate-[shimmer_1.2s_infinite] rounded bg-[#e3d3aa]" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {slot.status === 'done' && slot.result?.why && (
                <p className="mt-2 border-t border-[#f0ece3] pt-2 text-[11px] italic text-gray-400">
                  “{slot.result.why}”
                </p>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
