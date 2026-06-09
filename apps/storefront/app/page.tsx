import { ArrowRight, Cpu } from "lucide-react"
import { listProducts } from "../components/api"
import { BuyButton } from "../components/BuyButton"

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
          <a href="/products">Products</a>
        </div>
      </nav>

      <section className="hero">
        <div>
          <p className="eyebrow">Sentinel Prime storefront</p>
          <h1>Sentinel Market</h1>
          <p>
            A clean, curated marketplace for computers, parts, and practical upgrades from Sentinel Prime.
          </p>
          <a className="hero-link" href="/products">
            Browse products
            <ArrowRight size={18} />
          </a>
        </div>
        <aside className="hero-panel" aria-label="Storefront status">
          <div className="status-card">
            <span className="status-dot" />
            <h2>Catalog ready</h2>
            <p>Products added in Supabase will appear here automatically and checkout through Stripe.</p>
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
          products.map((product) => (
            <article className="card" key={product.id}>
              <div className="image">
                {product.images?.[0] ? <img alt="" src={product.images[0]} /> : <Cpu size={44} />}
              </div>
              <h2>{product.title}</h2>
              <div className="meta">{product.description}</div>
              {typeof product.price === "number" && <div className="price">${product.price.toFixed(2)}</div>}
              <BuyButton disabled={typeof product.price !== "number"} productId={product.id} />
            </article>
          ))
        ) : (
          <section className="empty-state" aria-label="No products available">
            <Cpu size={42} />
            <h2>No products yet, check back soon</h2>
            <p>Sentinel Market is live and ready. The first approved listings will appear here automatically.</p>
          </section>
        )}
      </section>
    </main>
  )
}
