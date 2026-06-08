import { fetch } from "undici"
import { config } from "../config.js"
import type { DealCandidate } from "../types.js"
import type { SupplierConnector } from "./base.js"

export const ebayConnector: SupplierConnector = {
  name: "ebay",
  async fetchDeals() {
    if (!config.EBAY_CLIENT_ID) {
      return []
    }

    const query = encodeURIComponent("laptop computer parts")
    const response = await fetch(
      `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${query}&limit=25`,
      {
        headers: {
          Authorization: `Bearer ${config.EBAY_CLIENT_ID}`,
          "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
        },
      }
    )

    if (!response.ok) {
      return []
    }

    const payload = (await response.json()) as {
      itemSummaries?: Array<{
        itemId: string
        title: string
        itemWebUrl: string
        image?: { imageUrl?: string }
        price?: { value?: string; currency?: string }
      }>
    }

    return (payload.itemSummaries || []).map<DealCandidate>((item) => ({
      supplier: "ebay",
      sourceId: item.itemId,
      sourceUrl: item.itemWebUrl,
      title: item.title,
      price: Number(item.price?.value || 0),
      currency: item.price?.currency || "USD",
      category: inferCategory(item.title),
      specs: {},
      images: item.image?.imageUrl ? [item.image.imageUrl] : [],
      inventoryQuantity: 1,
    }))
  },
}

const inferCategory = (title: string): DealCandidate["category"] => {
  const lower = title.toLowerCase()
  if (lower.includes("laptop") || lower.includes("thinkpad") || lower.includes("macbook")) return "laptop"
  if (lower.includes("desktop") || lower.includes("workstation")) return "desktop"
  if (lower.includes("dock") || lower.includes("keyboard") || lower.includes("mouse")) return "accessory"
  return "component"
}
