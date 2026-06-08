import { fetch } from "undici"
import { config } from "../config.js"
import type { DealCandidate, EvaluatedDeal } from "../types.js"

type OllamaResponse = {
  response?: string
}

export const evaluateDeal = async (deal: DealCandidate): Promise<EvaluatedDeal> => {
  const prompt = [
    "You are Sentinel Prime's marketplace buyer.",
    "Score this tech deal from 0-100 based on price versus specs, resale value, and bundle potential.",
    "Return strict JSON with score, approved, title, description, bundleHints.",
    JSON.stringify(deal),
  ].join("\n")

  try {
    const response = await fetch(`${config.OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.OLLAMA_MODEL,
        prompt,
        stream: false,
        format: "json",
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`)
    }

    const payload = (await response.json()) as OllamaResponse
    const parsed = JSON.parse(payload.response || "{}") as {
      score?: number
      approved?: boolean
      title?: string
      description?: string
      bundleHints?: string[]
    }

    const score = Number(parsed.score || heuristicScore(deal))

    return {
      ...deal,
      score,
      approved: Boolean(parsed.approved ?? score >= config.SCRAPER_MIN_SCORE),
      generatedTitle: parsed.title || normalizeTitle(deal.title),
      generatedDescription:
        parsed.description ||
        `${deal.title} sourced from ${deal.supplier}. Value score ${score}/100 based on current price and available specs.`,
      bundleHints: parsed.bundleHints || [],
    }
  } catch {
    const score = heuristicScore(deal)

    return {
      ...deal,
      score,
      approved: score >= config.SCRAPER_MIN_SCORE,
      generatedTitle: normalizeTitle(deal.title),
      generatedDescription: `${deal.title} sourced from ${deal.supplier}. Manual review recommended; Ollama was unavailable.`,
      bundleHints: [],
    }
  }
}

const normalizeTitle = (title: string) => title.replace(/\s+/g, " ").trim().slice(0, 120)

const heuristicScore = (deal: DealCandidate) => {
  if (!deal.price) return 55
  if (deal.category === "laptop" && deal.price < 450) return 82
  if (deal.category === "desktop" && deal.price < 650) return 80
  if (deal.category === "component" && deal.price < 180) return 76
  if (deal.category === "accessory" && deal.price < 60) return 74
  return 68
}
