import { chromium } from "playwright"
import type { DealCandidate } from "../types.js"
import type { SupplierConnector } from "./base.js"

export const backMarketConnector: SupplierConnector = {
  name: "back-market",
  async fetchDeals() {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    try {
      await page.goto("https://www.backmarket.com/en-us/l/laptops/0744fd27-8605-465d-8691-3b6a10c8812a", {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      })

      return await page.locator("a[href*='/en-us/p/']").evaluateAll((links) =>
        links.slice(0, 20).map((link) => {
          const title = link.textContent?.trim().replace(/\s+/g, " ") || "Back Market computer"
          const sourceUrl = (link as HTMLAnchorElement).href

          return {
            supplier: "back-market",
            sourceId: sourceUrl,
            sourceUrl,
            title,
            price: 0,
            currency: "USD",
            category: "laptop",
            specs: {},
            images: [],
            inventoryQuantity: 1,
          }
        })
      ) as DealCandidate[]
    } finally {
      await browser.close()
    }
  },
}
