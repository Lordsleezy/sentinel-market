import Link from "next/link"
import { ArrowRight, Cpu } from "lucide-react"
import { listProducts } from "../components/api"
import { Footer } from "../components/Footer"
import { ProductCard } from "../components/ProductCard"

export default async function Home() {
  const products = await listProducts()

  return (
    <main className="shell">
      <nav className="nav">
        <div className="brand">
          <span className="mark" />
          <span>Sentinel Market</span>
        </div>
        <div className="nav-links">
          <Link href="/products">Products</Link>
        </div>
      </nav>

      <section className="hero">
        <div>
          <p className="eyebrow">Sentinel Prime storefront</p>
          <h1>Sentinel Market</h1>
          <p>
            A clean, curated marketplace for computers, parts, and practical upgrades from Sentinel Prime.
          </p>
          <Link className="hero-link" href="/products">
            Browse products
            <ArrowRight size={18} />
          </Link>
        </div>
        <aside className="hero-panel" aria-label="Storefront status">
          <div className="status-card">
            <span className="status-dot" />
            <h2>Catalog ready</h2>
            <p>Products published in Medusa appear here automatically and checkout through Stripe.</p>
          </div>
        </aside>
      </section>

      <div className="toolbar">
        <div className="tabs">
          <span>Featured</span>
          <span>Systems</span>
          <span>Parts</span>
        </div>
      </div>

      <section className="grid" id="systems">
        {products.length > 0 ? (
          products.map((product) => <ProductCard key={product.id} product={product} />)
        ) : (
          <section className="empty-state" aria-label="No products available">
            <Cpu size={42} />
            <h2>No products yet, check back soon</h2>
            <p>Sentinel Market is live and connected to Medusa. New listings will appear here as they are published.</p>
          </section>
        )}
      </section>

      <Footer />
    </main>
  )
}
