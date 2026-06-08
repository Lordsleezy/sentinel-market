export type Supplier = "ebay" | "newegg" | "cj-dropshipping" | "back-market"

export type DealCandidate = {
  supplier: Supplier
  sourceId: string
  sourceUrl: string
  title: string
  price: number
  currency: string
  category: "laptop" | "desktop" | "component" | "accessory"
  specs: Record<string, string | number | boolean>
  images: string[]
  inventoryQuantity?: number
}

export type EvaluatedDeal = DealCandidate & {
  score: number
  approved: boolean
  generatedTitle: string
  generatedDescription: string
  bundleHints: string[]
}

export type ExistingCatalogItem = {
  id: string
  title: string
  category?: string
  specs?: Record<string, unknown>
}
