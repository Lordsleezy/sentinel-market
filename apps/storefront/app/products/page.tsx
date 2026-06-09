import Link from "next/link"
import { Cpu } from "lucide-react"
import { listProducts } from "../../components/api"
import { Footer } from "../../components/Footer"
import { ProductCard } from "../../components/ProductCard"

export const metadata = {
  title: "Products | Sentinel Market",
  description: "Browse Sentinel Market products and bundles.",
}

export default async function ProductsPage() {
  const products = await listProducts(24)

  return (
    <main className="shell">
      <nav className="nav">
        <Link className="brand" href="/">
          <span className="mark" />
          <span>Sentinel Market</span>
        </Link>
        <div className="nav-links">
          <Link href="/">Home</Link>
          <Link href="/products">Products</Link>
        </div>
      </nav>

      <section className="catalog-header">
        <h1>Products</h1>
        <p>Sentinel Prime computers, parts, and upgrades from the Medusa catalog with secure Stripe checkout.</p>
      </section>

      <section className="grid catalog-grid">
        {products.length > 0 ? (
          products.map((product) => <ProductCard key={product.id} product={product} />)
        ) : (
          <section className="empty-state" aria-label="No products available">
            <Cpu size={42} />
            <h2>No products yet, check back soon</h2>
            <p>The storefront is connected to Medusa. New listings will appear here as soon as they are published.</p>
          </section>
        )}
      </section>

      <Footer />
    </main>
  )
}
