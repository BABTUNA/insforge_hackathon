/**
 * Canned products per slot. Two uses:
 *  1) Safety net — if a live agent times out or fails, the room still fills.
 *  2) Demo mode — a guaranteed run when the venue network / Replicas is flaky.
 * The sofa + coffee table entries are real IKEA items verified during testing.
 */
import type { ShoppingResult } from './replicas'

export const FALLBACK_PRODUCTS: Record<string, ShoppingResult> = {
  sofa: {
    name: 'LINANÄS Sofa, Vissle beige',
    price_usd: 399,
    retailer: 'IKEA',
    product_url: 'https://www.ikea.com/us/en/p/linanaes-sofa-vissle-beige-80512233/',
    image_url:
      'https://www.ikea.com/us/en/images/products/linanaes-sofa-vissle-beige__1013895_pe829449_s5.jpg?f=u',
    why: 'Clean lines and a soft neutral beige make it a quintessential modern-minimal piece.',
  },
  coffee_table: {
    name: 'LACK Coffee Table, white stained oak effect',
    price_usd: 49.99,
    retailer: 'IKEA',
    product_url: 'https://www.ikea.com/us/en/p/lack-coffee-table-white-stained-oak-effect-40431535/',
    image_url:
      'https://www.ikea.com/us/en/images/products/lack-coffee-table-white-stained-oak-effect__0708822_pe726753_s5.jpg?f=u',
    why: 'Pared-back rectangular form and light oak finish embody Scandinavian design.',
  },
  rug: {
    name: 'STOENSE Rug, low pile, off-white',
    price_usd: 79.99,
    retailer: 'IKEA',
    product_url: 'https://www.ikea.com/us/en/p/stoense-rug-low-pile-off-white-90428222/',
    image_url:
      'https://www.ikea.com/us/en/images/products/stoense-rug-low-pile-off-white__0488693_pe623670_s5.jpg?f=u',
    why: 'Soft off-white low pile adds warmth without competing with the palette.',
  },
  floor_lamp: {
    name: 'NÄVLINGE LED Floor Lamp, white',
    price_usd: 39.99,
    retailer: 'IKEA',
    product_url: 'https://www.ikea.com/us/en/p/naevlinge-led-floor-lamp-white-30445436/',
    image_url:
      'https://www.ikea.com/us/en/images/products/naevlinge-led-floor-reading-lamp-white__0879340_pe610003_s5.jpg?f=u',
    why: 'A slim adjustable arm gives focused light with a minimal footprint.',
  },
  accent_chair: {
    name: 'POÄNG Armchair, birch veneer / Knisa light beige',
    price_usd: 129,
    retailer: 'IKEA',
    product_url: 'https://www.ikea.com/us/en/p/poaeng-armchair-birch-veneer-knisa-light-beige-s49305927/',
    image_url:
      'https://www.ikea.com/us/en/images/products/poaeng-armchair-birch-veneer-knisa-light-beige__0571500_pe667008_s5.jpg?f=u',
    why: 'An iconic bentwood frame brings mid-century warmth and comfort.',
  },
  wall_art: {
    name: 'BJÖRKSTA Picture with Frame, abstract shapes',
    price_usd: 89.99,
    retailer: 'IKEA',
    product_url: 'https://www.ikea.com/us/en/p/bjoerksta-picture-with-frame-s89384387/',
    image_url:
      'https://www.ikea.com/us/en/images/products/bjoerksta-picture-with-frame-the-secret-of-color-aluminum-color__0950866_pe801244_s5.jpg?f=u',
    why: 'Muted abstract tones echo the room palette and add a focal point.',
  },
  plant: {
    name: 'FEJKA Artificial Potted Plant, Monstera',
    price_usd: 24.99,
    retailer: 'IKEA',
    product_url: 'https://www.ikea.com/us/en/p/fejka-artificial-potted-plant-in-outdoor-monstera-30495173/',
    image_url:
      'https://www.ikea.com/us/en/images/products/fejka-artificial-potted-plant-in-outdoor-monstera__0614196_pe686818_s5.jpg?f=u',
    why: 'Sculptural greenery softens the space with zero upkeep.',
  },
  bookshelf: {
    name: 'BILLY Bookcase, white',
    price_usd: 69.99,
    retailer: 'IKEA',
    product_url: 'https://www.ikea.com/us/en/p/billy-bookcase-white-00263850/',
    image_url:
      'https://www.ikea.com/us/en/images/products/billy-bookcase-white__0644293_pe702455_s5.jpg?f=u',
    why: 'A timeless, unobtrusive shelf that fits virtually any modern interior.',
  },
}

export function fallbackFor(slotKey: string): ShoppingResult | null {
  return FALLBACK_PRODUCTS[slotKey] ?? null
}
