# RoomSwarm — Demo Runbook

**One-liner:** Describe your taste + budget, and a *fleet of autonomous agents shops the
real web in parallel* to furnish your room with real, in-stock, buyable products.

**Sponsor fit:** Replicas is the engine (parallel agent fleet doing real web work);
InsForge persists every furnished room (Postgres) and powers the Saved Rooms gallery.

## Before the demo
1. Dev server running: `cd ~/roomswarm/artspace-interior/artspace-ui && node node_modules/next/dist/bin/next dev -p 3000`
2. Open **http://localhost:3000/studio**
3. Have a floorplan/room image ready to upload (any image works).
4. Decide: **live run** (real agents, ~60–90s, costs a few $) or **simulated demo** (instant, offline-safe).

## The 90-second script
1. **Studio** → upload a room image → *Continue*.
2. **Style quiz** → click 3 style cards (e.g. Scandinavian, Mid-Century, Coastal).
3. **Budget** → set a budget (e.g. $3,000).
4. Click **"Furnish my room → launch 6 agents."**
5. **The wow:** the swarm board lights up — 6 agent cards, each shopping a different
   piece in parallel (`Searching IKEA… → Reading a product page… → Found ✓`), product
   thumbnails + prices popping in live, the cart total climbing.
6. When done: real products, real prices, real buy links, total cost — auto-saved.
7. Click **gallery** → show the **Saved Rooms** page (InsForge persistence).

## Safety nets (don't get caught out)
- **Per-slot fallback:** if any live agent times out, it's filled with a real canned
  product so the room is *always* fully furnished — never a hole on screen.
- **Simulated demo:** on the budget screen, "Run simulated demo (no live agents)"
  replays the full staggered swarm with canned products in ~13s. Use if the venue
  Wi-Fi or Replicas is flaky. (Or hit `POST /api/fleet/start` with `{"demo":true}`.)

## If asked "how does it work?"
- One Replicas agent per furniture slot, spawned in parallel via the Replicas CLI.
- Each agent has a browser + internet; it searches real retailers, opens product
  pages, and returns structured JSON (name, price, retailer, url, image, why).
- The server streams each agent's live status to the board over SSE.
- The finished design is written to InsForge Postgres; the gallery reads it back.
