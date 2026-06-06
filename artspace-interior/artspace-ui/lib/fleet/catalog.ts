/**
 * Small curated catalog used for fast, reliable, price-aware results — both for
 * "mock" mode and as the fallback when a live agent times out or returns an
 * over-budget / unparseable result. Each category reuses one verified image URL
 * so thumbnails always load in the demo.
 */
import type { ShoppingResult } from './replicas'

type Cat =
  | 'sofa'
  | 'coffee_table'
  | 'rug'
  | 'floor_lamp'
  | 'accent_chair'
  | 'wall_art'
  | 'plant'
  | 'bookshelf'

const IMG: Record<Cat, string> = {
  sofa: 'https://www.ikea.com/us/en/images/products/linanaes-sofa-vissle-beige__1013895_pe829449_s5.jpg?f=u',
  coffee_table: 'https://www.ikea.com/us/en/images/products/lack-coffee-table-white-stained-oak-effect__0708822_pe726753_s5.jpg?f=u',
  rug: 'https://www.ikea.com/us/en/images/products/stoense-rug-low-pile-off-white__0488693_pe623670_s5.jpg?f=u',
  floor_lamp: 'https://www.ikea.com/us/en/images/products/naevlinge-led-floor-reading-lamp-white__0879340_pe610003_s5.jpg?f=u',
  accent_chair: 'https://www.ikea.com/us/en/images/products/poaeng-armchair-birch-veneer-knisa-light-beige__0571500_pe667008_s5.jpg?f=u',
  wall_art: 'https://www.ikea.com/us/en/images/products/bjoerksta-picture-with-frame-the-secret-of-color-aluminum-color__0950866_pe801244_s5.jpg?f=u',
  plant: 'https://www.ikea.com/us/en/images/products/fejka-artificial-potted-plant-in-outdoor-monstera__0614196_pe686818_s5.jpg?f=u',
  bookshelf: 'https://www.ikea.com/us/en/images/products/billy-bookcase-white__0644293_pe702455_s5.jpg?f=u',
}

const mk = (cat: Cat, name: string, price: number, why: string): ShoppingResult => ({
  name,
  price_usd: price,
  retailer: 'IKEA',
  product_url: 'https://www.ikea.com/us/en/',
  image_url: IMG[cat],
  why,
})

// Ordered cheapest → priciest within each category.
export const CATALOG: Record<Cat, ShoppingResult[]> = {
  sofa: [
    mk('sofa', 'KLIPPAN Loveseat, Vissle gray', 199, 'Compact two-seater with clean lines.'),
    mk('sofa', 'LINANÄS Sofa, Vissle beige', 399, 'Soft neutral beige, understated modern form.'),
    mk('sofa', 'EKTORP Sofa, Hakebo beige', 549, 'Roomy classic with washable covers.'),
  ],
  coffee_table: [
    mk('coffee_table', 'LACK Coffee Table, white/oak', 39, 'Pared-back light-oak rectangle.'),
    mk('coffee_table', 'LISTERBY Coffee Table, oak veneer', 199, 'Warm oak with a refined edge.'),
    mk('coffee_table', 'STOCKHOLM Coffee Table, walnut', 299, 'Mid-century walnut statement piece.'),
  ],
  rug: [
    mk('rug', 'TIPHEDE Rug, flatwoven', 29, 'Light flatweave that brightens a floor.'),
    mk('rug', 'STOENSE Rug, low pile, off-white', 79, 'Soft off-white low pile.'),
    mk('rug', 'VINDUM Rug, high pile, white', 149, 'Plush high-pile comfort.'),
  ],
  floor_lamp: [
    mk('floor_lamp', 'TÅGARP Floor Lamp, black', 19, 'Minimal uplight in matte black.'),
    mk('floor_lamp', 'NÄVLINGE LED Floor Lamp, white', 39, 'Slim adjustable reading lamp.'),
    mk('floor_lamp', 'HOLMÖ Floor Lamp, rice paper', 79, 'Soft diffused ambient glow.'),
  ],
  accent_chair: [
    mk('accent_chair', 'FRÖSET Stool, bent birch', 49, 'Sculptural low stool.'),
    mk('accent_chair', 'POÄNG Armchair, birch/beige', 129, 'Iconic bentwood lounge chair.'),
    mk('accent_chair', 'STRANDMON Wing Chair, beige', 279, 'Cozy high-back accent chair.'),
  ],
  wall_art: [
    mk('wall_art', 'BILD Poster, abstract', 24, 'Muted abstract print.'),
    mk('wall_art', 'BJÖRKSTA Framed Picture', 79, 'Framed abstract focal piece.'),
    mk('wall_art', 'BJÖRKSTA Large Canvas', 149, 'Oversized statement canvas.'),
  ],
  plant: [
    mk('plant', 'FEJKA Artificial Plant, small', 12, 'Low, no-upkeep greenery.'),
    mk('plant', 'FEJKA Artificial Monstera', 24, 'Sculptural leaves, zero care.'),
    mk('plant', 'FEJKA Artificial Plant, tall', 49, 'Floor-standing green accent.'),
  ],
  bookshelf: [
    mk('bookshelf', 'LACK Wall Shelf, white', 39, 'Floating minimalist shelf.'),
    mk('bookshelf', 'BILLY Bookcase, white', 69, 'Timeless, unobtrusive bookcase.'),
    mk('bookshelf', 'KALLAX Shelf Unit, oak effect', 129, 'Grid cube storage.'),
  ],
}

export function categoryOf(query: string): Cat {
  const q = query.toLowerCase()
  if (/(sofa|couch|sectional|loveseat|settee)/.test(q)) return 'sofa'
  if (/(coffee|side table|end table|table|desk)/.test(q)) return 'coffee_table'
  if (/(rug|carpet|mat)/.test(q)) return 'rug'
  if (/(lamp|light|lighting|sconce)/.test(q)) return 'floor_lamp'
  if (/(chair|armchair|stool|seat|recliner)/.test(q)) return 'accent_chair'
  if (/(art|paint|print|poster|frame|picture|canvas)/.test(q)) return 'wall_art'
  if (/(plant|tree|greenery|fern|succulent)/.test(q)) return 'plant'
  if (/(book|shelf|shelving|cabinet|storage|bookcase)/.test(q)) return 'bookshelf'
  return 'accent_chair'
}

/** Extract a max price from free text: "$100", "under 100", "max 100", "below $250". */
export function parseMaxPrice(query: string): number | null {
  const q = query.toLowerCase()
  const m =
    q.match(/(?:under|below|less than|max|max(?:imum)?|up to|cheaper than|<=?)\s*\$?\s*(\d[\d,]*)/) ||
    q.match(/\$\s*(\d[\d,]*)/)
  if (!m) return null
  const n = Number(m[1].replace(/,/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Pick a sensible, in-budget item from the catalog. */
export function pickFromCatalog(query: string, maxPrice: number | null): ShoppingResult {
  const list = CATALOG[categoryOf(query)]
  if (maxPrice == null) return list[1] ?? list[0] // mid option by default
  const affordable = list.filter((p) => p.price_usd <= maxPrice)
  if (affordable.length) return affordable[affordable.length - 1] // priciest within budget = best value
  return list[0] // nothing under budget → cheapest available
}
