import Stripe from "stripe"
import { createMedusaCheckoutCart, getMedusaProduct, json } from "./_medusa.mjs"

const siteUrl = () =>
  process.env.SITE_URL || process.env.MARKET_DOMAIN || process.env.URL || "https://market.sentinelprime.org"

const parseBody = (event) => {
  if (!event.body) return {}
  const body = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body
  const contentType = event.headers["content-type"] || event.headers["Content-Type"] || ""
  if (contentType.includes("application/json")) return JSON.parse(body)
  return Object.fromEntries(new URLSearchParams(body))
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(200, {})
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" })

  if (!process.env.STRIPE_SECRET_KEY) {
    return json(500, { error: "Stripe secret key is not configured" })
  }

  try {
    const payload = parseBody(event)
    const productId = payload.product_id || payload.productId
    const variantId = payload.variant_id || payload.variantId
    const handle = payload.handle

    let product
    if (productId || handle) {
      product = await getMedusaProduct({ id: productId, handle })
    }

    const resolvedVariantId = variantId || product?.variantId
    if (!resolvedVariantId) {
      return json(400, { error: "Missing variant_id for Medusa checkout" })
    }

    if (!product) {
      product = await getMedusaProduct({ id: productId })
    }

    const selectedVariant = product.variants?.find((variant) => variant.id === resolvedVariantId) || product
    const unitPrice = selectedVariant.price ?? product.price
    const currency = (selectedVariant.currency || product.currency || "usd").toLowerCase()

    if (typeof unitPrice !== "number" || unitPrice <= 0) {
      return json(400, { error: "Product is not available for checkout" })
    }

    const cart = await createMedusaCheckoutCart({ variantId: resolvedVariantId, quantity: 1 })
    const cartTotal = typeof cart.total === "number" && cart.total > 0 ? cart.total : unitPrice
    const cartCurrency = (cart.currency_code || currency).toLowerCase()

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const baseUrl = siteUrl().replace(/\/$/, "")

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: cartCurrency,
            unit_amount: Math.round(cartTotal * 100),
            product_data: {
              name: product.title,
              description: product.description || undefined,
              images: Array.isArray(product.images) ? product.images.filter(Boolean).slice(0, 8) : undefined,
            },
          },
        },
      ],
      metadata: {
        medusa_cart_id: cart.id,
        medusa_product_id: product.id,
        medusa_variant_id: resolvedVariantId,
        supplier: "medusa",
      },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/products/${product.handle}`,
    })

    return json(200, { id: session.id, url: session.url, cart_id: cart.id, source: "medusa" })
  } catch (error) {
    return json(500, { error: error.message })
  }
}
