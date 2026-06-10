import { json } from "./_http.mjs"

const medusaUrl = () =>
  (process.env.MEDUSA_API_URL || process.env.NEXT_PUBLIC_MEDUSA_API_URL || "https://legion.sentinelprime.org").replace(
    /\/$/,
    "",
  )

const publishableKey = () =>
  process.env.MEDUSA_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
  "pk_4f2a7194ea759c0f8e4ac2eb8f9acc575acf9195e46d349f2a3f564eb6a59469"

const regionId = () => process.env.MEDUSA_REGION_ID || ""

export const medusaHeaders = () => {
  const key = publishableKey()
  if (!key) throw new Error("MEDUSA_PUBLISHABLE_KEY is not configured")
  return {
    "Content-Type": "application/json",
    "x-publishable-api-key": key,
  }
}

export const medusaFetch = async (path, options = {}) => {
  const response = await fetch(`${medusaUrl()}${path}`, {
    ...options,
    headers: {
      ...medusaHeaders(),
      ...(options.headers || {}),
    },
  })
  const text = await response.text()
  let payload = {}
  try {
    payload = text ? JSON.parse(text) : {}
  } catch {
    payload = { message: text }
  }
  if (!response.ok) {
    throw new Error(payload.message || payload.error || `Medusa request failed (${response.status})`)
  }
  return payload
}

export const getDefaultRegionId = async () => {
  if (regionId()) return regionId()
  const { regions } = await medusaFetch("/store/regions")
  if (!regions?.length) return ""
  const usd = regions.find((r) => r.currency_code === "usd")
  return (usd || regions[0]).id
}

const priceFromVariant = (variant) => {
  const calculated = variant?.calculated_price?.calculated_amount
  if (typeof calculated === "number") return calculated / 100
  const original = variant?.calculated_price?.original_amount
  if (typeof original === "number") return original / 100
  const price = variant?.prices?.[0]?.amount
  if (typeof price === "number") return price / 100
  return null
}

export const mapMedusaProduct = (product) => {
  const variant = product.variants?.[0]
  const images = (product.images || []).map((image) => image.url).filter(Boolean)
  if (product.thumbnail && !images.includes(product.thumbnail)) {
    images.unshift(product.thumbnail)
  }

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: product.description,
    price: variant ? priceFromVariant(variant) : null,
    currency: variant?.calculated_price?.currency_code || "usd",
    images,
    variantId: variant?.id || null,
    variants: (product.variants || []).map((item) => ({
      id: item.id,
      title: item.title,
      price: priceFromVariant(item),
      currency: item.calculated_price?.currency_code || "usd",
    })),
    supplier: "medusa",
  }
}

export const listMedusaProducts = async (limit = 12) => {
  const region = await getDefaultRegionId()
  const params = new URLSearchParams({
    limit: String(limit),
    fields: "*variants.calculated_price,+variants.prices",
  })
  if (region) params.set("region_id", region)
  const { products } = await medusaFetch(`/store/products?${params}`)
  return (products || []).map(mapMedusaProduct)
}

export const getMedusaProduct = async ({ id, handle }) => {
  const region = await getDefaultRegionId()
  const params = new URLSearchParams({
    fields: "*variants.calculated_price,+variants.prices",
  })
  if (region) params.set("region_id", region)

  if (handle) {
    const { products } = await medusaFetch(`/store/products?${params}&handle=${encodeURIComponent(handle)}`)
    const product = products?.[0]
    if (!product) throw new Error("Product not found")
    return mapMedusaProduct(product)
  }

  const { product } = await medusaFetch(`/store/products/${id}?${params}`)
  if (!product) throw new Error("Product not found")
  return mapMedusaProduct(product)
}

export const createMedusaCheckoutCart = async ({ variantId, quantity = 1 }) => {
  const region = await getDefaultRegionId()
  const { cart } = await medusaFetch("/store/carts", {
    method: "POST",
    body: JSON.stringify(region ? { region_id: region } : {}),
  })

  const updated = await medusaFetch(`/store/carts/${cart.id}/line-items`, {
    method: "POST",
    body: JSON.stringify({ variant_id: variantId, quantity }),
  })

  return updated.cart
}

export { json }
