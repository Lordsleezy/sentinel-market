import { fetch } from "undici"
import { config } from "../config.js"
import type { DealCandidate } from "../types.js"
import type { SupplierConnector } from "./base.js"

export const backMarketConnector: SupplierConnector = {
  name: "back-market",
  async fetchDeals() {
    if (!config.BACK_MARKET_API_KEY) {
      return []
    }

    const response = await fetch("https://www.backmarket.com/ws/listings/laptops", {
      headers: { Authorization: `Bearer ${config.BACK_MARKET_API_KEY}` },
    })

    if (!response.ok) return []

    const payload = (await response.json()) as {
      results?: Array<{
        id?: string
        title?: string
        url?: string
        price?: number
        average_market_price?: number
        image?: string
        condition?: string
        seller_rating?: number
        specs?: Record<string, string | number | boolean>
      }>
    }

    return (payload.results || []).map((item) => ({
      supplier: "back-market",
      sourceId: String(item.id || item.url),
      sourceUrl: String(item.url || ""),
      title: String(item.title || "Back Market laptop"),
      price: Number(item.price || 0),
      averageMarketPrice: Number(item.average_market_price || Number(item.price || 0) * 1.25),
      currency: "USD",
      category: "laptop",
      condition: normalizeCondition(item.condition),
      sellerRating: Number(item.seller_rating || 92),
      specs: item.specs || {},
      images: item.image ? [item.image] : [],
      inventoryQuantity: 1,
    }))
  },
}

const normalizeCondition = (condition = ""): DealCandidate["condition"] => {
  const lower = condition.toLowerCase()
  if (lower.includes("excellent")) return "excellent"
  if (lower.includes("fair")) return "fair"
  if (lower.includes("parts")) return "parts"
  return "good"
}
