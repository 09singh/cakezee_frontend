import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CakeSlice } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { getReadyNowProducts } from "../../../api/auth.api";

const categories = [
  { value: "all", label: "All" },
  { value: "cake", label: "Cake" },
  { value: "benetto", label: "Benetto" },
  { value: "dessert", label: "Dessert" },
  { value: "pastries", label: "Pastries" },
];

function ReadyNowPage() {
  const [products, setProducts] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestedCategory = searchParams.get("category");
  const category = categories.some((item) => item.value === requestedCategory)
    ? requestedCategory
    : "all";

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const all = [];
        let page = 1;
        let hasNext = true;
        while (hasNext) {
          const response = await getReadyNowProducts({ page, limit: 50 });
          const pageItems = Array.isArray(response?.data) ? response.data : [];
          all.push(
            ...pageItems.filter(
              (product) =>
                String(product.readyNowCategory || "").toLowerCase() !== "combos"
            )
          );
          hasNext = Boolean(response?.pagination?.hasNext && pageItems.length);
          page += 1;
        }
        if (active) setProducts(all);
      } catch (loadError) {
        if (active) setError(loadError?.response?.data?.message || "Ready Now products could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const visibleProducts = useMemo(() => category === "all"
    ? products
    : products.filter((product) => product.readyNowCategory === category), [products, category]);

  return (
    <section className="page-container py-8 md:py-12">
      <Link to="/" className="text-sm text-[var(--text-muted)]">Home</Link>
      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[2px] text-[var(--brand)]">Fresh and ready to enjoy</p>
        <h1 className="mt-2 text-3xl font-semibold" style={{ fontFamily: "Georgia, serif" }}>Ready Now</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Choose a ready-to-order treat and continue straight to delivery details.</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2" aria-label="Ready Now categories">
        {categories.map((item) => {
          const selectCategory = () => {
            setSearchParams(item.value === "all" ? {} : { category: item.value });
          };

          return (
            <button key={item.value} type="button" aria-pressed={category === item.value} onClick={selectCategory} className={`rounded-full border px-4 py-2 text-sm font-semibold ${category === item.value ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-[var(--border)] bg-white text-[var(--text)]"}`}>
              {item.label}
            </button>
          );
        })}
      </div>

      {error && <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading ? <p className="py-16 text-center text-sm text-[var(--text-muted)]">Loading Ready Now treats…</p> : visibleProducts.length ? (
        <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visibleProducts.map((product) => {
            const image = product.images?.[0]?.url || "/images/placeholder.webp";
            const price = Number(product.flavours?.[0]?.basePrice || 0);
            return (
              <Link key={product._id} to={`/product/${product._id}`} className="group overflow-hidden rounded-xl border border-[var(--border)] bg-white">
                <img src={image} alt={product.name} loading="lazy" className="aspect-square w-full bg-[var(--cream-dark)] object-cover transition-transform group-hover:scale-[1.03]" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/images/placeholder.webp"; }} />
                <div className="p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--brand)]">{product.readyNowCategory}</p>
                  <h2 className="mt-1 truncate text-sm font-semibold">{product.name}</h2>
                  <div className="mt-2 flex items-center justify-between gap-2"><span className="font-bold text-[var(--brand)]">₹{price.toLocaleString("en-IN")}</span><ArrowRight size={16} className="text-[var(--brand)]" /></div>
                  {Number(product.inventoryQuantity) < 1 && <p className="mt-2 text-xs text-amber-700">Currently unavailable</p>}
                </div>
              </Link>
            );
          })}
        </div>
      ) : !error ? (
        <div className="mt-10 flex flex-col items-center border-y border-[var(--border)] py-12 text-center"><CakeSlice size={32} className="text-[var(--brand)]" /><h2 className="mt-4 text-lg font-semibold">No Ready Now products in this category</h2><p className="mt-2 text-sm text-[var(--text-muted)]">Please check back soon.</p></div>
      ) : null}
    </section>
  );
}

export default ReadyNowPage;
