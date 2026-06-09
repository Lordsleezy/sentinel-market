import { fetch } from "undici"
import { config } from "../config.js"
import type { DealCandidate } from "../types.js"
import type { SupplierConnector } from "./base.js"

export const neweggConnector: SupplierConnector = {
  name: "newegg",
  async fetchDeals() {
    if (!config.NEWEGG_API_KEY) {
      return []
    }

    const response = await fetch("https://api.newegg.com/marketplace/deals?category=computer-parts", {
      headers: { Authorization: `Bearer ${config.NEWEGG_API_KEY}` },
    })

    if (!response.ok) return []

    const payload = (await response.json()) as {
      items?: Array<{
        id?: string
        title?: string
        url?: string
        price?: number
        averagePrice?: number
        image?: string
        rating?: number
        specs?: Record<string, string | number | boolean>
      }>
    }

    return (payload.items || []).map((item) => ({
      supplier: "newegg",
      sourceId: String(item.id || item.url),
      sourceUrl: String(item.url || ""),
      title: String(item.title || ""),
      price: Number(item.price || 0),
      averageMarketPrice: Number(item.averagePrice || Number(item.price || 0) * 1.12),
      currency: "USD",
      category: inferCategory(String(item.title || "")),
      condition: "new",
      sellerRating: Number(item.rating || 95),
      specs: item.specs || {},
      images: item.image ? [item.image] : [],
      inventoryQuantity: 1,
    }))
  },
}

const inferCategory = (title: string): DealCandidate["category"] => {
  const lower = title.toLowerCase()
  if (lower.includes("laptop")) return "laptop"
  if (lower.includes("desktop") || lower.includes("workstation")) return "desktop"
  if (lower.includes("dock") || lower.includes("keyboard") || lower.includes("mouse")) return "accessory"
  return "component"
}
