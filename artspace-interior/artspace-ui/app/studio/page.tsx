import Link from 'next/link'
import { Search, Bell, ChevronDown } from 'lucide-react'
import { RoomStudio } from '../components/RoomStudio'

export default function StudioPage() {
  return (
    <main className="min-h-screen w-full bg-[#d2d0cc] p-3 sm:p-5">
      <div className="mx-auto w-full max-w-[1500px] rounded-[28px] bg-[#1a1813] p-5 text-[#f4f2ec] shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:p-7">
        {/* Top nav */}
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/studio" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#cdd1a0] text-[#1a1813]">
                <span className="text-lg font-bold leading-none">R</span>
              </span>
              <span className="text-[17px] font-semibold tracking-tight">RoomSwarm.</span>
            </Link>
            <div className="hidden items-center gap-7 text-[14px] text-[#8f8c80] lg:flex">
              <Link href="/studio" className="text-[#f4f2ec]">Studio</Link>
              <Link href="/gallery" className="transition-colors hover:text-[#f4f2ec]">Saved Rooms</Link>
              <span className="cursor-default">Drivers</span>
              <span className="cursor-default">Docs</span>
              <span className="cursor-default">Analytics</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-[#cfccc2] transition-colors hover:bg-white/5">
              <Search className="h-[18px] w-[18px]" />
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-[#cfccc2] transition-colors hover:bg-white/5">
              <Bell className="h-[18px] w-[18px]" />
            </button>
            <div className="flex items-center gap-2.5 rounded-full border border-white/10 py-1 pl-1 pr-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#cdd1a0] to-[#8f9466] text-xs font-bold text-[#1a1813]">
                RS
              </span>
              <div className="hidden leading-tight sm:block">
                <div className="text-[13px] font-semibold">Studio</div>
                <div className="text-[11px] text-[#8f8c80]">Interior Designer</div>
              </div>
              <ChevronDown className="h-4 w-4 text-[#8f8c80]" />
            </div>
          </div>
        </nav>

        {/* Workspace (header row + two-column main) */}
        <RoomStudio />
      </div>
    </main>
  )
}
