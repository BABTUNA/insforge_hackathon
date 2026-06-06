/**
 * Server-only InsForge admin client. Uses the project API key (full access),
 * so it must never be imported into client components.
 */
import { createAdminClient } from '@insforge/sdk'

export const insforgeAdmin = createAdminClient({
  baseUrl: process.env.INSFORGE_URL as string,
  apiKey: process.env.INSFORGE_API_KEY as string,
})

export type SavedDesign = {
  id: string
  created_at: string
  styles: string[]
  budget: number
  total: number
  found: number
  items: Array<{
    key: string
    label: string
    icon: string
    result: {
      name: string
      price_usd: number
      retailer: string
      product_url: string
      image_url: string
      why?: string
    }
  }>
}
