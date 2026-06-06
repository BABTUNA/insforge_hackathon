'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { SwarmBoard } from './SwarmBoard'
import { startFleet, subscribeFleet, type SlotView } from '@/lib/fleet/client'

type FurnishPanelProps = {
  selectedStyles: string[]
}

type Phase = 'config' | 'running' | 'done'

const FLEET_SIZE = 6

export function FurnishPanel({ selectedStyles }: FurnishPanelProps) {
  const [phase, setPhase] = useState<Phase>('config')
  const [budget, setBudget] = useState(3000)
  const [slots, setSlots] = useState<SlotView[]>([])
  const [summary, setSummary] = useState<{ found: number; total: number } | null>(null)
  const [error, setError] = useState('')
  const cleanupRef = useRef<(() => void) | null>(null)

  const launch = async () => {
    setError('')
    setSummary(null)
    setPhase('running')
    try {
      const res = await startFleet({ styles: selectedStyles, budget, fleetSize: FLEET_SIZE })
      setSlots(res.slots)
      cleanupRef.current = subscribeFleet(res.runId, {
        onUpdate: (s) => setSlots(s),
        onDone: (s, sum) => {
          setSlots(s)
          setSummary(sum)
          setPhase('done')
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
            onClick={launch}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-8 w-full rounded-lg bg-[#c7a564] px-6 py-4 text-base font-semibold text-white shadow-lg transition-colors hover:bg-[#b89050]"
          >
            Furnish my room → launch {FLEET_SIZE} agents
          </motion.button>
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
            <p className="text-sm text-gray-600">
              Fleet complete — <span className="font-semibold text-[#1a1a1a]">{summary?.found}</span> real pieces
              sourced for <span className="font-semibold text-[#c7a564]">${summary?.total.toLocaleString()}</span>.
            </p>
            <button
              onClick={reset}
              className="rounded-lg border-2 border-[#c7a564] px-6 py-2.5 text-sm font-semibold text-[#a6803f] transition-colors hover:bg-[#c7a564] hover:text-white"
            >
              Run again
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
