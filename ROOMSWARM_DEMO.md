# RoomSwarm — Demo Runbook

**One-liner:** Upload a photo of your room → it's rebuilt as an explorable 3D scene →
chat with a swarm of agents that shop the real web to furnish it.

**Sponsor fit:**
- **Replicas** — autonomous agents shop real retailers for the furniture you ask for.
- **InsForge** — AI gateway powers the vision room-generation + furniture modeling;
  Postgres + gallery persist saved rooms.

## Before the demo
1. Dev server: `cd ~/roomswarm/artspace-interior/artspace-ui && node node_modules/next/dist/bin/next dev -p 3000`
2. Open **http://localhost:3000/studio**
3. Have a room photo ready (`bed.jpg` in the repo root works).

## The flow
1. **Upload a room photo** → **"Generate my room in 3D."**
   Claude Vision (via InsForge's AI gateway) rebuilds every object as real 3D geometry
   (`createCompleteRoom()` — walls, floor, furniture, lights). Takes ~1 minute. Drag to orbit.
2. **Chat to furnish.** In the panel, type what you want — e.g. *"add a walnut
   mid-century coffee table."* An agent shops the web for it, shows the real product,
   and the piece is built into your 3D room.
3. **Saved Rooms** (`/gallery`) — persisted designs in InsForge.

## Safety / demo mode
- **mock toggle** (top-right of the chat panel): returns a real canned product instantly
  and still builds the 3D model — no live agents, no network needed. Use if the venue
  Wi-Fi or Replicas is flaky.
- Room generation and furniture modeling both fall back to built-in 3D if the AI call
  fails, so the room is never empty.

## How the 3D works (the original method)
The photo is sent to `/api/generate-complete-room`, where an LLM with vision writes
Three.js code that constructs the whole room as geometry. Added furniture uses
`/api/generate-3d` (LLM writes a `createFurniture()` model), injected into the live scene.
Both run through InsForge's AI gateway (OpenRouter).
