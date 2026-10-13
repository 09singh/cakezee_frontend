
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  Heart,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";
import { addToCart, getCart, removeCartItem } from "../../../data/cart";

import {
  getCategories,
  getProducts,
  getReadyNowProducts,
} from "../../../api/auth.api";

import { products as fallbackProducts } from "../../../data/product/products";
import { categories as fallbackCategories } from "../../../data/product/categories";
import Heroimage from "../../../assets/images/chocolate-cake-hero.png";
import CakezeeCoin from "../../../components/common/CakezeeCoin";
const CREAM = "#fffaf6";

function getId(value) {
  if (!value) return "";

  if (typeof value === "object") {
    return String(value._id ?? value.id ?? "");
  }

  return String(value);
}

function getResponseArray(response, keys = []) {
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

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;

    if (candidate && typeof candidate === "object") {
      for (const key of keys) {
        if (Array.isArray(candidate[key])) {
          return candidate[key];
        }
      }
    }
  }

  return [];
}

function getProductUrl(product) {
  const id = getId(product?._id ?? product?.id);
  return id ? `/product/${id}` : "/category/all";
}

function getProductImage(product) {
  return (
    product?.images?.[0]?.url ||
    (typeof product?.image === "string"
      ? product.image
      : product?.image?.url) ||
    "/images/placeholder.webp"
  );
}

function getCategoryImage(category) {
  return (
    category?.image?.url ||
    (typeof category?.image === "string"
      ? category.image
      : "") ||
    "/images/placeholder.webp"
  );
}

function getProductPrice(product) {
  const price =
    product?.pricing?.minPrice ??
    product?.price ??
    product?.pricing?.basePrice ??
    product?.flavours?.[0]?.basePrice ??
    product?.flavors?.[0]?.basePrice ??
    0;

  return Number(price) || 0;
}

function normalizeProduct(product) {
  const flavourPrices = (
    product?.flavours || product?.flavors || []
  )
    .map((flavour) => Number(flavour.basePrice))
    .filter((price) => Number.isFinite(price) && price >= 0);

  const baseWeight = Number(product?.pricing?.baseWeight) || 0.5;

  const weights = (product?.sizes || [])
    .map((size) =>
      String(size.unit || "kg").toLowerCase() === "g"
        ? Number(size.value) / 1000
        : Number(size.value)
    )
    .filter((weight) => Number.isFinite(weight) && weight > 0);

  const minimumWeight = weights.length
    ? Math.min(...weights)
    : baseWeight;

  const calculatedPrice = flavourPrices.length
    ? Math.min(...flavourPrices) * (minimumWeight / baseWeight)
    : 0;

  return {
    ...product,
    id: product._id ?? product.id,
    image: getProductImage(product),
    price:
      product?.pricing?.minPrice ??
      product?.price ??
      product?.pricing?.basePrice ??
      calculatedPrice,
  };
}

function formatPrice(price) {
  return Number(price || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });
}

function SectionHeading({
  eyebrow,
  title,
  link = "/category/all",
  linkText = "View All",
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3 md:mb-5">
      <div>
        {eyebrow && (
          <p className="mb-1 text-[9px] font-semibold uppercase tracking-[2px] text-[#a46a61] md:text-[10px]">
            {eyebrow}
          </p>
        )}

        <h2
          className="text-[20px] font-semibold leading-tight tracking-[-0.5px] text-[#39221e] md:text-[27px]"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {title}
        </h2>
      </div>

      <Link
        to={link}
        className="inline-flex shrink-0 items-center gap-1 pb-0.5 text-[10px] font-semibold text-[#702735] md:text-xs"
      >
        {linkText}
        <ChevronRight size={14} />
      </Link>
    </div>
  );
}

function ProductCard({ product, index = 0 }) {
  const image = getProductImage(product);
  const productId = getId(product?._id ?? product?.id);
  const cartKey = `product-heart-${productId}`;
  const [inCart, setInCart] = useState(() =>
    getCart().some((item) => item.key === cartKey)
  );

  function toggleCart(event) {
    event.preventDefault();
    event.stopPropagation();

    if (inCart) {
      removeCartItem(cartKey);
      setInCart(false);
      return;
    }

    const flavour = (product?.flavours || product?.flavors || [])[0];
    const size = (product?.sizes || [])[0];
    const weight = size
      ? String(size.unit || "kg").toLowerCase() === "g"
        ? Number(size.value) / 1000
        : Number(size.value)
      : 0.5;
    const baseWeight = Number(product?.pricing?.baseWeight) || 0.5;
    const basePrice = getProductPrice(product) * (weight / baseWeight);

    addToCart({
      key: cartKey,
      productId,
      name: product.name || "Freshly Baked Cake",
      image,
      category: product.categoryId?.slug || product.category || "",
      size: size?.name || (size ? `${size.value} ${size.unit || "kg"}` : "0.5 kg"),
      weight,
      flavour: flavour?.name || "",
      basePrice,
      quantity: 1,
      decorationCharge: 0,
      message: "",
      addons: [],
      customisation: {},
      delivery: {},
    });
    setInCart(true);
  }

  return (
    <Link
      to={getProductUrl(product)}
      className="group min-w-0 overflow-hidden rounded-xl border border-[#eaded6] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(73,30,35,0.10)] md:rounded-2xl"
    >
      <div className="relative overflow-hidden bg-[#f4e8df]">
        <img
          src={image}
          alt={product.name || "Cake"}
          loading={index < 4 ? "eager" : "lazy"}
          decoding="async"
          width="400"
          height="320"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = "/images/placeholder.webp";
          }}
          className="aspect-[1.12/1] w-full object-cover transition duration-500 group-hover:scale-105"
        />

        {index < 2 && (
          <span className="absolute left-2 top-2 rounded-sm bg-[#702735] px-2 py-1 text-[8px] font-semibold uppercase tracking-wide text-white md:text-[9px]">
            Bestseller
          </span>
        )}

        {product.productType !== "ready_now" && <button
          type="button"
          onClick={toggleCart}
          aria-label={inCart ? `Remove ${product.name} from cart` : `Add ${product.name} to cart`}
          aria-pressed={inCart}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#702735] shadow-sm transition hover:bg-white"
        >
          <Heart size={13} fill={inCart ? "currentColor" : "none"} />
        </button>}
      </div>

      <div className="p-2.5 md:p-3.5">
        <p className="truncate text-[11px] font-semibold text-[#3d2723] md:text-sm">
          {product.name || "Freshly Baked Cake"}
        </p>

        <div className="mt-1.5 flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold text-[#702735] md:text-sm">
            ₹{formatPrice(getProductPrice(product))}
          </p>

          <span className="flex items-center gap-0.5 text-[9px] text-[#98704a] md:text-[10px]">
            <Star size={10} fill="currentColor" />
            Fresh
          </span>
        </div>
      </div>
    </Link>
  );
}

function Home() {
  const [products, setProducts] = useState(() =>
    fallbackProducts.map(normalizeProduct)
  );

  const [categories, setCategories] = useState(fallbackCategories);
  const [readyNowProducts, setReadyNowProducts] = useState([]);

  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadHomeData() {
      async function loadAllReadyNowProducts() {
        const allProducts = [];
        let page = 1;
        let hasNextPage = true;

        while (hasNextPage) {
          const response = await getReadyNowProducts({ limit: 50, page });
          const pageProducts = getResponseArray(response, [
            "products",
            "items",
            "results",
          ]);
          allProducts.push(
            ...pageProducts.filter(
              (product) =>
                String(product.readyNowCategory || "").toLowerCase() !== "combos"
            )
          );
          hasNextPage = Boolean(
            response?.pagination?.hasNext && pageProducts.length
          );
          page += 1;
        }

        return allProducts;
      }

      const [categoryResult, productResult, readyNowResult] =
        await Promise.allSettled([
          getCategories(),
          getProducts({ limit: 50, page: 1 }),
          loadAllReadyNowProducts(),
        ]);

      if (cancelled) return;

      if (categoryResult.status === "fulfilled") {
        const result = getResponseArray(
          categoryResult.value,
          ["categories", "items", "results"]
        );

        if (result.length) {
          setCategories(result);
        }
      } else {
        console.error(
          "Categories API error:",
          categoryResult.reason
        );
      }

      if (productResult.status === "fulfilled") {
        const result = getResponseArray(
          productResult.value,
          ["products", "items", "results"]
        );

        if (result.length) {
          setProducts(result.map(normalizeProduct));
        }
      } else {
        console.error(
          "Products API error:",
          productResult.reason
        );
      }

      if (readyNowResult.status === "fulfilled") {
        const result = getResponseArray(readyNowResult.value, ["products", "items", "results"]);
        setReadyNowProducts(result.map(normalizeProduct));
      } else {
        console.error("Ready Now products API error:", readyNowResult.reason);
      }
    }

    loadHomeData();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return products;

    return products.filter((product) =>
      String(product.name || "")
        .toLowerCase()
        .includes(query)
    );
  }, [products, search]);

  const featuredProducts = visibleProducts.slice(0, 8);

  const categoryProducts = visibleProducts.slice(4, 9);

  const shopCategories = categories.slice(0, 12);

  return (
    <main
      className="min-h-screen overflow-hidden pb-8 text-[#392522]"
      style={{ backgroundColor: CREAM }}
    >
      {/* HERO — desktop and mobile */}
      <section className="mx-auto max-w-[1440px] px-3 pt-3 md:px-7 md:pt-5">
        <div className="group relative isolate min-h-[235px] overflow-hidden rounded-xl bg-[#29120f] shadow-[0_12px_32px_rgba(56,22,20,0.12)] md:min-h-[350px] md:rounded-2xl lg:min-h-[405px]">
          {/* <CakezeeCoin /> */}
          <img
            src={Heroimage}
            alt="Chocolate celebration cake by Cakezee"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-[68%_50%] transition-transform duration-1000 group-hover:scale-[1.02]"
          />

          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(90deg,rgba(29,10,12,0.96)_0%,rgba(39,13,15,0.84)_32%,rgba(40,15,16,0.36)_60%,rgba(30,12,12,0.04)_100%)]"
          />

          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(0deg,rgba(25,8,10,0.35),transparent_55%)]"
          />

          <div className="relative z-10 flex min-h-[235px] items-center px-5 py-7 sm:px-8 md:min-h-[350px] md:px-12 lg:min-h-[405px] lg:px-[72px]">
            <div className="max-w-[460px] text-white">
              <p className="mb-3 flex items-center gap-2 text-[8px] font-semibold uppercase tracking-[3px] text-[#edc3a5] md:mb-5 md:text-[10px] md:tracking-[4px]">
                <span className="h-px w-6 bg-[#dba28c]" />
                CAKEZEE · BAKED WITH LOVE
              </p>

              <h1
                className="max-w-[340px] text-[29px] font-medium leading-[1.08] tracking-[-0.8px] sm:text-[35px] md:max-w-[430px] md:text-[48px] lg:text-[57px]"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Something sweet
                <br />
                for every{" "}
                <span className="italic text-[#f0bca3]">
                  moment.
                </span>
              </h1>

              <p className="mt-3 max-w-[290px] text-[10px] leading-5 text-white/75 sm:text-xs md:mt-5 md:max-w-[360px] md:text-sm md:leading-6">
                Handcrafted cakes, made fresh for your
                birthdays, celebrations and sweetest memories.
              </p>

              <div className="mt-5 flex flex-wrap gap-2 md:mt-7 md:gap-3">
                <Link
                  to="/category/all"
                  className="inline-flex items-center gap-2 rounded-md bg-[#9b4248] px-4 py-2.5 text-[10px] font-semibold text-white transition hover:bg-[#b35559] sm:px-5 md:rounded-lg md:px-6 md:py-3 md:text-xs"
                >
                  Explore Cakes
                  <ArrowRight size={14} />
                </Link>

                <Link
                  to="/category/ready-now"
                  className="inline-flex items-center gap-2 rounded-md border border-white/35 bg-white/10 px-4 py-2.5 text-[10px] font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 sm:px-5 md:rounded-lg md:px-6 md:py-3 md:text-xs"
                >
                  <Sparkles size={13} />
                  Ready Now
                </Link>
              </div>

              <p className="mt-4 text-[9px] tracking-wide text-white/65 md:mt-6 md:text-[10px]">
                Freshly baked · Beautifully crafted · Made for you
              </p>
            </div>
          </div>

          <div className="absolute bottom-3 right-4 z-10 hidden items-center gap-1.5 text-[9px] text-white/75 md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e7b29c]" />
            A little sweetness goes a long way
          </div>
        </div>
      </section>

      {/* QUICK DELIVERY PROMISES — mobile */}
      <section className="mx-auto mt-3 grid max-w-[1440px] grid-cols-2 gap-2 px-3 md:hidden">
        <Link
          to="/category/ready-now"
          className="flex items-center gap-2 rounded-lg border border-[#eadbd2] bg-white px-3 py-3"
        >
          <span className="text-lg">⚡</span>
          <span>
            <span className="block text-[11px] font-semibold">
              Ready Now
            </span>
            <span className="text-[9px] text-[#927b70]">
              Fresh & ready
            </span>
          </span>
        </Link>

        <Link
          to="/category/all"
          className="flex items-center gap-2 rounded-lg border border-[#eadbd2] bg-white px-3 py-3"
        >
          <span className="text-lg">🎂</span>
          <span>
            <span className="block text-[11px] font-semibold">
              Made to Order
            </span>
            <span className="text-[9px] text-[#927b70]">
              Made for your moment
            </span>
          </span>
        </Link>
      </section>

      {/* SEARCH */}
      <section className="mx-auto mt-4 max-w-[1440px] px-3 md:mt-5 md:px-7">
        <form
          onSubmit={(event) => {
            event.preventDefault();

            if (search.trim()) {
              document
                .getElementById("bestsellers")
                ?.scrollIntoView({ behavior: "smooth" });
            }
          }}
          className="flex items-center gap-2 rounded-lg border border-[#e9dcd3] bg-white px-3 py-2.5 md:mx-auto md:max-w-[440px]"
        >
          <Search size={15} className="shrink-0 text-[#98796d]" />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search cakes, flavours and occasions..."
            aria-label="Search cakes"
            className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-[#a9978e]"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-[10px] font-semibold text-[#702735]"
            >
              Clear
            </button>
          )}
        </form>
      </section>

      {/* SHOP BY OCCASION */}
      <section className="mx-auto mt-6 max-w-[1440px] px-3 md:mt-8 md:px-7">
        <SectionHeading
          eyebrow="Find your perfect cake"
          title="Shop by Occasion"
        />

        <div className="flex gap-2.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-6 md:gap-4 lg:grid-cols-8">
          {shopCategories.map((category) => {
            const id = getId(category._id ?? category.id);

            return (
              <Link
                key={id || category.name}
                to={`/category/${id || "all"}`}
                className="group w-[100px] shrink-0 text-center sm:w-[120px] md:w-auto"
              >
                <div className="overflow-hidden rounded-lg bg-[#f1e4dc] md:rounded-xl">
                  <img
                    src={getCategoryImage(category)}
                    alt={category.name || "Cake occasion"}
                    loading="lazy"
                    decoding="async"
                    width="260"
                    height="220"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = "/images/placeholder.webp";
                    }}
                    className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105 md:aspect-[1.18/1]"
                  />
                </div>

                <p className="mt-2 truncate text-[10px] font-medium text-[#49332e] group-hover:text-[#8b3944] md:text-xs">
                  {category.name || "Explore Cakes"}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* BESTSELLER COLLECTION */}
      <section
        id="bestsellers"
        className="mx-auto mt-8 max-w-[1440px] px-3 md:mt-12 md:px-7"
      >
        <SectionHeading
          eyebrow="Loved by our customers"
          title="Bestseller Collection"
          // linkText="View All"
        />

        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:gap-5">
            {featuredProducts.map((product, index) => (
              <ProductCard
                key={getId(product._id ?? product.id) || index}
                product={product}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[#eaded6] bg-white px-4 py-10 text-center">
            <p className="text-sm text-[#806a60]">
              No cakes found. Try a different search.
            </p>
            {/* <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-3 text-xs font-semibold text-[#702735] underline"
            >
              Show all cakes
            </button> */}
          </div>
        )}
      </section>

      {/* FIND YOUR CAKE */}
      <section className="mx-auto mt-8 max-w-[1440px] px-3 md:mt-12 md:px-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="mb-1 text-[9px] font-semibold uppercase tracking-[2px] text-[#a46a61]">
              Made for your moments
            </p>
            <h2
              className="text-[19px] font-semibold md:text-[25px]"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Find Your Cake
            </h2>
          </div>

          <Link
            to="/category/all"
            className="text-[10px] font-semibold text-[#702735] md:text-xs"
          >
            Explore all →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:gap-4">
          {[
            {
              title: "Birthday Cakes",
              subtitle: "Make their day special",
              emoji: "🎂",
              href: "/category/birthday",
            },
            {
              title: "Anniversary",
              subtitle: "Celebrate your love",
              emoji: "❤️",
              href: "/category/anniversary",
            },
            {
              title: "Kids' Cakes",
              subtitle: "Big smiles, sweet bites",
              emoji: "🧸",
              href: "/category/kids",
            },
            {
              title: "Custom Cakes",
              subtitle: "Your idea, our creation",
              emoji: "✨",
              href: "/category/all",
            },
          ].map((item) => (
            <Link
              key={item.title}
              to={item.href}
              className="flex min-w-0 items-center gap-2 rounded-xl border border-[#eadbd2] bg-white p-2.5 transition hover:border-[#b9827b] hover:shadow-sm md:gap-3 md:p-4"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f7ece6] text-lg md:h-12 md:w-12 md:text-2xl">
                {item.emoji}
              </span>

              <span className="min-w-0">
                <span className="block truncate text-[10px] font-semibold md:text-xs">
                  {item.title}
                </span>
                <span className="mt-1 block truncate text-[8px] text-[#927b70] md:text-[10px]">
                  {item.subtitle}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

    
{/* MAKE IT YOURS — premium promotional banner */}
<section className="mx-auto mt-10 max-w-[1440px] px-3 md:mt-16 md:px-7">
  <div className="group relative isolate overflow-hidden rounded-2xl bg-[#4e1723] shadow-[0_18px_50px_rgba(78,23,35,0.16)] md:grid md:grid-cols-[0.92fr_1.08fr] md:rounded-[28px]">

    {/* Decorative background */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full border border-[#e9c99d]/15 md:h-96 md:w-96"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -left-12 -top-16 h-56 w-56 rounded-full border border-[#e9c99d]/10 md:h-72 md:w-72"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute bottom-0 left-0 h-1 w-2/3 bg-gradient-to-r from-[#e8bd91] via-[#b87962] to-transparent"
    />

    {/* Content */}
    <div className="relative z-10 flex items-center px-6 py-9 sm:px-9 sm:py-11 md:px-9 md:py-12 lg:px-14 lg:py-16">
      <div className="max-w-[470px]">

        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#e9c99d]/25 bg-white/[0.06] px-3 py-2 text-[9px] font-semibold uppercase tracking-[2px] text-[#f0cda7] md:text-[10px] md:tracking-[2.5px]">
          <Sparkles size={13} />
          Made just for you
        </p>

        <h2
          className="max-w-[430px] text-[34px] font-medium leading-[1.08] tracking-[-1px] text-[#fff5e9] sm:text-[42px] md:text-[39px] lg:text-[52px]"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Every celebration
          <br />
          deserves a{" "}
          <span className="italic text-[#e9bd91]">
            little magic.
          </span>
        </h2>

        <p className="mt-4 max-w-[360px] text-[12px] leading-6 text-[#f4dfd5]/75 sm:text-[13px] md:mt-5 md:text-sm md:leading-7">
          Your favourite flavours. Your special message. Your
          beautiful moment. Let us create a cake that feels
          uniquely yours.
        </p>

        {/* Highlights */}
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-[#f0d4c4]/90 md:mt-6 md:gap-x-5 md:text-[11px]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e9bd91]" />
            Custom designs
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e9bd91]" />
            Personalised messages
          </span>
        </div>

        <Link
          to="/category/all"
          className="group/btn mt-7 inline-flex items-center gap-3 rounded-lg bg-[#f0d0ad] px-5 py-3.5 text-[11px] font-bold text-[#4e1723] shadow-[0_6px_20px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#fff0dc] hover:shadow-lg sm:px-6 md:mt-8 md:text-xs"
        >
          Create Your Dream Cake
          <ArrowRight
            size={15}
            className="transition-transform duration-300 group-hover/btn:translate-x-1"
          />
        </Link>

        <p className="mt-4 text-[9px] italic tracking-wide text-[#f0d4c4]/55 md:text-[10px]">
          Crafted with love, baked for your moments.
        </p>
      </div>
    </div>

    {/* Image panel */}
    <div className="relative min-h-[240px] overflow-hidden bg-[#32121b] sm:min-h-[300px] md:min-h-[390px] lg:min-h-[440px]">

      <img
        src={
          readyNowProducts[0]
            ? getProductImage(readyNowProducts[0])
            : Heroimage
        }
        alt="Beautifully decorated celebration cake by Cakezee"
        loading="lazy"
        decoding="async"
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = Heroimage;
        }}
        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
      />

      {/* Image overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#2c0d17]/70 via-transparent to-[#2c0d17]/10 md:bg-gradient-to-r md:from-[#4e1723]/35 md:via-transparent md:to-transparent" />

      {/* Decorative corner accents */}
      <div className="pointer-events-none absolute right-4 top-4 h-12 w-12 rounded-tr-2xl border-r border-t border-white/50 md:right-7 md:top-7 md:h-16 md:w-16" />
      <div className="pointer-events-none absolute bottom-4 left-4 h-12 w-12 rounded-bl-2xl border-b border-l border-white/35 md:bottom-7 md:left-7 md:h-16 md:w-16" />

      {/* Floating label */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 rounded-xl border border-white/20 bg-[#fffaf6]/95 p-3 shadow-[0_8px_30px_rgba(0,0,0,0.15)] backdrop-blur-md sm:bottom-6 sm:left-6 sm:right-6 sm:p-4 md:bottom-7 md:left-7 md:right-7">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3e3d5] text-[#702735] sm:h-11 sm:w-11">
            <Heart size={19} fill="currentColor" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-[#54232b] sm:text-xs">
              Baked with love
            </p>
            <p className="mt-1 text-[9px] text-[#8b6a60] sm:text-[10px]">
              A little sweetness, made personal
            </p>
          </div>
        </div>
        <Sparkles size={18} className="shrink-0 text-[#b27a55]" />
      </div>
    </div>
  </div>
</section>

      {/* READY NOW */}
      <section className="mx-auto mt-8 max-w-[1440px] px-3 md:mt-12 md:px-7">
        <SectionHeading
          eyebrow="A little sweetness, right away"
          title="Ready Now"
          link="/category/ready-now"
          linkText="See All"
        />

        {readyNowProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
            {readyNowProducts.map((product, index) => (
              <ProductCard
                key={getId(product._id ?? product.id) || index}
                product={product}
                index={index}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-white p-5 text-xs text-[#806a60]">
            No cakes are available to display right now.
          </p>
        )}
      </section>

      {/* TRENDING CAKES */}
      <section className="mx-auto mt-8 max-w-[1440px] px-3 md:mt-12 md:px-7">
        <SectionHeading
          eyebrow="Something worth sharing"
          title="Trending Cakes"
          // linkText="Explore More"
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
          {(categoryProducts.length
            ? categoryProducts.slice(0, 4)
            : readyNowProducts
          ).map((product, index) => (
            <ProductCard
              key={getId(product._id ?? product.id) || index}
              product={product}
              index={index}
            />
          ))}
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="mx-auto mt-8 max-w-[1440px] px-3 md:mt-12 md:px-7">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#eadbd2] bg-[#eadbd2] sm:grid-cols-4">
          {[
            {
              icon: "🎂",
              title: "Freshly Baked",
              description: "Made with care",
            },
            {
              icon: "💝",
              title: "Made for You",
              description: "Personalised treats",
            },
            {
              icon: "🚚",
              title: "Easy Ordering",
              description: "Simple checkout",
            },
            {
              icon: "♡",
              title: "Made with Love",
              description: "For every occasion",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-2.5 bg-[#fffaf6] px-3 py-4 md:justify-center md:gap-3 md:py-5"
            >
              <span className="text-lg md:text-xl">{item.icon}</span>
              <span>
                <span className="block text-[10px] font-semibold md:text-xs">
                  {item.title}
                </span>
                <span className="mt-1 block text-[8px] text-[#927b70] md:text-[10px]">
                  {item.description}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-8 bg-[#4e1723] text-white md:mt-12">
        <div className="mx-auto max-w-[1440px] px-5 py-8 md:px-9 md:py-10">
          <div className="grid grid-cols-2 gap-x-6 gap-y-7 md:grid-cols-4 md:gap-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link
                to="/"
                className="inline-block text-[30px] leading-none"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Cakezee
              </Link>

              <p className="mt-3 max-w-[240px] text-[10px] leading-5 text-white/65 md:text-xs">
                Crafted with love, baked with care. Bringing
                a little sweetness to every special moment.
              </p>

              <div className="mt-4 flex items-center gap-2 text-[10px] text-[#efc9b7]">
                <Sparkles size={13} />
                Sweet moments start here.
              </div>
            </div>

            {/* Shop */}
            <div>
              <h3
                className="text-sm font-semibold"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Explore
              </h3>

              <div className="mt-4 space-y-3 text-[10px] text-white/65 md:text-xs">
                <Link
                  className="block transition hover:text-white"
                  to="/category/all"
                >
                  All Cakes
                </Link>
                <Link
                  className="block transition hover:text-white"
                  to="/category/ready-now"
                >
                  Ready Now
                </Link>
                <Link
                  className="block transition hover:text-white"
                  to="/category/birthday"
                >
                  Birthday Cakes
                </Link>
                <Link
                  className="block transition hover:text-white"
                  to="/category/anniversary"
                >
                  Anniversary Cakes
                </Link>
              </div>
            </div>

            {/* Help */}
            <div>
              <h3
                className="text-sm font-semibold"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Customer Care
              </h3>

              <div className="mt-4 space-y-3 text-[10px] text-white/65 md:text-xs">
                <Link
                  className="block transition hover:text-white"
                  to="/orders"
                >
                  My Orders
                </Link>
                <Link
                  className="block transition hover:text-white"
                  to="/category/all"
                >
                  Help & Support
                </Link>
                <Link
                  className="block transition hover:text-white"
                  to="/"
                >
                  Delivery Information
                </Link>
                <Link
                  className="block transition hover:text-white"
                  to="/"
                >
                  Terms & Conditions
                </Link>
              </div>
            </div>

           {/* 
            <div>
              <h3
                className="text-sm font-semibold"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Staff & Management
              </h3>

              <p className="mt-3 text-[10px] leading-5 text-white/60 md:text-xs">
                Access the Cakezee staff portal.
              </p>

              <Link
                to="/staff/login"
                className="mt-4 inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/5 px-3 py-2.5 text-[10px] font-medium text-white/85 transition hover:bg-white/10 hover:text-white md:text-xs"
              >
                <ShieldCheck size={14} />
                Staff Login
              </Link>
            </div>*/}
          </div>

          <div className="mt-7 flex flex-col items-center justify-between gap-3 border-t border-white/15 pt-5 text-center md:mt-9 md:flex-row md:text-left">
            <p className="text-[9px] text-white/50 md:text-[10px]">
              © {new Date().getFullYear()} Cakezee. All rights reserved.
            </p>

            <p className="text-[9px] italic text-[#e9c1b2] md:text-xs">
              Life is sweeter with cake.
            </p>

            <div className="flex items-center gap-2 text-[9px] text-white/55 md:text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d7a18b]" />
              Baked with love
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default Home;
