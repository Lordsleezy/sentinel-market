import type { EvaluatedDeal, ExistingCatalogItem } from "../types.js"

export const identifyBundleOpportunities = (
  deal: EvaluatedDeal,
  catalog: ExistingCatalogItem[]
): string[] => {
  if (!["laptop", "desktop"].includes(deal.category)) {
    return deal.bundleItemIds
  }

  const accessoryMatches = catalog.filter((item) => {
    const haystack = `${item.title} ${item.category || ""}`.toLowerCase()
    return ["dock", "charger", "sleeve", "mouse", "keyboard", "monitor", "hub"].some((term) =>
      haystack.includes(term)
    )
  })

  return [...deal.bundleItemIds, ...accessoryMatches.slice(0, 3).map((item) => item.id)]
}
