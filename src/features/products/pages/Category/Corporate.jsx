import { ArrowRight, CakeSlice } from "lucide-react";
import { Link } from "react-router-dom";

import { getProductsByCategory } from "../../../../data/product/products";

function CorporatePage() {
  const cakes = getProductsByCategory("corporate");

  return (
    <section className="page-container py-8 md:py-12">
      <Link to="/" className="text-sm text-[var(--text-muted)]">Home</Link>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[2px] text-[var(--brand)]">
            For every business celebration
          </p>
          <h1 className="mt-2 text-3xl font-semibold" style={{ fontFamily: "Georgia, serif" }}>
            Corporate Cakes
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Professional cakes for offices, events and corporate celebrations.
          </p>
        </div>

        <span className="text-sm text-[var(--text-muted)]">{cakes.length} cakes</span>
      </div>

      {cakes.length > 0 ? (
        <CakeGrid cakes={cakes} />
      ) : (
        <EmptyState />
      )}
    </section>
  );
}

function CakeGrid({ cakes }) {
  return (
    <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {cakes.map((product) => (
        <Link key={product.id} to={`/product/${product.id}`} className="pressable group min-w-0">
          <div className="overflow-hidden rounded-xl bg-[var(--cream-dark)]">
            <img src={product.image} alt={product.name} loading="lazy" decoding="async"
              className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
          </div>

          <div className="mt-3 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold">{product.name}</h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">From ₹{product.price}</p>
            </div>
            <ArrowRight size={16} className="mt-1 shrink-0 text-[var(--brand)]" />
          </div>
        </Link>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 flex flex-col items-center border-y border-[var(--border)] py-12 text-center">
      <CakeSlice size={32} className="text-[var(--brand)]" />
      <h2 className="mt-4 text-lg font-semibold">No corporate cakes available</h2>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        We don't have any corporate cakes available right now.
      </p>
      <Link to="/category/all" className="mt-5 text-sm font-semibold text-[var(--brand)]">
        Browse all cakes →
      </Link>
    </div>
  );
}

export default CorporatePage;