import { json, requirePaul, supabaseAdmin } from "./_supabase.mjs"

const sinceIso = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(200, {})
  if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" })

  const auth = await requirePaul(event)
  if (auth.error) return auth.error

  const client = supabaseAdmin()
  const since = sinceIso(24)

  const [deals, pendingOrders, bundles] = await Promise.all([
    client
      .from("deals")
      .select("id,product_id,original_price,sale_price,score,expires_at,products(title,supplier,created_at)")
      .gte("created_at", since),
    client
      .from("orders")
      .select("id,customer,product_id,status,supplier,fulfillment_notes,created_at")
      .neq("status", "fulfilled")
      .neq("status", "canceled"),
    client.from("bundles").select("id,name,products,total_price,margin,created_at").order("created_at", {
      ascending: false,
    }),
  ])

  const firstError = [deals.error, pendingOrders.error, bundles.error].find(Boolean)
  if (firstError) {
    return json(500, { error: firstError.message })
  }

  const supplierOrders = (pendingOrders.data || []).reduce((acc, order) => {
    const supplier = order.supplier || "manual"
    acc[supplier] = (acc[supplier] || 0) + 1
    return acc
  }, {})

  const bundleRows = bundles.data || []
  const totalBundleMargin = bundleRows.reduce((sum, bundle) => sum + Number(bundle.margin || 0), 0)

  return json(200, {
    newDealsLast24Hours: deals.data || [],
    pendingManualFulfillment: pendingOrders.data || [],
    supplierOrders,
    bundlePerformance: {
      count: bundleRows.length,
      totalMargin: totalBundleMargin,
      recentBundles: bundleRows.slice(0, 10),
    },
  })
}
