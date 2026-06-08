import { chromium } from "playwright"
import type { DealCandidate } from "../types.js"
import type { SupplierConnector } from "./base.js"

export const neweggConnector: SupplierConnector = {
  name: "newegg",
  async fetchDeals() {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    try {
      await page.goto("https://www.newegg.com/p/pl?d=computer+parts", {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      })

      return await page.locator(".item-cell").evaluateAll((items) =>
        items.slice(0, 20).map((item) => {
          const title = item.querySelector(".item-title")?.textContent?.trim() || ""
          const sourceUrl = (item.querySelector(".item-title") as HTMLAnchorElement | null)?.href || ""
          const image = (item.querySelector("img") as HTMLImageElement | null)?.src || ""
          const priceText = item.querySelector(".price-current")?.textContent?.replace(/[^\d.]/g, "") || "0"

          return {
            supplier: "newegg",
            sourceId: sourceUrl,
            sourceUrl,
            title,
            price: Number(priceText),
            currency: "USD",
            category: title.toLowerCase().includes("dock") ? "accessory" : "component",
            specs: {},
            images: image ? [image] : [],
            inventoryQuantity: 1,
          }
        })
      ) as DealCandidate[]
    } finally {
      await browser.close()
    }
  },
}
