'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { RoomStudio } from '../components/RoomStudio'

export default function StudioPage() {
  return (
    <main className="min-h-screen bg-white px-6 pb-20 pt-6 text-[#111]">
      {/* top nav — eventual style: mono, lowercase, magenta square */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between text-sm lowercase tracking-tight">
        <Link href="/studio" className="flex items-center gap-1 font-semibold">
          roomswarm<span className="accent-square" />
        </Link>
        <div className="flex items-center gap-8 text-[#111]">
          <Link href="/studio" className="hover:text-[var(--accent)]">studio</Link>
          <Link href="/gallery" className="hover:text-[var(--accent)]">saved rooms</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl">
        {/* hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="py-14 text-center"
        >
          <h1 className="serif text-6xl leading-[1.05] tracking-tight text-[#111] md:text-7xl">
            Furnish it with a swarm
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-[#444] md:text-base">
            Upload a photo of your room. We rebuild it in 3D, then a swarm of agents shops the real
            web to furnish it — just ask.
          </p>
        </motion.div>

        <RoomStudio />
      </div>
    </main>
  )
}
