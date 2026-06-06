'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { RoomStudio } from '../components/RoomStudio'

export default function StudioPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f9f7f3] to-[#fefdfc] px-6 py-12 text-[#1a1a1a]">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex items-end justify-between"
        >
          <div>
            <h1 className="serif text-4xl leading-tight text-[#1a1a1a]">Compose Your Interior</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-500">
              Upload a photo of your room. We rebuild it in 3D, then a swarm of agents shops the
              real web to furnish it — just ask.
            </p>
          </div>
          <Link
            href="/gallery"
            className="rounded-lg border-2 border-[#c7a564] px-5 py-2.5 text-sm font-semibold text-[#a6803f] transition-colors hover:bg-[#c7a564] hover:text-white"
          >
            Saved Rooms
          </Link>
        </motion.div>

        <RoomStudio />
      </div>
    </main>
  )
}
