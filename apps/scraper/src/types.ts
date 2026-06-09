export type Supplier =
  | "ebay"
  | "newegg"
  | "cj-dropshipping"
  | "back-market"
  | "swappa"
  | "decluttr"
  | "facebook-marketplace"
  | "walmart"
  | "best-buy"
  | "craigslist"
  | "liquidation"
  | "clearance"

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
  sellerInfo?: Record<string, unknown>
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
  source_url?: string
  created_at?: string
  specs?: Record<string, unknown>
}

export type SentinelWebProduct = {
  title: string
  price?: number | null
  condition?: string
  specs?: Record<string, string | number | boolean>
  images?: string[]
  source_url: string
  seller_info?: Record<string, unknown>
  timestamp?: string
  raw_text?: string
}
