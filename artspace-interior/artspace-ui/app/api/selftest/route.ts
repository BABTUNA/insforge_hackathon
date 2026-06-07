import { NextResponse } from 'next/server'
import * as THREE from 'three'
import { fallbackCode } from '@/lib/three/fallback-furniture'
import { FALLBACK_ROOM } from '@/lib/three/fallback-room'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function tryRun(src: string, fn: string) {
  try {
    const f = new Function('THREE', `${src}\nreturn (typeof ${fn} === 'function') ? ${fn}() : null`)
    const r = f(THREE)
    if (!r) return 'null'
    const isObj = r instanceof THREE.Object3D
    return `ok isObject3D=${isObj} children=${r.children?.length ?? '?'}`
  } catch (e) {
    return 'ERR: ' + (e instanceof Error ? e.message : String(e))
  }
}

export async function GET() {
  const cats = ['sofa', 'coffee_table', 'rug', 'floor_lamp', 'accent_chair', 'wall_art', 'plant', 'bookshelf']
  const furniture = cats.map((c) => ({ cat: c, result: tryRun(fallbackCode(c), 'createFurniture') }))
  const room = tryRun(FALLBACK_ROOM, 'createCompleteRoom')
  return NextResponse.json({ room, furniture })
}
