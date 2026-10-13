
import { useEffect, useState } from "react";
import {
  ArrowRight,
  House,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { getCategories } from "../../../api/auth.api";

function CategoryPage() {
  const { slug = "all" } = useParams();

  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | LOAD CATEGORIES
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      try {
        const response = await getCategories();
        const categoryData = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.categories)
            ? response.data.categories
            : Array.isArray(response?.data?.data)
              ? response.data.data
              : Array.isArray(response?.data?.items)
                ? response.data.items
                : [];

        if (!cancelled) setCategories(categoryData);
      } catch (loadError) {
        console.error("Failed to load categories:", loadError);
        if (!cancelled) {
          setCategories([]);
          setError(
            loadError?.response?.data?.message ||
              "Unable to load categories. Please try again."
          );
        }
      } finally {
        if (!cancelled) setCategoryLoading(false);
      }
    };

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | PAGE TITLE
  |--------------------------------------------------------------------------
  */

  const title =
    slug === "all"
      ? "All Categories"
      : categories.find(
          (item) =>
            item.slug === slug ||
            String(item._id || item.id) === slug
        )?.name || "All Categories";

  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */

  if (categoryLoading) {
    return (
      <section className="page-container py-6 md:py-12">
        <div className="animate-pulse">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="mt-4 h-9 w-56 rounded bg-gray-200" />
          <div className="mt-3 h-4 w-80 max-w-full rounded bg-gray-200" />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white"
            >
              <div className="aspect-[4/3] animate-pulse bg-gray-200" />

              <div className="p-3">
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CATEGORY PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <section className="page-container py-6 md:py-12">
      {/* BREADCRUMB */}

      <Link
        to="/"
        className="mb-4 hidden items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--brand)] transition hover:bg-[var(--cream-dark)] md:inline-flex"
      >
        <House size={16} />
        Home
      </Link>

      {/* HEADER */}

      <div>
        <p className="text-xs font-semibold uppercase tracking-[2px] text-[var(--brand)]">
          Made for your moment
        </p>

        <h1
          className="mt-2 text-3xl font-semibold"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {title}
        </h1>

        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Explore our cake categories and find the perfect design
          for your special occasion.
        </p>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* CATEGORY CARDS ONLY */}

      {categories.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((item) => {
            const imageUrl =
              item.image?.url ||
              item.image ||
              "/images/placeholder.webp";

            const isActive = item.slug === slug;

            return (
                <Link
                  key={item._id || item.id}
                  to={`/category/${item.slug || item._id || item.id}`}
                  className="group min-w-0 rounded-2xl bg-white"
                >
                
                {/* CATEGORY IMAGE */}

                <div
                  className={`overflow-hidden rounded-2xl bg-[var(--cream-dark)] ${
                    isActive
                      ? "ring-2 ring-[var(--brand)]"
                      : "border border-[var(--border)]"
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt={item.image?.alt || item.name}
                    width="600"
                    height="450"
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src =
                        "/images/placeholder.webp";
                    }}
                  />
                </div>

                {/* CATEGORY NAME & DESCRIPTION */}

                <div className="mt-3 px-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="min-w-0 truncate text-sm font-semibold text-[var(--text)]">
                      {item.name}
                    </h2>

                    <ArrowRight
                      size={16}
                      className="shrink-0 text-[var(--brand)] transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </div>

                  {item.description && (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--text-muted)]">
                      {item.description}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        !error && (
          <div className="mt-10 border-y border-[var(--border)] py-12 text-center">
            <h2 className="text-lg font-semibold">
              No categories available
            </h2>

            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Categories will appear here once they are added.
            </p>
          </div>
        )
      )}
    </section>
  );
}

export default CategoryPage;
