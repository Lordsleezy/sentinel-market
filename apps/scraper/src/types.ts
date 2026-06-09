export type Supplier = "ebay" | "newegg" | "cj-dropshipping" | "back-market"

export type DealCandidate = {
  supplier: Supplier
  sourceId: string
  sourceUrl: string
  title: string
  price: number
  averageMarketPrice?: number
  currency: string
  category: "laptop" | "desktop" | "component" | "accessory"
  condition?: "new" | "excellent" | "good" | "fair" | "parts"
  sellerRating?: number
  specs: Record<string, string | number | boolean>
  images: string[]
  inventoryQuantity?: number
}

export type EvaluatedDeal = DealCandidate & {
  score: number
  approved: boolean
  generatedTitle: string
  generatedDescription: string
  bundleItemIds: string[]
}

export type ExistingCatalogItem = {
  id: string
  title: string
  category?: string
  price?: number
  specs?: Record<string, unknown>
}
