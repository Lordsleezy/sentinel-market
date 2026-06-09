import { Cpu, Search, ShoppingCart } from "lucide-react"
import { listProducts } from "../components/api"

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
          <a href="#parts">Parts</a>
          <a href="#bundles">Bundles</a>
        </div>
      </nav>

      <section className="hero">
        <div>
          <h1>Sentinel Prime tech deals.</h1>
          <p>
            Automated sourcing ranks computers, parts, and accessories by real specs, live price,
            and bundle fit before they hit the catalog.
          </p>
        </div>
        <aside className="hero-panel" aria-label="Live sourcing summary">
          {[
            ["eBay workstation pull", "91"],
            ["Back Market ultrabook", "86"],
            ["Newegg GPU clearance", "82"],
            ["CJ accessory bundle", "78"],
          ].map(([label, score]) => (
            <div className="scan-row" key={label}>
              <span>{label}</span>
              <span className="score">{score}</span>
            </div>
          ))}
        </aside>
      </section>

      <div className="toolbar">
        <div className="tabs">
          <span>Best value</span>
          <span>Newest</span>
          <span>Bundles</span>
        </div>
        <div className="nav-links">
          <Search size={16} />
          <span>Scored by market signals</span>
        </div>
      </div>

      <section className="grid" id="systems">
        {products.length > 0 ? (
          products.map((product) => (
            <article className="card" key={product.id}>
              <div className="image">
                <Cpu size={44} />
              </div>
              <h2>{product.title}</h2>
              <div className="meta">{product.description}</div>
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
            <p>Sentinel Market is connected and waiting for the first approved scraper run.</p>
          </section>
        )}
      </section>
    </main>
  )
}
