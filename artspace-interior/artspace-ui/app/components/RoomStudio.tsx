'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Sparkles, Send, Loader2, RotateCcw } from 'lucide-react'

type Phase = 'upload' | 'generating' | 'room'

type Product = {
  name: string
  price_usd: number
  retailer: string
  product_url: string
  image_url: string
  why?: string
}

type ChatMsg = {
  id: number
  role: 'user' | 'agent'
  text: string
  status?: 'researching' | 'building' | 'done'
  product?: Product
}

let msgId = 0

export function RoomStudio() {
  const hostRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const roomRootRef = useRef<THREE.Group | null>(null)
  const roomCodeRef = useRef<string>('')
  const addedCountRef = useRef(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const [phase, setPhase] = useState<Phase>('upload')
  const [imageData, setImageData] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState('')
  const [mock, setMock] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)

  // --- Three.js scene bootstrap -------------------------------------------
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
    scene.background = new THREE.Color(0xf3efe7)
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

    scene.add(new THREE.AmbientLight(0xffffff, 0.55))
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

  // --- Scene helpers -------------------------------------------------------
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
      root.name = 'CompleteRoom'

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

  const addFurniture = useCallback((code: string) => {
    const scene = sceneRef.current
    if (!scene) return
    const factory = new Function(
      'THREE',
      `${code}\nif (typeof createFurniture === 'function') return createFurniture();\nreturn null;`
    )
    const obj = factory(THREE)
    if (!(obj instanceof THREE.Object3D)) throw new Error('Furniture code returned nothing')
    obj.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        c.castShadow = true
        c.receiveShadow = true
      }
    })
    // Place added pieces in a row across the front of the room so they don't overlap.
    const i = addedCountRef.current++
    const x = -1.8 + (i % 4) * 1.2
    const z = 1.2 - Math.floor(i / 4) * 1.2
    obj.position.set(x, 0, z)
    scene.add(obj)
  }, [])

  // --- Actions -------------------------------------------------------------
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
      roomCodeRef.current = data.code
      injectRoom(data.code)
      setPhase('room')
      setMessages([
        {
          id: msgId++,
          role: 'agent',
          text: "Here's your room in 3D. Tell me what you'd like to add — e.g. \"a walnut mid-century coffee table\" — and I'll send the swarm to find it.",
          status: 'done',
        },
      ])
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Generation failed')
      setPhase('upload')
    }
  }

  const send = async () => {
    const q = input.trim()
    if (!q || busy) return
    setInput('')
    setBusy(true)
    const userMsg: ChatMsg = { id: msgId++, role: 'user', text: q }
    const agentMsg: ChatMsg = {
      id: msgId++,
      role: 'agent',
      text: mock ? 'Finding a match…' : 'Sending an agent to shop the web…',
      status: 'researching',
    }
    setMessages((m) => [...m, userMsg, agentMsg])

    const patch = (changes: Partial<ChatMsg>) =>
      setMessages((m) => m.map((msg) => (msg.id === agentMsg.id ? { ...msg, ...changes } : msg)))

    try {
      const res = await fetch('/api/furniture/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, mock }),
      })
      const data = await res.json()
      const product: Product | undefined = data.result
      if (!product) throw new Error('No product found')

      patch({ text: 'Found it — building the 3D model into your room…', status: 'building', product })

      const gen = await fetch('/api/generate-3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ furniture_type: q, style: '', colors: ['neutral'], materials: ['wood'] }),
      })
      const genData = await gen.json()
      if (genData.code) addFurniture(genData.code)

      patch({ text: 'Added to your room ✓', status: 'done', product })
    } catch (err) {
      patch({ text: err instanceof Error ? err.message : 'Could not add that piece.', status: 'done' })
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    const scene = sceneRef.current
    if (scene && roomRootRef.current) {
      scene.remove(roomRootRef.current)
      roomRootRef.current = null
    }
    addedCountRef.current = 0
    roomCodeRef.current = ''
    setImageData(null)
    setMessages([])
    setPhase('upload')
    setStatusMsg('')
  }

  // --- Render --------------------------------------------------------------
  return (
    <div className="relative w-full">
      {/* The 3D canvas is always mounted; overlays sit on top before a room exists */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="relative h-[600px] overflow-hidden rounded-2xl border border-[#e6e2da] bg-[#f3efe7] shadow-sm">
          <div ref={hostRef} className="h-full w-full" />

          {/* Upload / generating overlay */}
          <AnimatePresence>
            {phase !== 'room' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-[#f9f7f3]/85 backdrop-blur-sm"
              >
                {phase === 'generating' ? (
                  <div className="flex flex-col items-center gap-4 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#c7a564]" />
                    <p className="serif text-xl text-[#1a1a1a]">{statusMsg}</p>
                    <p className="text-xs text-gray-400">Claude is rebuilding every object as 3D geometry — this takes ~a minute.</p>
                  </div>
                ) : (
                  <div className="w-full max-w-md px-6 text-center">
                    <h3 className="serif text-2xl text-[#1a1a1a]">Start with a photo of your room</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Upload a room photo and we&apos;ll rebuild it as an explorable 3D scene.
                    </p>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="mt-6 flex h-48 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#d9cfb8] bg-white/70 text-gray-500 transition-colors hover:border-[#c7a564] hover:text-[#a6803f]"
                    >
                      {imageData ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageData} alt="room" className="h-full w-full rounded-xl object-cover" />
                      ) : (
                        <>
                          <Upload className="h-6 w-6" />
                          <span className="text-sm font-medium">Drop or click to upload</span>
                          <span className="text-xs text-gray-400">JPEG or PNG</span>
                        </>
                      )}
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
                    {statusMsg && <p className="mt-3 text-sm text-rose-500">{statusMsg}</p>}
                    <button
                      onClick={generateRoom}
                      disabled={!imageData}
                      className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#c7a564] px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-colors hover:bg-[#b89050] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Sparkles className="h-4 w-4" /> Generate my room in 3D
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {phase === 'room' && (
            <button
              onClick={reset}
              className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/85 px-4 py-2 text-xs font-medium text-gray-600 shadow backdrop-blur hover:text-[#a6803f]"
            >
              <RotateCcw className="h-3.5 w-3.5" /> New room
            </button>
          )}
        </div>

        {/* Chat panel */}
        <div className="flex h-[600px] flex-col rounded-2xl border border-[#e6e2da] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#efe9dd] px-5 py-4">
            <div>
              <h3 className="serif text-lg text-[#1a1a1a]">Design with the swarm</h3>
              <p className="text-xs text-gray-400">Ask for furniture; agents shop the web for it.</p>
            </div>
            <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-gray-400">
              <input type="checkbox" checked={mock} onChange={(e) => setMock(e.target.checked)} className="accent-[#c7a564]" />
              mock
            </label>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {phase !== 'room' && (
              <p className="mt-10 text-center text-sm text-gray-400">Generate a room first, then chat to furnish it.</p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === 'user' ? 'bg-[#c7a564] text-white' : 'bg-[#f4f1ea] text-[#1a1a1a]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {m.status === 'researching' && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#c7a564]" />}
                    <span>{m.text}</span>
                  </div>
                  {m.product && (
                    <a
                      href={m.product.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex gap-3 rounded-lg bg-white p-2 shadow-sm"
                    >
                      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded bg-[#f4f1ea]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.product.image_url} alt={m.product.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium text-[#1a1a1a]">{m.product.name}</div>
                        <div className="text-xs font-semibold text-[#c7a564]">
                          ${Math.round(m.product.price_usd).toLocaleString()}
                        </div>
                        <div className="truncate text-[10px] text-gray-400">{m.product.retailer} →</div>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[#efe9dd] p-3">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                disabled={phase !== 'room' || busy}
                placeholder={phase === 'room' ? 'Add a walnut coffee table…' : 'Generate a room first'}
                className="flex-1 rounded-full border border-[#e6e2da] bg-[#faf8f4] px-4 py-2.5 text-sm outline-none focus:border-[#c7a564] disabled:opacity-50"
              />
              <button
                onClick={send}
                disabled={phase !== 'room' || busy || !input.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c7a564] text-white transition-colors hover:bg-[#b89050] disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
