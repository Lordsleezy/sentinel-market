import { fetch } from "undici"
import { config } from "../config.js"
import type { DealCandidate } from "../types.js"
import type { SupplierConnector } from "./base.js"

export const cjConnector: SupplierConnector = {
  name: "cj-dropshipping",
  async fetchDeals() {
    if (!config.CJ_ACCESS_TOKEN) {
      return []
    }

    const response = await fetch("https://developers.cjdropshipping.com/api2.0/v1/product/list", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "CJ-Access-Token": config.CJ_ACCESS_TOKEN,
      },
      body: JSON.stringify({ pageNum: 1, pageSize: 20, productName: "computer accessory" }),
    })

    if (!response.ok) {
      return []
    }

    const payload = (await response.json()) as {
      data?: { list?: Array<Record<string, string | number>> }
    }

    return (payload.data?.list || []).map<DealCandidate>((item) => ({
      supplier: "cj-dropshipping",
      sourceId: String(item.pid || item.productId || item.productSku),
      sourceUrl: String(item.productLink || ""),
      title: String(item.productNameEn || item.productName || ""),
      price: Number(item.sellPrice || item.productSellPrice || 0),
      currency: "USD",
      category: "accessory",
      specs: {},
      images: item.productImage ? [String(item.productImage)] : [],
      inventoryQuantity: 5,
    }))
  },
}
