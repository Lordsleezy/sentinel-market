import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

type MetricProduct = {
  id: string
  title: string
  metadata?: Record<string, unknown> | null
  created_at?: string
}

type MetricOrder = {
  id: string
  display_id?: number
  status?: string
  fulfillment_status?: string
  metadata?: Record<string, unknown> | null
  created_at?: string
}

const todayStart = () => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const productModule = req.scope.resolve("product")
  const orderModule = req.scope.resolve("order")

  const [products, orders] = await Promise.all([
    productModule.listProducts({
      created_at: { $gte: todayStart() },
    }),
    orderModule.listOrders({}),
  ])

  const newDeals = (products as MetricProduct[]).filter((product) => product.metadata?.source_supplier)
  const pendingOrders = (orders as MetricOrder[]).filter((order) => {
    return order.fulfillment_status !== "fulfilled" && order.status !== "canceled"
  })

  const supplierOrders = pendingOrders.reduce<Record<string, number>>((acc, order) => {
    const supplier = String(order.metadata?.source_supplier || "manual")
    acc[supplier] = (acc[supplier] || 0) + 1
    return acc
  }, {})

  const bundlePerformance = (orders as MetricOrder[]).reduce(
    (acc, order) => {
      if (order.metadata?.bundle_id) {
        acc.orders += 1
        acc.suppliers.add(String(order.metadata?.source_supplier || "mixed"))
      }
      return acc
    },
    { orders: 0, suppliers: new Set<string>() }
  )

  res.json({
    newDealsToday: newDeals.length,
    recentDeals: newDeals.slice(0, 8).map((product) => ({
      id: product.id,
      title: product.title,
      supplier: product.metadata?.source_supplier,
      score: product.metadata?.value_score,
    })),
    pendingManualFulfillment: pendingOrders.length,
    supplierOrders,
    bundlePerformance: {
      orders: bundlePerformance.orders,
      suppliers: Array.from(bundlePerformance.suppliers),
    },
  })
}
