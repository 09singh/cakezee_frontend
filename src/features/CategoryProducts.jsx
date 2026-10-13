
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CakeSlice } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import {
  getCategories,
  getProducts,
} from "../api/auth.api";

function getArray(response, keys = []) {
  const candidates = [
    response?.data?.data,
    response?.data?.categories,
    response?.data?.products,
    response?.data?.items,
    response?.data?.results,
    response?.categories,
    response?.products,
    response?.data,
    response,
  ];

  for (const value of candidates) {
    if (Array.isArray(value)) return value;

    if (value && typeof value === "object") {
      for (const key of keys) {
        if (Array.isArray(value[key])) return value[key];
      }
    }
  }

  return [];
}

function getId(value) {
  if (!value) return "";

  if (typeof value === "object") {
    return String(value._id ?? value.id ?? "");
  }

  return String(value);
}

function getCategoryId(category) {
  return getId(category?._id ?? category?.id);
}

function getProductCategoryId(product) {
  return getId(
    product.categoryId ??
      product.category?._id ??
      product.category?.id ??
      product.category
  );
}

function getProductId(product) {
  return getId(product?._id ?? product?.id);
}

function getProductImage(product) {
  return (
    product.images?.[0]?.url ||
    (typeof product.image === "string"
      ? product.image
      : product.image?.url) ||
    "/images/placeholder.webp"
  );
}

function getProductPrice(product) {
  return (
    product.pricing?.minPrice ??
    product.price ??
    product.pricing?.basePrice ??
    product.flavours?.[0]?.basePrice ??
    product.flavors?.[0]?.basePrice ??
    0
  );
}

function CategoryProducts() {
  const { categoryId } = useParams();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const categoryResponse = await getCategories();

        if (cancelled) return;

        const categoryList = getArray(categoryResponse, [
          "categories",
          "items",
          "results",
        ]);
        setCategories(categoryList);

        const category = categoryList.find(
          (item) =>
            getCategoryId(item) === String(categoryId) ||
            String(item.slug ?? "") === String(categoryId)
        );
        const selectedId = getCategoryId(category);
        if (!selectedId) {
          setProducts([]);
          return;
        }

        const allProducts = [];
        let page = 1;
        let hasNextPage = true;
        while (hasNextPage && !cancelled) {
          const response = await getProducts({
            categoryId: selectedId,
            limit: 50,
            page,
          });
          const pageProducts = getArray(response, [
            "products",
            "items",
            "results",
          ]);
          allProducts.push(...pageProducts);
          hasNextPage = Boolean(
            response?.pagination?.hasNext && pageProducts.length
          );
          page += 1;
        }

        if (!cancelled) setProducts(allProducts);
      } catch (err) {
        console.error("Category products error:", err);

        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              "Unable to load products. Please try again."
          );
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  // Supports category URLs containing either the category ID or slug.
  const selectedCategory = useMemo(() => {
    return categories.find(
      (category) =>
        getCategoryId(category) === String(categoryId) ||
        String(category.slug ?? "") === String(categoryId)
    );
  }, [categories, categoryId]);

  // Filter products belonging to the selected category.
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return [];

    const selectedId = getCategoryId(selectedCategory);
    const selectedSlug = String(selectedCategory.slug ?? "");

    return products.filter((product) => {
      const productCategoryId = getProductCategoryId(product);

      return (
        productCategoryId === selectedId ||
        (selectedSlug && productCategoryId === selectedSlug)
      );
    });
  }, [products, selectedCategory]);

  if (loading) {
    return (
      <section className="page-container py-12">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="aspect-square rounded-xl bg-gray-200" />
              <div className="mt-3 h-4 rounded bg-gray-200" />
              <div className="mt-2 h-4 w-1/2 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-container py-12 text-center">
        <h1 className="text-xl font-semibold">
          Unable to load products
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {error}
        </p>
        <Link to="/" className="mt-5 inline-block text-[var(--brand)]">
          Back to Home
        </Link>
      </section>
    );
  }

  if (!selectedCategory) {
    return (
      <section className="page-container py-12 text-center">
        <CakeSlice
          size={32}
          className="mx-auto text-[var(--brand)]"
        />
        <h1 className="mt-4 text-xl font-semibold">
          Category not found
        </h1>
        <Link
          to="/"
          className="mt-5 inline-block text-sm font-semibold text-[var(--brand)]"
        >
          Back to Home
        </Link>
      </section>
    );
  }

  return (
    <section className="page-container py-8 md:py-12">
      <Link to="/" className="text-sm text-[var(--text-muted)]">
        Home
      </Link>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[2px] text-[var(--brand)]">
            Find your perfect cake
          </p>

          <h1
            className="mt-2 text-3xl font-semibold"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {selectedCategory.name}
          </h1>

          {selectedCategory.description && (
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {selectedCategory.description}
            </p>
          )}
        </div>

        <span className="text-sm text-[var(--text-muted)]">
          {filteredProducts.length}{" "}
          {filteredProducts.length === 1 ? "cake" : "cakes"}
        </span>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => {
            const productId = getProductId(product);

            return (
              <Link
                key={productId}
                to={`/product/${productId}`}
                state={{ product }}
                className="group min-w-0"
              >
                <div className="overflow-hidden rounded-xl bg-[var(--cream-dark)]">
                  <img
                    src={getProductImage(product)}
                    alt={product.name || "Cake"}
                    loading="lazy"
                    decoding="async"
                    width="400"
                    height="400"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src =
                        "/images/placeholder.webp";
                    }}
                    className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>

                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold">
                      {product.name}
                    </h2>

                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      From ₹
                      {Number(getProductPrice(product)).toLocaleString(
                        "en-IN"
                      )}
                    </p>
                  </div>

                  <ArrowRight
                    size={16}
                    className="mt-1 shrink-0 text-[var(--brand)]"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-10 flex flex-col items-center border-y border-[var(--border)] py-12 text-center">
          <CakeSlice size={32} className="text-[var(--brand)]" />

          <h2 className="mt-4 text-lg font-semibold">
            No {selectedCategory.name.toLowerCase()} products available
          </h2>

          <p className="mt-2 text-sm text-[var(--text-muted)]">
            We don't have any products in this category right now.
          </p>

          <Link
            to="/"
            className="mt-5 text-sm font-semibold text-[var(--brand)]"
          >
            Browse other categories →
          </Link>
        </div>
      )}
    </section>
  );
}

export default CategoryProducts;