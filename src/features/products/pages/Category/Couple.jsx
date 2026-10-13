import { ArrowLeft, CakeSlice } from "lucide-react";
import { Link } from "react-router-dom";

import { getProductsByCategory } from "../../../../data/product/products";

function Couple() {
  const coupleProducts = getProductsByCategory("couple");

  return (
    <section className="page-container py-8 md:py-12">
      {/* Back */}
      <Link
        to="/"
        className="mb-5 inline-flex items-center gap-2 text-sm text-[var(--text-muted)]"
      >
        <ArrowLeft size={16} />
        Home
      </Link>

      {/* Header */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--brand)]">
          Cakes for Couples
        </p>

        <h1
          className="mt-1 text-3xl font-semibold tracking-[-0.7px]"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Couple Cakes
        </h1>

        <p className="mt-2 max-w-xl text-sm text-[var(--text-muted)]">
          Romantic cakes made for anniversaries, date nights, proposals,
          and special moments together.
        </p>
      </div>

      {/* Products */}
      {coupleProducts.length > 0 ? (
        <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {coupleProducts.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="pressable group min-w-0"
            >
              {/* Image */}
              <div className="overflow-hidden rounded-xl bg-[var(--cream-dark)]">
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                  width="300"
                  height="300"
                  className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>

              {/* Product info */}
              <div className="mt-2">
                <p className="truncate text-sm font-semibold">
                  {product.name}
                </p>

                <p className="mt-1 text-sm font-semibold text-[var(--brand)]">
                  ₹{product.price}
                </p>

                {product.badge && (
                  <p className="mt-1 text-[10px] font-medium text-[var(--success)]">
                    {product.badge}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] px-6 py-14 text-center">
          <CakeSlice
            size={42}
            strokeWidth={1.5}
            className="text-[var(--text-muted)]"
          />

          <h2 className="mt-4 text-lg font-semibold">
            No couple cakes available
          </h2>

          <p className="mt-1 text-sm text-[var(--text-muted)]">
            We are adding more romantic cakes soon.
          </p>

          <Link
            to="/"
            className="mt-5 rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white"
          >
            Browse Cakes
          </Link>
        </div>
      )}
    </section>
  );
}

export default Couple;