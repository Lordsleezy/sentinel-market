import { Cpu, Search, ShoppingCart } from "lucide-react"
import { listProducts } from "../components/medusa"

export default async function Home() {
  const products = await listProducts()
  const displayProducts = products.length ? products : fallbackProducts

  return (
    <main className="shell">
      <nav className="nav">
        <div className="brand">
          <span className="mark" />
          <span>Sentinel Market</span>
        </div>
        <div className="nav-links">
          <a href="#systems">Systems</a>
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
          <span>Scored by qwen2.5:7b</span>
        </div>
      </div>

      <section className="grid" id="systems">
        {displayProducts.map((product) => (
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
        ))}
      </section>
    </main>
  )
}

const fallbackProducts = [
  {
    id: "fallback-1",
    title: "ThinkPad T14 Gen 3 bundle",
    description: "Ryzen 7, 32 GB RAM, 1 TB NVMe, dock-ready accessory match.",
  },
  {
    id: "fallback-2",
    title: "RTX creator tower refresh",
    description: "i7 workstation, RTX graphics, high value score from refreshed parts.",
  },
  {
    id: "fallback-3",
    title: "Back Market ultrabook",
    description: "Grade A compact laptop with charger and sleeve bundle opportunity.",
  },
  {
    id: "fallback-4",
    title: "Newegg storage upgrade kit",
    description: "NVMe drive and USB-C enclosure paired for laptop upgrade carts.",
  },
]
