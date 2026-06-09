import { config } from "../config.js"
import type { DealCandidate, EvaluatedDeal } from "../types.js"

const conditionScores: Record<string, number> = {
  new: 14,
  excellent: 11,
  good: 8,
  fair: 3,
  parts: -12,
}

export const evaluateDeal = (deal: DealCandidate): EvaluatedDeal => {
  const average = deal.averageMarketPrice || estimateMarketPrice(deal)
  const discountRatio = average > 0 ? Math.max(0, (average - deal.price) / average) : 0
  const priceScore = Math.min(45, Math.round(discountRatio * 120))
  const specScore = scoreSpecs(deal)
  const conditionScore = conditionScores[deal.condition || "good"] || 5
  const sellerScore = Math.min(16, Math.round((deal.sellerRating || 80) / 6.25))
  const score = Math.max(0, Math.min(100, priceScore + specScore + conditionScore + sellerScore))

  return {
    ...deal,
    averageMarketPrice: average,
    score,
    approved: score >= config.SCRAPER_MIN_SCORE,
    generatedTitle: generateTitle(deal),
    generatedDescription: generateDescription(deal, score, average),
    bundleItemIds: [],
  }
}

const scoreSpecs = (deal: DealCandidate) => {
  const specs = Object.entries(deal.specs)
    .map(([key, value]) => `${key}:${value}`)
    .join(" ")
    .toLowerCase()

  let score = 8
  if (specs.includes("i7") || specs.includes("ryzen 7") || specs.includes("m2") || specs.includes("m3")) score += 8
  if (specs.includes("32gb") || specs.includes("32 gb") || specs.includes("64gb")) score += 6
  if (specs.includes("1tb") || specs.includes("1 tb") || specs.includes("nvme")) score += 5
  if (specs.includes("rtx") || specs.includes("radeon")) score += 5
  if (deal.category === "accessory") score += 4
  return Math.min(25, score)
}

const estimateMarketPrice = (deal: DealCandidate) => {
  const multiplier = deal.category === "accessory" ? 1.28 : deal.category === "component" ? 1.18 : 1.22
  return Number((deal.price * multiplier).toFixed(2))
}

const generateTitle = (deal: DealCandidate) => {
  const condition = deal.condition ? `${deal.condition[0].toUpperCase()}${deal.condition.slice(1)} ` : ""
  return `${condition}${deal.title}`.replace(/\s+/g, " ").trim().slice(0, 140)
}

const generateDescription = (deal: DealCandidate, score: number, average: number) => {
  const specs = Object.entries(deal.specs)
    .slice(0, 8)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ")

  return [
    `${deal.title} sourced from ${deal.supplier}.`,
    `Score ${score}/100 based on sale price $${deal.price.toFixed(2)} versus estimated market price $${average.toFixed(2)}, specs, condition, and seller rating.`,
    specs ? `Specs: ${specs}.` : "Specs will be confirmed before fulfillment.",
  ].join(" ")
}
