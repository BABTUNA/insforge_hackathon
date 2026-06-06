import Link from 'next/link'
import { Search, Bell, ChevronDown } from 'lucide-react'
import { RoomStudio } from '../components/RoomStudio'

export default function StudioPage() {
  return (
    <main className="min-h-screen w-full bg-[#ffffff] px-6 py-5 text-[#111111] sm:px-9 sm:py-6">
      {/* Top nav */}
      <nav className="flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/studio" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff22cc] text-[#ffffff]">
              <span className="text-xl font-bold leading-none">R</span>
            </span>
            <span className="text-[21px] font-semibold tracking-tight">RoomSwarm.</span>
          </Link>
          <div className="hidden items-center gap-8 text-[16px] text-[#6b6b6b] lg:flex">
            <Link href="/studio" className="text-[#111111]">Studio</Link>
            <Link href="/gallery" className="transition-colors hover:text-[#111111]">Saved Rooms</Link>
            <span className="cursor-default">Drivers</span>
            <span className="cursor-default">Docs</span>
            <span className="cursor-default">Analytics</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 text-[#444444] transition-colors hover:bg-black/[0.04]">
            <Search className="h-5 w-5" />
          </button>
          <button className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 text-[#444444] transition-colors hover:bg-black/[0.04]">
            <Bell className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2.5 rounded-full border border-black/10 py-1 pl-1 pr-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#ff22cc] to-[#d600a8] text-sm font-bold text-[#ffffff]">
              RS
            </span>
            <div className="hidden leading-tight sm:block">
              <div className="text-[15px] font-semibold">Studio</div>
              <div className="text-[12px] text-[#6b6b6b]">Interior Designer</div>
            </div>
            <ChevronDown className="h-4 w-4 text-[#6b6b6b]" />
          </div>
        </div>
      </nav>

      {/* Workspace (header row + two-column main) */}
      <RoomStudio />
    </main>
  )
}
