import { Cpu, ShoppingCart } from "lucide-react"
import { listProducts } from "../../components/api"

export const metadata = {
  title: "Products | Sentinel Market",
  description: "Browse Sentinel Market products and bundles.",
}

export default async function ProductsPage() {
  const products = await listProducts()

  return (
    <main className="shell">
      <nav className="nav">
        <a className="brand" href="/">
          <span className="mark" />
          <span>Sentinel Market</span>
        </a>
        <div className="nav-links">
          <a href="/">Home</a>
          <a href="/products">Products</a>
        </div>
      </nav>

      <section className="catalog-header">
        <h1>Products</h1>
        <p>Approved systems, parts, and bundles sourced for Sentinel Prime.</p>
      </section>

      <section className="grid catalog-grid">
        {products.length > 0 ? (
          products.map((product) => (
            <article className="card" key={product.id}>
              <div className="image">
                <Cpu size={44} />
              </div>
              <h2>{product.title}</h2>
              <div className="meta">
                {product.description || "Specs and fulfillment notes are being prepared."}
              </div>
              {typeof product.price === "number" && <div className="price">${product.price.toFixed(2)}</div>}
              <button className="buy" type="button">
                <ShoppingCart size={16} />
                View deal
              </button>
            </article>
          ))
        ) : (
          <section className="empty-state" aria-label="No products available">
            <Cpu size={42} />
            <h2>Products coming soon, check back shortly</h2>
            <p>The catalog is ready. New listings will appear here after the scheduled scraper approves deals.</p>
          </section>
        )}
      </section>
    </main>
  )
}
