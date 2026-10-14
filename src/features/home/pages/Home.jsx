
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  Heart,
  Sparkles,
  Star,
  X,
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

// IMPORTANT: Replace this with Cakezee's real WhatsApp number.
// Include country code 91. Do not include +, spaces or dashes.
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER;

const WHATSAPP_MESSAGE =
  "Hi Cakezee! I need help with an order or customer support, or I would like to customise a cake. Please help me.";

function WhatsAppSupport() {
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowWelcome(false);
    }, 8000);

    return () => window.clearTimeout(timer);
  }, []);

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    WHATSAPP_MESSAGE
  )}`;

  return (
    <div className="fixed bottom-[90px] right-4 z-[100] flex max-w-[calc(100vw-24px)] flex-col items-end gap-3 md:bottom-6 sm:right-6">
      {/* Welcome message displayed when the website opens */}
      {showWelcome && (
        <div
          role="status"
          className="relative w-[285px] max-w-full overflow-hidden rounded-2xl border border-[#eaded6] bg-white shadow-[0_12px_40px_rgba(45,25,20,0.18)] animate-[whatsappWelcomeIn_0.35s_ease-out]"
        >
          <div className="flex items-start gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e7f8ed]">
              <svg
                viewBox="0 0 32 32"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path
                  fill="#25D366"
                  d="M16.04 3C8.87 3 3.04 8.78 3.04 15.9c0 2.28.6 4.51 1.73 6.48L3 29l6.82-1.78a13.1 13.1 0 0 0 6.22 1.57h.01c7.17 0 13-5.79 13-12.9C29.05 8.77 23.21 3 16.04 3Z"
                />
                <path
                  fill="#fff"
                  d="M23.6 19.66c-.32-.16-1.9-.93-2.2-1.03-.3-.11-.51-.16-.73.16-.22.32-.84 1.03-1.03 1.24-.19.22-.38.24-.7.08-.32-.16-1.36-.5-2.59-1.59-.96-.85-1.61-1.9-1.8-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.38.48-.57.16-.19.21-.32.32-.54.1-.22.05-.4-.03-.57-.08-.16-.73-1.75-1-2.4-.26-.63-.53-.55-.73-.56h-.62c-.22 0-.57.08-.87.4-.3.33-1.14 1.11-1.14 2.7s1.17 3.13 1.33 3.35c.16.21 2.3 3.5 5.57 4.9.78.33 1.38.53 1.85.68.78.25 1.49.21 2.05.13.63-.1 1.9-.78 2.17-1.54.27-.76.27-1.41.19-1.54-.08-.14-.3-.22-.62-.38Z"
                />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-[#392522]">
                  Need a little help?
                </p>

                <button
                  type="button"
                  onClick={() => setShowWelcome(false)}
                  aria-label="Close WhatsApp welcome message"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#927b70] transition hover:bg-[#f5eee9]"
                >
                  <X size={15} />
                </button>
              </div>

              <p className="mt-1.5 text-xs leading-5 text-[#78645b]">
                Need help with an order or want a customised cake?
                Chat with us directly on WhatsApp!
              </p>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-[#1fb858]"
              >
                <svg
                  viewBox="0 0 32 32"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M16.04 3C8.87 3 3.04 8.78 3.04 15.9c0 2.28.6 4.51 1.73 6.48L3 29l6.82-1.78a13.1 13.1 0 0 0 6.22 1.57h.01c7.17 0 13-5.79 13-12.9C29.05 8.77 23.21 3 16.04 3Zm0 23.6h-.01a10.8 10.8 0 0 1-5.5-1.5l-.4-.23-4.05 1.06 1.08-3.94-.26-.41a10.65 10.65 0 0 1-1.64-5.68c0-5.93 4.86-10.75 10.79-10.75 2.87 0 5.57 1.11 7.6 3.14a10.65 10.65 0 0 1 3.16 7.6c0 5.92-4.85 10.75-10.77 10.75Zm5.91-8.05c-.32-.16-1.9-.93-2.2-1.03-.3-.11-.51-.16-.73.16-.22.32-.84 1.03-1.03 1.24-.19.22-.38.24-.7.08-.32-.16-1.36-.5-2.59-1.59-.96-.85-1.61-1.9-1.8-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.38.48-.57.16-.19.21-.32.32-.54.1-.22.05-.4-.03-.57-.08-.16-.73-1.75-1-2.4-.26-.63-.53-.55-.73-.56h-.62c-.22 0-.57.08-.87.4-.3.33-1.14 1.11-1.14 2.7s1.17 3.13 1.33 3.35c.16.21 2.3 3.5 5.57 4.9.78.33 1.38.53 1.85.68.78.25 1.49.21 2.05.13.63-.1 1.9-.78 2.17-1.54.27-.76.27-1.41.19-1.54-.08-.14-.3-.22-.62-.38Z"
                  />
                </svg>
                Chat with us
              </a>
            </div>
          </div>

          <div className="h-1 w-full bg-gradient-to-r from-[#25D366] via-[#b8edc9] to-transparent" />
        </div>
      )}

      {/* Floating WhatsApp button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Cakezee customer support on WhatsApp"
        title="Chat with Cakezee on WhatsApp"
        className="group relative flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.38)] transition duration-300 hover:scale-105 hover:bg-[#1fb858] active:scale-95"
      >
        {/* Notification indicator */}
        <span className="absolute right-0.5 top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#ff4d4f]">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#ff4d4f] opacity-60" />
        </span>

        <svg
          viewBox="0 0 32 32"
          className="h-8 w-8 transition-transform duration-300 group-hover:rotate-[-8deg]"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M16.04 3C8.87 3 3.04 8.78 3.04 15.9c0 2.28.6 4.51 1.73 6.48L3 29l6.82-1.78a13.1 13.1 0 0 0 6.22 1.57h.01c7.17 0 13-5.79 13-12.9C29.05 8.77 23.21 3 16.04 3Zm0 23.6h-.01a10.8 10.8 0 0 1-5.5-1.5l-.4-.23-4.05 1.06 1.08-3.94-.26-.41a10.65 10.65 0 0 1-1.64-5.68c0-5.93 4.86-10.75 10.79-10.75 2.87 0 5.57 1.11 7.6 3.14a10.65 10.65 0 0 1 3.16 7.6c0 5.92-4.85 10.75-10.77 10.75Zm5.91-8.05c-.32-.16-1.9-.93-2.2-1.03-.3-.11-.51-.16-.73.16-.22.32-.84 1.03-1.03 1.24-.19.22-.38.24-.7.08-.32-.16-1.36-.5-2.59-1.59-.96-.85-1.61-1.9-1.8-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.38.48-.57.16-.19.21-.32.32-.54.1-.22.05-.4-.03-.57-.08-.16-.73-1.75-1-2.4-.26-.63-.53-.55-.73-.56h-.62c-.22 0-.57.08-.87.4-.3.33-1.14 1.11-1.14 2.7s1.17 3.13 1.33 3.35c.16.21 2.3 3.5 5.57 4.9.78.33 1.38.53 1.85.68.78.25 1.49.21 2.05.13.63-.1 1.9-.78 2.17-1.54.27-.76.27-1.41.19-1.54-.08-.14-.3-.22-.62-.38Z"
          />
        </svg>
      </a>
    </div>
  );
}

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
    (typeof category?.image === "string" ? category.image : "") ||
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

        {product.productType !== "ready_now" && (
          <button
            type="button"
            onClick={toggleCart}
            aria-label={
              inCart
                ? `Remove ${product.name} from cart`
                : `Add ${product.name} to cart`
            }
            aria-pressed={inCart}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#702735] shadow-sm transition hover:bg-white"
          >
            <Heart size={13} fill={inCart ? "currentColor" : "none"} />
          </button>
        )}
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
                String(product.readyNowCategory || "").toLowerCase() !==
                "combos"
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
        const result = getResponseArray(categoryResult.value, [
          "categories",
          "items",
          "results",
        ]);

        if (result.length) setCategories(result);
      } else {
        console.error("Categories API error:", categoryResult.reason);
      }

      if (productResult.status === "fulfilled") {
        const result = getResponseArray(productResult.value, [
          "products",
          "items",
          "results",
        ]);

        if (result.length) setProducts(result.map(normalizeProduct));
      } else {
        console.error("Products API error:", productResult.reason);
      }

      if (readyNowResult.status === "fulfilled") {
        const result = getResponseArray(readyNowResult.value, [
          "products",
          "items",
          "results",
        ]);

        setReadyNowProducts(result.map(normalizeProduct));
      } else {
        console.error(
          "Ready Now products API error:",
          readyNowResult.reason
        );
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
      String(product.name || "").toLowerCase().includes(query)
    );
  }, [products, search]);

  const featuredProducts = visibleProducts.slice(0, 8);

  const occasionPriority = [
    "birthday",
    "kids",
    "anniversary",
    "wedding",
    "engagement",
    "baby shower",
  ];

  const shopCategories = [...categories]
    .sort((a, b) => {
      const nameA = String(a.name || a.slug || "").toLowerCase();
      const nameB = String(b.name || b.slug || "").toLowerCase();

      const indexA = occasionPriority.findIndex((key) =>
        nameA.includes(key)
      );

      const indexB = occasionPriority.findIndex((key) =>
        nameB.includes(key)
      );

      return (
        (indexA === -1 ? 999 : indexA) -
        (indexB === -1 ? 999 : indexB)
      );
    })
    .slice(0, 6);

  const getProductSearchText = (product) =>
    [
      product?.name,
      product?.category,
      product?.categoryId?.name,
      product?.categoryId?.slug,
      product?.readyNowCategory,
      product?.productType,
      ...(Array.isArray(product?.tags) ? product.tags : []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

  const miniDelightProducts = products
    .filter((product) =>
      /mini.?delight|mini cake|miniature|cupcake|bento/.test(
        getProductSearchText(product)
      )
    )
    .slice(0, 4);

  const surpriseProducts = products
    .filter((product) =>
      /surprise|hamper|combo|gift box|cake hamper/.test(
        getProductSearchText(product)
      )
    )
    .slice(0, 4);

  return (
    <main
      className="min-h-screen overflow-hidden pb-8 text-[#392522]"
      style={{ backgroundColor: CREAM }}
    >
      {/* Floating 3D Cakezee coin background */}
      <div className="cakezee-floating-coin" aria-hidden="true">
        <div className="cakezee-floating-coin-inner">
          <CakezeeCoin />
        </div>
      </div>

      {/* HERO — desktop */}
      <section className="mx-auto hidden max-w-[1440px] px-3 pt-3 md:block md:px-7 md:pt-5">
        <div className="group relative isolate min-h-[235px] overflow-hidden rounded-xl bg-[#29120f] shadow-[0_12px_32px_rgba(56,22,20,0.12)] md:min-h-[350px] md:rounded-2xl lg:min-h-[405px]">
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
                <span className="italic text-[#f0bca3]">moment.</span>
              </h1>

              <p className="mt-3 max-w-[290px] text-[10px] leading-5 text-white/75 sm:text-xs md:mt-5 md:max-w-[360px] md:text-sm md:leading-6">
                Handcrafted cakes, made fresh for your birthdays,
                celebrations and sweetest memories.
              </p>

              <div className="mt-5 flex flex-wrap gap-2 md:mt-7 md:gap-3">
                <Link
                  to="/category/all"
                  className="inline-flex items-center gap-2 rounded-md bg-[#9b4248] px-4 py-2.5 text-[10px] font-semibold text-white transition hover:bg-[#b35559] sm:px-5 md:rounded-lg md:px-6 md:py-3 md:text-xs"
                >
                  Explore Cakes <ArrowRight size={14} />
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

      {/* MOBILE QUICK ORDER OPTIONS */}
      <section className="mx-auto mt-3 max-w-[1440px] overflow-hidden md:hidden">
        <div className="quick-options-marquee">
          <div className="quick-options-track">
            {[0, 1].map((group) => (
              <div
                key={group}
                className="flex shrink-0 gap-2 pr-2"
                aria-hidden={group === 1}
              >
                <Link
                  to="/category/ready-now"
                  tabIndex={group === 1 ? -1 : 0}
                  className="flex w-[82vw] max-w-[340px] shrink-0 items-center gap-2.5 rounded-xl border border-[#d9a15e] bg-gradient-to-br from-[#fff0d7] via-white to-[#f8dfbd] px-3 py-3 shadow-[0_4px_14px_rgba(143,76,35,0.12)]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                    ⚡
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-extrabold text-[#592a20]">
                      Ready Now
                    </span>
                    <span className="mt-1 block text-[10px] font-extrabold text-[#a34b24]">
                      Delivery in 20 minutes*
                    </span>
                    <span className="mt-0.5 block text-[9px] text-[#886b59]">
                      Fresh cakes, ready to go
                    </span>
                  </span>
                  <ArrowRight size={15} className="shrink-0 text-[#8b4230]" />
                </Link>

                <Link
                  to="/category/all"
                  tabIndex={group === 1 ? -1 : 0}
                  className="flex w-[82vw] max-w-[340px] shrink-0 items-center gap-2.5 rounded-xl border border-[#eadbd2] bg-gradient-to-br from-white to-[#f5e8df] px-3 py-3"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                    🎂
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-bold text-[#392522]">
                      Made to Order
                    </span>
                    <span className="mt-1 block text-[10px] font-semibold text-[#702735]">
                      Made for your moment
                    </span>
                    <span className="mt-0.5 block text-[9px] text-[#927b70]">
                      Choose your favourite cake
                    </span>
                  </span>
                  <ArrowRight size={15} className="shrink-0 text-[#96766b]" />
                </Link>

                <a
                  href="YOUR_ZOMATO_SHOP_URL"
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={group === 1 ? -1 : 0}
                  className="flex w-[82vw] max-w-[340px] shrink-0 items-center gap-2.5 rounded-xl border border-[#f0c9c4] bg-gradient-to-br from-white to-[#fff0ed] px-3 py-3"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e23744] text-xl text-white">
                    🛵
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-extrabold text-[#b92332]">
                      Order on Zomato
                    </span>
                    <span className="mt-1 block text-[10px] font-semibold text-[#702735]">
                      Order your favourites
                    </span>
                    <span className="mt-0.5 block text-[9px] text-[#927b70]">
                      Browse our menu
                    </span>
                  </span>
                  <ArrowRight size={15} className="shrink-0 text-[#b92332]" />
                </a>

                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                    "Hi Cakezee! I want to design my own cake. Please help me with customisation and pricing."
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={group === 1 ? -1 : 0}
                  className="flex w-[82vw] max-w-[340px] shrink-0 items-center gap-2.5 rounded-xl border border-[#b9dfc1] bg-gradient-to-br from-white to-[#eaf8ed] px-3 py-3"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25a75a] text-xl text-white">
                    💬
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-extrabold text-[#176b3a]">
                      Design Your Own Cake
                    </span>
                    <span className="mt-1 block text-[10px] font-semibold text-[#25804a]">
                      Let's create something special
                    </span>
                    <span className="mt-0.5 block text-[9px] text-[#64856d]">
                      Chat on WhatsApp
                    </span>
                  </span>
                  <ArrowRight size={15} className="shrink-0 text-[#25804a]" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OCCASIONS */}
      <section className="mx-auto mt-5 max-w-[1440px] px-3 md:mt-8 md:px-7">
        <SectionHeading
          eyebrow="Find your perfect cake"
          title="What are you celebrating?"
        />

        <div className="grid grid-cols-3 gap-x-3 gap-y-4 md:grid-cols-6 md:gap-4">
          {shopCategories.map((category) => {
            const id = getId(category._id ?? category.id);

            return (
              <Link
                key={id || category.name}
                to={`/category/${id || "all"}`}
                className="group min-w-0 text-center"
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
                    className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                </div>

                <p className="mt-2 truncate text-[10px] font-medium text-[#49332e] group-hover:text-[#8b3944] md:text-xs">
                  {category.name || "Explore Cakes"}
                </p>
              </Link>
            );
          })}
        </div>

        <div className="mt-4 flex justify-center">
          <Link
            to="/category/all"
            className="inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-lg border border-[#b98b82] bg-white px-4 py-3 text-[11px] font-semibold text-[#702735] transition hover:bg-[#f8eee9] md:text-xs"
          >
            View More Categories <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* MOST ORDERED */}
      <section
        id="bestsellers"
        className="mx-auto mt-8 max-w-[1440px] px-3 md:mt-12 md:px-7"
      >
        <SectionHeading
          eyebrow="Loved by our customers"
          title="Most Ordered"
          link="/category/all"
          linkText="View All"
        />

        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:gap-5">
            {featuredProducts.slice(0, 4).map((product, index) => (
              <ProductCard
                key={getId(product._id ?? product.id) || index}
                product={product}
                index={index}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-[#eaded6] bg-white px-4 py-8 text-center text-sm text-[#806a60]">
            No cakes found.
          </p>
        )}
      </section>

      {/* READY NOW */}
      <section className="mx-auto mt-8 max-w-[1440px] px-3 md:mt-12 md:px-7">
        <div className="rounded-2xl border border-[#e5c6a9] bg-gradient-to-r from-[#fff0df] via-[#fffaf6] to-[#f8e8df] p-3.5 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="mb-1 text-[9px] font-bold uppercase tracking-[1.5px] text-[#a05b36]">
                ⚡ Fresh & ready in ~20 minutes
              </p>
              <h2
                className="text-[20px] font-semibold leading-tight text-[#39221e] md:text-[27px]"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Ready Now
              </h2>
            </div>

            <Link
              to="/category/ready-now"
              className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-[#702735] md:text-xs"
            >
              See All <ChevronRight size={14} />
            </Link>
          </div>

          {readyNowProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
              {readyNowProducts.slice(0, 4).map((product, index) => (
                <ProductCard
                  key={getId(product._id ?? product.id) || index}
                  product={product}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-white/80 p-4 text-xs text-[#806a60]">
              No cakes are available to display right now.
            </p>
          )}
        </div>
      </section>

      {/* MINI DELIGHTS */}
      <section className="mx-auto mt-8 max-w-[1440px] px-3 md:mt-12 md:px-7">
        <SectionHeading
          eyebrow="Little treats, big smiles"
          title="Mini Delights"
          link="/category/all"
          linkText="Explore"
        />

        {miniDelightProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
            {miniDelightProducts.map((product, index) => (
              <ProductCard
                key={getId(product._id ?? product.id) || index}
                product={product}
                index={index}
              />
            ))}
          </div>
        ) : (
          <Link
            to="/category/all"
            className="flex items-center justify-between rounded-xl border border-[#eaded6] bg-white p-4 text-xs text-[#702735]"
          >
            Explore Mini Delights <ArrowRight size={15} />
          </Link>
        )}
      </section>

      {/* SURPRISE CAKES & HAMPERS */}
      <section className="mx-auto mt-8 max-w-[1440px] px-3 md:mt-12 md:px-7">
        <SectionHeading
          eyebrow="Make their day unexpected"
          title="Surprise Cakes & Hampers"
          link="/category/all"
          linkText="Explore"
        />

        {surpriseProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
            {surpriseProducts.map((product, index) => (
              <ProductCard
                key={getId(product._id ?? product.id) || index}
                product={product}
                index={index}
              />
            ))}
          </div>
        ) : (
          <Link
            to="/category/all"
            className="flex items-center justify-between rounded-xl border border-[#eaded6] bg-white p-4 text-xs text-[#702735]"
          >
            Explore Surprise Cakes & Hampers <ArrowRight size={15} />
          </Link>
        )}
      </section>

      {/* MAKE IT YOURS */}
      <section className="mx-auto mt-10 max-w-[1440px] px-3 md:mt-16 md:px-7">
        <div className="group relative isolate overflow-hidden rounded-2xl bg-[#4e1723] shadow-[0_18px_50px_rgba(78,23,35,0.16)] md:grid md:grid-cols-[0.92fr_1.08fr] md:rounded-[28px]">
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
                Your favourite flavours. Your special message. Your beautiful
                moment. Let us create a cake that feels uniquely yours.
              </p>

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

            <div className="absolute inset-0 bg-gradient-to-t from-[#2c0d17]/70 via-transparent to-[#2c0d17]/10 md:bg-gradient-to-r md:from-[#4e1723]/35 md:via-transparent md:to-transparent" />

            <div className="pointer-events-none absolute right-4 top-4 h-12 w-12 rounded-tr-2xl border-r border-t border-white/50 md:right-7 md:top-7 md:h-16 md:w-16" />
            <div className="pointer-events-none absolute bottom-4 left-4 h-12 w-12 rounded-bl-2xl border-b border-l border-white/35 md:bottom-7 md:left-7 md:h-16 md:w-16" />

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
            <div className="col-span-2 md:col-span-1">
              <Link
                to="/"
                className="inline-block text-[30px] leading-none"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Cakezee
              </Link>

              <p className="mt-3 max-w-[240px] text-[10px] leading-5 text-white/65 md:text-xs">
                Crafted with love, baked with care. Bringing a little sweetness
                to every special moment.
              </p>

              <div className="mt-4 flex items-center gap-2 text-[10px] text-[#efc9b7]">
                <Sparkles size={13} />
                Sweet moments start here.
              </div>
            </div>

            <div>
              <h3
                className="text-sm font-semibold"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Explore
              </h3>

              <div className="mt-4 space-y-3 text-[10px] text-white/65 md:text-xs">
                <Link className="block transition hover:text-white" to="/category/all">
                  All Cakes
                </Link>
                <Link className="block transition hover:text-white" to="/category/ready-now">
                  Ready Now
                </Link>
                <Link className="block transition hover:text-white" to="/category/birthday">
                  Birthday Cakes
                </Link>
                <Link className="block transition hover:text-white" to="/category/anniversary">
                  Anniversary Cakes
                </Link>
              </div>
            </div>

            <div>
              <h3
                className="text-sm font-semibold"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Customer Care
              </h3>

              <div className="mt-4 space-y-3 text-[10px] text-white/65 md:text-xs">
                <Link className="block transition hover:text-white" to="/orders">
                  My Orders
                </Link>
                <a
                  className="block transition hover:text-white"
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                    "Hi Cakezee! I need help with customer support."
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Help & Support
                </a>
                <Link className="block transition hover:text-white" to="/">
                  Delivery Information
                </Link>
                <Link className="block transition hover:text-white" to="/">
                  Terms & Conditions
                </Link>
              </div>
            </div>
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
      {/* WhatsApp support button and welcome message */}
      <WhatsAppSupport />

      {/* Welcome popup animation */}
      <style>{`
        @keyframes whatsappWelcomeIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </main>
  );
}

export default Home;
