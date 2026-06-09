import Stripe from "stripe"
import { json, supabaseAdmin } from "./_supabase.mjs"

const siteUrl = () =>
  process.env.SITE_URL || process.env.MARKET_DOMAIN || process.env.URL || "https://market.sentinelprime.org"

const parseBody = (event) => {
  if (!event.body) return {}

  const body = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body
  const contentType = event.headers["content-type"] || event.headers["Content-Type"] || ""

  if (contentType.includes("application/json")) {
    return JSON.parse(body)
  }

  return Object.fromEntries(new URLSearchParams(body))
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(200, {})
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" })

  if (!process.env.STRIPE_SECRET_KEY) {
    return json(500, { error: "Stripe secret key is not configured" })
  }

  const payload = parseBody(event)
  const productId = payload.product_id || payload.productId

  if (!productId) {
    return json(400, { error: "Missing product_id" })
  }

  const { data: product, error } = await supabaseAdmin()
    .from("products")
    .select("id,title,description,price,images,supplier")
    .eq("id", productId)
    .single()

  if (error || !product) {
    return json(404, { error: "Product not found" })
  }

  if (typeof product.price !== "number" || product.price <= 0) {
    return json(400, { error: "Product is not available for checkout" })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const baseUrl = siteUrl().replace(/\/$/, "")

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(product.price * 100),
          product_data: {
            name: product.title,
            description: product.description || undefined,
            images: Array.isArray(product.images) ? product.images.filter(Boolean).slice(0, 8) : undefined,
          },
        },
      },
    ],
    metadata: {
      product_id: product.id,
      supplier: product.supplier || "manual",
    },
    success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/products`,
  })

  return json(200, { id: session.id, url: session.url })
}
