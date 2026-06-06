'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Upload,
  Sparkles,
  Send,
  Loader2,
  RotateCcw,
  Box,
  Trash2,
  MoreHorizontal,
  Check,
} from 'lucide-react'

type Phase = 'upload' | 'generating' | 'room'

type Product = {
  name: string
  price_usd: number
  retailer: string
  product_url: string
  image_url: string
  why?: string
}

type Item = Product & { id: number; category: string }

let itemId = 0

const CATEGORY = (q: string): string => {
  const s = q.toLowerCase()
  if (/(sofa|couch|sectional)/.test(s)) return 'Sofa'
  if (/(coffee|side|desk|table)/.test(s)) return 'Table'
  if (/(rug|carpet)/.test(s)) return 'Rug'
  if (/(lamp|light)/.test(s)) return 'Light'
  if (/(chair|armchair|stool)/.test(s)) return 'Chair'
  if (/(art|paint|print|poster)/.test(s)) return 'Art'
  if (/(plant|tree)/.test(s)) return 'Plant'
  if (/(book|shelf|cabinet|storage)/.test(s)) return 'Shelf'
  return 'Decor'
}

const money = (n: number) => `$${Math.round(Number(n) || 0).toLocaleString()}`

export function RoomStudio() {
  const hostRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const roomRootRef = useRef<THREE.Group | null>(null)
  const addedObjectsRef = useRef<Map<number, THREE.Object3D>>(new Map())
  const addedCountRef = useRef(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const [phase, setPhase] = useState<Phase>('upload')
  const [imageData, setImageData] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState('')
  const [mock, setMock] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [activity, setActivity] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  // --- Three.js bootstrap --------------------------------------------------
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const w = host.clientWidth || 800
    const h = host.clientHeight || 600

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    host.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x201e16)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 500)
    camera.position.set(5, 3, 5)
    camera.lookAt(0, 1, 0)
    cameraRef.current = camera

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.target.set(0, 1, 0)
    controls.maxPolarAngle = Math.PI / 2 + 0.05
    controlsRef.current = controls

    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const key = new THREE.DirectionalLight(0xffffff, 0.7)
    key.position.set(6, 9, 6)
    key.castShadow = true
    scene.add(key)

    let raf = 0
    const animate = () => {
      raf = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const el = hostRef.current
      if (!el || !rendererRef.current || !cameraRef.current) return
      rendererRef.current.setSize(el.clientWidth, el.clientHeight)
      cameraRef.current.aspect = el.clientWidth / el.clientHeight
      cameraRef.current.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(raf)
      controls.dispose()
      renderer.dispose()
      if (renderer.domElement.parentElement) renderer.domElement.parentElement.removeChild(renderer.domElement)
    }
  }, [])

  // --- scene helpers -------------------------------------------------------
  const fitCamera = useCallback((obj: THREE.Object3D) => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    const box = new THREE.Box3().setFromObject(obj)
    if (box.isEmpty()) return
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const maxDim = Math.max(size.x, size.y, size.z)
    const dist = (maxDim / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.5
    const dir = new THREE.Vector3(0.7, 0.5, 0.9).normalize()
    camera.position.copy(center.clone().add(dir.multiplyScalar(dist)))
    camera.far = Math.max(500, dist * 5)
    camera.updateProjectionMatrix()
    controls.target.copy(center)
    controls.update()
  }, [])

  const injectRoom = useCallback(
    (code: string) => {
      const scene = sceneRef.current
      if (!scene) return
      if (roomRootRef.current) {
        scene.remove(roomRootRef.current)
        roomRootRef.current = null
      }
      const root = new THREE.Group()
      const factory = new Function(
        'THREE',
        `${code}\nif (typeof createCompleteRoom === 'function') return createCompleteRoom();\nreturn null;`
      )
      const result = factory(THREE)
      if (result instanceof THREE.Scene) {
        while (result.children.length) {
          const child = result.children.shift()
          if (child) root.add(child)
        }
      } else if (result instanceof THREE.Object3D) {
        root.add(result)
      } else {
        throw new Error('Room code returned no scene')
      }
      root.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          c.castShadow = true
          c.receiveShadow = true
        }
      })
      scene.add(root)
      roomRootRef.current = root
      fitCamera(root)
    },
    [fitCamera]
  )

  const addFurniture = useCallback((code: string): THREE.Object3D | null => {
    const scene = sceneRef.current
    if (!scene) return null
    const factory = new Function(
      'THREE',
      `${code}\nif (typeof createFurniture === 'function') return createFurniture();\nreturn null;`
    )
    const obj = factory(THREE)
    if (!(obj instanceof THREE.Object3D)) return null
    obj.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        c.castShadow = true
        c.receiveShadow = true
      }
    })
    const i = addedCountRef.current++
    obj.position.set(-1.8 + (i % 4) * 1.2, 0, 1.2 - Math.floor(i / 4) * 1.2)
    scene.add(obj)
    return obj
  }, [])

  // --- actions -------------------------------------------------------------
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setImageData(reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const generateRoom = async () => {
    if (!imageData) return
    setPhase('generating')
    setStatusMsg('Reading your room and rebuilding it in 3D…')
    try {
      const res = await fetch('/api/generate-complete-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_data: imageData }),
      })
      const data = await res.json()
      if (!data.code) throw new Error('No room code returned')
      injectRoom(data.code)
      setPhase('room')
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Generation failed')
      setPhase('upload')
    }
  }

  const send = async () => {
    const q = input.trim()
    if (!q || busy || phase !== 'room') return
    setInput('')
    setBusy(true)
    setSaved(false)
    setActivity(mock ? `Finding a match for “${q}”…` : `Agent shopping the web for “${q}”…`)
    try {
      const res = await fetch('/api/furniture/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, mock }),
      })
      const data = await res.json()
      const product: Product | undefined = data.result
      if (!product) throw new Error('No product found')

      setActivity('Building the 3D model into your room…')
      const gen = await fetch('/api/generate-3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ furniture_type: q, style: '', colors: ['neutral'], materials: ['wood'] }),
      })
      const genData = await gen.json()
      const id = itemId++
      const obj = genData.code ? addFurniture(genData.code) : null
      if (obj) addedObjectsRef.current.set(id, obj)
      setItems((prev) => [...prev, { ...product, id, category: CATEGORY(q) }])
    } catch {
      setActivity(null)
    } finally {
      setActivity(null)
      setBusy(false)
    }
  }

  const removeItem = (id: number) => {
    const scene = sceneRef.current
    const obj = addedObjectsRef.current.get(id)
    if (scene && obj) scene.remove(obj)
    addedObjectsRef.current.delete(id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const saveRoom = async () => {
    if (!items.length) return
    try {
      await fetch('/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          styles: [],
          budget: 0,
          total: items.reduce((s, i) => s + (i.price_usd || 0), 0),
          found: items.length,
          items: items.map((i) => ({
            key: String(i.id),
            label: i.category,
            icon: '🛋️',
            result: i,
          })),
        }),
      })
      setSaved(true)
    } catch {
      /* ignore */
    }
  }

  const reset = () => {
    const scene = sceneRef.current
    if (scene && roomRootRef.current) {
      scene.remove(roomRootRef.current)
      roomRootRef.current = null
    }
    addedObjectsRef.current.forEach((o) => scene?.remove(o))
    addedObjectsRef.current.clear()
    addedCountRef.current = 0
    setImageData(null)
    setItems([])
    setActivity(null)
    setPhase('upload')
    setStatusMsg('')
    setSaved(false)
  }

  const total = items.reduce((s, i) => s + (i.price_usd || 0), 0)

  // --- render --------------------------------------------------------------
  return (
    <>
      {/* Header row */}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Studio</h1>
          <span className="rounded-full bg-white/5 px-3 py-1 text-sm text-[#cdd1a0]">{items.length} pieces</span>
        </div>

        {/* phase segmented indicator */}
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/20 p-1 text-sm">
          {(['upload', 'room'] as const).map((p) => {
            const active = phase === p || (p === 'room' && phase === 'generating')
            return (
              <span
                key={p}
                className={`rounded-full px-4 py-1.5 transition-colors ${
                  active ? 'bg-[#cdd1a0] font-medium text-[#1a1813]' : 'text-[#8f8c80]'
                }`}
              >
                {p === 'upload' ? 'Upload' : '3D Room'}
              </span>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-xs text-[#8f8c80]">
            <input type="checkbox" checked={mock} onChange={(e) => setMock(e.target.checked)} className="accent-[#cdd1a0]" />
            mock
          </label>
          {phase === 'room' && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-xs text-[#cfccc2] transition-colors hover:bg-white/5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> New room
            </button>
          )}
        </div>
      </div>

      {/* Main two-column */}
      <div className="mt-5 grid h-[640px] grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">
        {/* 3D viewport card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-[#201e16]">
          <div ref={hostRef} className="absolute inset-0 h-full w-full" />

          <AnimatePresence>
            {phase !== 'room' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-[#1a1813]/80 px-6 backdrop-blur-sm"
              >
                {phase === 'generating' ? (
                  <div className="flex max-w-sm flex-col items-center gap-5 text-center">
                    <Loader2 className="h-7 w-7 animate-spin text-[#cdd1a0]" />
                    <p className="text-xl font-medium">{statusMsg}</p>
                    <p className="text-xs leading-relaxed text-[#8f8c80]">
                      Claude is rebuilding every object as 3D geometry. This takes about a minute.
                    </p>
                  </div>
                ) : (
                  <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#211f17] p-7">
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#cdd1a0]">Step 01</p>
                    <h3 className="mt-2 text-2xl font-semibold">Upload a room photo</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#8f8c80]">
                      We rebuild it as an explorable 3D scene you can furnish.
                    </p>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="mt-5 flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-white/15 bg-black/20 text-[#8f8c80] transition-colors hover:border-[#cdd1a0] hover:text-[#cdd1a0]"
                    >
                      {imageData ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageData} alt="room" className="h-full w-full object-cover" />
                      ) : (
                        <>
                          <Upload className="h-6 w-6" />
                          <span className="text-sm font-medium">Drop or click to upload</span>
                          <span className="text-xs opacity-70">JPEG or PNG</span>
                        </>
                      )}
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
                    {statusMsg && <p className="mt-3 text-sm text-rose-400">{statusMsg}</p>}
                    <button
                      onClick={generateRoom}
                      disabled={!imageData}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#cdd1a0] px-8 py-3 text-sm font-semibold text-[#1a1813] transition-colors hover:bg-[#d8dcb0] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Sparkles className="h-4 w-4" /> Generate my room in 3D
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {phase === 'room' && (
            <p className="pointer-events-none absolute bottom-4 left-5 text-[11px] text-[#8f8c80]">
              drag to orbit · scroll to zoom
            </p>
          )}
        </div>

        {/* Right panel — furniture (cargo-items style) */}
        <aside className="flex flex-col rounded-3xl border border-white/[0.06] bg-[#211f17]">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="text-xl font-semibold">Your Room</h2>
            <button className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-[#8f8c80]">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          {/* summary block */}
          <div className="mx-5 mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs">
            <div>
              <div className="text-[#8f8c80]">Source</div>
              <div className="mt-1 font-medium">Photo</div>
            </div>
            <div>
              <div className="text-[#8f8c80]">Pieces</div>
              <div className="mt-1 font-medium">{items.length}</div>
            </div>
            <div>
              <div className="text-[#8f8c80]">Status</div>
              <div className="mt-1 font-medium text-[#cdd1a0]">{phase === 'room' ? 'Ready' : 'Setup'}</div>
            </div>
          </div>

          {/* furniture list */}
          <div className="mt-4 px-5 text-xs uppercase tracking-wide text-[#8f8c80]">Furniture added</div>
          <div className="dash-scroll mt-2 flex-1 space-y-1.5 overflow-y-auto px-3 pb-2">
            {activity && (
              <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2.5 text-xs text-[#cdd1a0]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="truncate">{activity}</span>
              </div>
            )}
            {items.length === 0 && !activity && (
              <p className="px-2 py-8 text-center text-xs text-[#6c6a5f]">
                {phase === 'room' ? 'Ask the swarm below to add furniture.' : 'Generate a room to start furnishing.'}
              </p>
            )}
            {items.map((it) => (
              <div
                key={it.id}
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[#cdd1a0]">
                  <Box className="h-4 w-4" />
                </span>
                <a href={it.product_url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">{it.name}</div>
                  <div className="text-[11px] text-[#8f8c80]">{it.retailer}</div>
                </a>
                <span className="text-[13px] font-semibold">{money(it.price_usd)}</span>
                <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] text-[#8f8c80]">{it.category}</span>
                <button
                  onClick={() => removeItem(it.id)}
                  className="text-[#6c6a5f] opacity-0 transition-opacity hover:text-rose-400 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* totals */}
          <div className="mx-5 flex items-end justify-between border-t border-white/10 py-4">
            <div>
              <div className="text-[11px] text-[#8f8c80]">Total Pieces</div>
              <div className="text-lg font-semibold">{items.length}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-[#8f8c80]">Estimated Cost</div>
              <div className="text-lg font-semibold text-[#cdd1a0]">{money(total)}</div>
            </div>
          </div>

          <div className="flex gap-2 px-5 pb-4">
            <button
              onClick={saveRoom}
              disabled={!items.length}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/15 py-2.5 text-sm font-medium transition-colors hover:bg-white/5 disabled:opacity-40"
            >
              {saved ? <Check className="h-4 w-4 text-[#cdd1a0]" /> : null}
              {saved ? 'Saved' : 'Save room'}
            </button>
            <a
              href="/gallery"
              className="flex flex-1 items-center justify-center rounded-full border border-white/15 py-2.5 text-sm font-medium transition-colors hover:bg-white/5"
            >
              Gallery
            </a>
          </div>

          {/* request bar (olive accent) */}
          <div className="mx-3 mb-3 flex items-center gap-2 rounded-full bg-[#cdd1a0] p-1.5 pl-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              disabled={phase !== 'room' || busy}
              placeholder={phase === 'room' ? 'Add a walnut coffee table…' : 'Generate a room first'}
              className="flex-1 bg-transparent text-sm text-[#1a1813] placeholder-[#1a1813]/50 outline-none disabled:opacity-60"
            />
            <button
              onClick={send}
              disabled={phase !== 'room' || busy || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a1813] text-[#cdd1a0] transition-opacity disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </aside>
      </div>
    </>
  )
}
