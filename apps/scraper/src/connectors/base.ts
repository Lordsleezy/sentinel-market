import type { DealCandidate } from "../types.js"

export type SupplierConnector = {
  name: string
  fetchDeals(): Promise<DealCandidate[]>
}

export const techQueries = [
  "business laptop",
  "gaming desktop",
  "nvme ssd",
  "usb c dock",
  "mechanical keyboard",
]
