import Stripe from "stripe"
import { json } from "./_http.mjs"

const rawBody = (event) =>
  event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString("utf8") : event.body || ""

const saveCompletedOrder = async (session) => {
  const medusaCartId = session.metadata?.medusa_cart_id
  const medusaProductId = session.metadata?.medusa_product_id
  const medusaVariantId = session.metadata?.medusa_variant_id

  if (!medusaCartId && !medusaProductId) {
    throw new Error("Checkout session is missing Medusa metadata")
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return
  }

  const { createClient } = await import("@supabase/supabase-js")
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: existingOrder } = await supabase
    .from("orders")
    .select("id")
    .eq("customer->>stripe_session_id", session.id)
    .maybeSingle()

  if (existingOrder) return

  const { error } = await supabase.from("orders").insert({
    customer: {
      email: session.customer_details?.email || session.customer_email || null,
      name: session.customer_details?.name || null,
      stripe_customer_id: session.customer || null,
      stripe_session_id: session.id,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
      medusa_cart_id: medusaCartId || null,
      medusa_product_id: medusaProductId || null,
      medusa_variant_id: medusaVariantId || null,
    },
    product_id: medusaProductId,
    status: "pending_manual_fulfillment",
    supplier: session.metadata?.supplier || "medusa",
    fulfillment_notes: `Medusa cart ${medusaCartId || "n/a"} · Stripe session ${session.id}`,
  })

  if (error) throw new Error(error.message)
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" })

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return json(500, { error: "Stripe webhook is not configured" })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const signature = event.headers["stripe-signature"] || event.headers["Stripe-Signature"]

  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody(event), signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (error) {
    return json(400, { error: `Webhook signature verification failed: ${error.message}` })
  }

  try {
    if (stripeEvent.type === "checkout.session.completed") {
      await saveCompletedOrder(stripeEvent.data.object)
    }
  } catch (error) {
    return json(500, { error: error.message })
  }

  return json(200, { received: true })
}
