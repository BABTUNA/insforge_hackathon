'use client'

import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { SwarmBoard } from './SwarmBoard'
import { ThreeDViewer } from './3DViewer'
import { startFleet, subscribeFleet, type SlotView } from '@/lib/fleet/client'
import type { FurnitureItem } from '@/lib/furniture-api'

type FurnishPanelProps = {
  selectedStyles: string[]
  floorplanImage?: string
}

type Phase = 'config' | 'running' | 'done'

const FLEET_SIZE = 6

// Map a swarm slot to the furniture "type" the 3D generator understands.
const SLOT_TO_TYPE: Record<string, string> = {
  sofa: 'sofa',
  coffee_table: 'coffee table',
  rug: 'rug',
  floor_lamp: 'floor lamp',
  accent_chair: 'accent chair',
  wall_art: 'painting',
  plant: 'plant',
  bookshelf: 'bookshelf',
}

export function FurnishPanel({ selectedStyles, floorplanImage }: FurnishPanelProps) {
  const [phase, setPhase] = useState<Phase>('config')
  const [budget, setBudget] = useState(3000)
  const [slots, setSlots] = useState<SlotView[]>([])
  const [summary, setSummary] = useState<{ found: number; total: number } | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [show3D, setShow3D] = useState(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  // Done products mapped to furniture items the 3D viewer can render.
  const furnitureItems = useMemo<FurnitureItem[]>(
    () =>
      slots
        .filter((s) => s.status === 'done' && s.result)
        .map((s) => ({
          id: s.key,
          name: s.result!.name,
          category: 'furniture',
          subcategory: SLOT_TO_TYPE[s.key] || s.label.toLowerCase(),
          model_url: '',
          styleTags: selectedStyles,
        })),
    [slots, selectedStyles]
  )

  const saveDesign = async (finalSlots: SlotView[], sum: { found: number; total: number }) => {
    setSaved('saving')
    try {
      const items = finalSlots
        .filter((s) => s.status === 'done' && s.result)
        .map((s) => ({ key: s.key, label: s.label, icon: s.icon, result: s.result }))
      await fetch('/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ styles: selectedStyles, budget, total: sum.total, found: sum.found, items }),
      })
      setSaved('saved')
    } catch {
      setSaved('idle')
    }
  }

  const launch = async (demo = false) => {
    setError('')
    setSummary(null)
    setSaved('idle')
    setShow3D(false)
    setPhase('running')
    try {
      const res = await startFleet({ styles: selectedStyles, budget, fleetSize: FLEET_SIZE, demo })
      setSlots(res.slots)
      cleanupRef.current = subscribeFleet(res.runId, {
        onUpdate: (s) => setSlots(s),
        onDone: (s, sum) => {
          setSlots(s)
          setSummary(sum)
          setPhase('done')
          void saveDesign(s, sum)
        },
        onError: (msg) => setError(msg),
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start the fleet')
      setPhase('config')
    }
  }

  const reset = () => {
    cleanupRef.current?.()
    setPhase('config')
    setSlots([])
    setSummary(null)
    setError('')
    setShow3D(false)
  }

  if (phase === 'config') {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-2xl border border-[#e6e2da] bg-white p-8 shadow-sm">
          <h3 className="serif text-2xl text-[#1a1a1a]">Dispatch the design swarm</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            {FLEET_SIZE} autonomous agents will fan out across real furniture retailers — one per piece —
            and shop the live web to furnish your room within budget.
          </p>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Total budget</span>
              <span className="serif text-xl text-[#c7a564]">${budget.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={800}
              max={10000}
              step={100}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full accent-[#c7a564]"
            />
            <div className="flex justify-between text-[11px] text-gray-400">
              <span>$800</span>
              <span>$10,000</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 text-sm font-medium text-gray-700">Your taste</div>
            <div className="flex flex-wrap gap-2">
              {(selectedStyles.length ? selectedStyles : ['modern']).map((s) => (
                <span key={s} className="rounded-full bg-[#f4eedd] px-3 py-1 text-xs font-medium text-[#a6803f]">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-rose-500">{error}</p>}

          <motion.button
            onClick={() => launch(false)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-8 w-full rounded-lg bg-[#c7a564] px-6 py-4 text-base font-semibold text-white shadow-lg transition-colors hover:bg-[#b89050]"
          >
            Furnish my room → launch {FLEET_SIZE} agents
          </motion.button>
          <button
            onClick={() => launch(true)}
            className="mt-3 w-full text-center text-xs text-gray-400 hover:text-[#a6803f]"
          >
            Run simulated demo (no live agents)
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="rounded-2xl border border-[#e6e2da] bg-[#fcfbf8] p-6 shadow-sm sm:p-8">
        <SwarmBoard slots={slots} running={phase === 'running'} />

        {phase === 'done' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex flex-col items-center gap-4 border-t border-[#ece6da] pt-6 sm:flex-row sm:justify-between"
          >
            <div className="text-sm text-gray-600">
              <p>
                Fleet complete — <span className="font-semibold text-[#1a1a1a]">{summary?.found}</span> real pieces
                sourced for <span className="font-semibold text-[#c7a564]">${summary?.total.toLocaleString()}</span>.
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {saved === 'saving' && 'Saving design to InsForge…'}
                {saved === 'saved' && (
                  <>
                    Saved to your{' '}
                    <a href="/gallery" className="font-medium text-[#a6803f] underline underline-offset-2">
                      gallery
                    </a>
                    .
                  </>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              {!show3D && (
                <button
                  onClick={() => setShow3D(true)}
                  className="rounded-lg bg-[#c7a564] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#b89050]"
                >
                  View your room in 3D →
                </button>
              )}
              <button
                onClick={reset}
                className="rounded-lg border-2 border-[#c7a564] px-6 py-2.5 text-sm font-semibold text-[#a6803f] transition-colors hover:bg-[#c7a564] hover:text-white"
              >
                Run again
              </button>
            </div>
          </motion.div>
        )}

        {phase === 'done' && show3D && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 border-t border-[#ece6da] pt-6"
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className="serif text-lg text-[#1a1a1a]">Your room in 3D</h4>
              <span className="text-xs text-gray-400">furniture models generated by AI · drag to orbit</span>
            </div>
            <div className="h-[460px] w-full overflow-hidden rounded-xl">
              <ThreeDViewer
                floorplanImage={floorplanImage || ''}
                selectedStyles={selectedStyles}
                furnitureItems={furnitureItems}
                roomType="living_room"
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
