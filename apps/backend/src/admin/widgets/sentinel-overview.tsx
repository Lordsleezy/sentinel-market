import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"

type Metrics = {
  newDealsToday: number
  pendingManualFulfillment: number
  supplierOrders: Record<string, number>
  bundlePerformance: {
    orders: number
    suppliers: string[]
  }
}

const SentinelOverview = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null)

  useEffect(() => {
    fetch("/admin/sentinel-metrics", { credentials: "include" })
      .then((response) => response.json())
      .then(setMetrics)
      .catch(() => setMetrics(null))
  }, [])

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <Heading level="h2">Sentinel Market</Heading>
        <Badge color="green">Automated sourcing</Badge>
      </div>
      <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-4">
        <Metric label="New deals today" value={metrics?.newDealsToday ?? "-"} />
        <Metric label="Manual fulfillment" value={metrics?.pendingManualFulfillment ?? "-"} />
        <Metric label="Bundle orders" value={metrics?.bundlePerformance.orders ?? "-"} />
        <Metric
          label="Active suppliers"
          value={metrics ? Object.keys(metrics.supplierOrders).length : "-"}
        />
      </div>
      {metrics && (
        <div className="border-t px-6 py-4">
          <Text size="small" weight="plus">
            Supplier queue
          </Text>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(metrics.supplierOrders).map(([supplier, count]: [string, number]) => (
              <Badge key={supplier} color="grey">
                {supplier}: {count}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Container>
  )
}

const Metric = ({ label, value }: { label: string; value: string | number }) => (
  <div>
    <Text size="small" className="text-ui-fg-subtle">
      {label}
    </Text>
    <Text size="xlarge" weight="plus">
      {value}
    </Text>
  </div>
)

export const config = defineWidgetConfig({
  zone: "order.list.before",
})

export default SentinelOverview
