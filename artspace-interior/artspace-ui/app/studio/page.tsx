'use client'

import Link from 'next/link'
import { RoomStudio } from '../components/RoomStudio'

export default function StudioPage() {
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-white text-[#111]">
      {/* slim top bar — eventual style */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#111]/10 px-6">
        <Link href="/studio" className="flex items-center gap-1 text-sm font-semibold lowercase tracking-tight">
          roomswarm<span className="accent-square" />
        </Link>
        <div className="hidden items-baseline gap-2 text-[13px] text-gray-500 sm:flex">
          <span className="text-[#111]">photo</span>
          <span className="text-gray-300">→</span>
          <span className="text-[#111]">3d room</span>
          <span className="text-gray-300">→</span>
          <span className="text-[#ff22cc]">furnished by a swarm</span>
        </div>
        <nav className="flex items-center gap-6 text-[13px] lowercase">
          <Link href="/studio" className="hover:text-[#ff22cc]">studio</Link>
          <Link href="/gallery" className="hover:text-[#ff22cc]">saved rooms</Link>
        </nav>
      </header>

      {/* workspace fills the rest of the viewport (explicit height so the 3D canvas resolves) */}
      <div className="h-[calc(100vh-3.5rem)] w-full">
        <RoomStudio />
      </div>
    </main>
  )
}
