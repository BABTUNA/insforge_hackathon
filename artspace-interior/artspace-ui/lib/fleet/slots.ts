/**
 * Furniture "slots" — each slot becomes ONE Replicas agent that shops the real
 * web for that single piece. The fleet is the set of slots running in parallel.
 */

export type SlotDef = {
  key: string
  label: string
  icon: string
  /** fraction of the total budget allocated to this slot */
  budgetShare: number
}

// Ordered by visual prominence in a room. budgetShare sums to ~1.0.
export const SLOT_DEFS: SlotDef[] = [
  { key: 'sofa', label: 'Sofa', icon: '🛋️', budgetShare: 0.30 },
  { key: 'coffee_table', label: 'Coffee Table', icon: '🪵', budgetShare: 0.12 },
  { key: 'rug', label: 'Area Rug', icon: '🧶', budgetShare: 0.12 },
  { key: 'floor_lamp', label: 'Floor Lamp', icon: '💡', budgetShare: 0.10 },
  { key: 'accent_chair', label: 'Accent Chair', icon: '🪑', budgetShare: 0.18 },
  { key: 'wall_art', label: 'Wall Art', icon: '🖼️', budgetShare: 0.08 },
  { key: 'plant', label: 'Plant', icon: '🪴', budgetShare: 0.05 },
  { key: 'bookshelf', label: 'Bookshelf', icon: '📚', budgetShare: 0.15 },
]

export function pickSlots(fleetSize: number): SlotDef[] {
  const n = Math.max(1, Math.min(fleetSize, SLOT_DEFS.length))
  return SLOT_DEFS.slice(0, n)
}

const RETAILERS = 'IKEA, Wayfair, West Elm, CB2, Article, Target, Amazon, AllModern'

/** Build the shopping prompt for one agent. */
export function buildSlotPrompt(opts: {
  label: string
  styles: string[]
  slotBudget: number
}): string {
  const styleText = opts.styles.length ? opts.styles.join(', ') : 'modern'
  return [
    `You are an expert interior-design shopping agent.`,
    `Find ONE real, currently-purchasable ${opts.label.toLowerCase()} that fits this interior style: ${styleText}.`,
    `It must cost under $${Math.round(opts.slotBudget)} USD.`,
    `Use your browser and internet to search REAL retailers (${RETAILERS}) and open the actual product page to confirm the price, name, and image.`,
    `Pick something genuinely in stock with a working product URL and a direct image URL (must end in an image file or be a real product image link).`,
    `Return ONLY a single-line JSON object as the FINAL line of your response, with exactly these keys:`,
    `{"name": string, "price_usd": number, "retailer": string, "product_url": string, "image_url": string, "why": string}`,
    `"why" is one short sentence on why it matches the style. Do not output anything after the JSON.`,
  ].join('\n')
}
