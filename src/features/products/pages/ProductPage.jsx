
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  ShoppingBag,
} from "lucide-react";

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { createCheckoutId, updateCheckout } from "../../../utils/checkoutStorage";
import { getProductById as getStaticProductById } from "../../../data/product/products";
import { getProductById, getProductBySlug } from "../../../api/auth.api";
import { addToCart } from "../../../data/cart";

function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(() => getStaticProductById(id));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [size, setSize] = useState(
    getStaticProductById(id)?.sizes?.[0]?.label || ""
  );

  const [flavour, setFlavour] = useState(
    getStaticProductById(id)?.flavours?.[0]?.name || ""
  );

  useEffect(() => {
    let cancelled = false;
    const loadProduct = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const response = /^[a-f\d]{24}$/i.test(id)
          ? await getProductById(id)
          : await getProductBySlug(id);
        const item =
          response?.data?.data ??
          response?.data?.product ??
          response?.data ??
          response;
        const productId = item?._id ?? item?.id;
        if (!productId) throw new Error("Product response was invalid.");

        const productSizes = (item.sizes || []).map((itemSize) => {
          const unit = itemSize.unit || "kg";
          const weight = unit.toLowerCase() === "g"
            ? Number(itemSize.value) / 1000
            : Number(itemSize.value);
          return {
            label: itemSize.name || `${itemSize.value} ${unit}`,
            weight,
          };
        });
        const productFlavours = (item.flavours || []).map((itemFlavour) => ({
          name: itemFlavour.name,
          basePrice: Number(itemFlavour.basePrice),
        }));
        if (!productSizes.length || !productFlavours.length) {
          throw new Error("Product is missing sizes or flavours.");
        }

        const normalized = {
          id: productId,
          name: item.name,
          image: item.images?.[0]?.url || "/images/placeholder.webp",
          category: item.categoryId?.slug || item.categoryId?.name || "",
          description: item.description || "",
          baseWeight: Number(item.pricing?.baseWeight) || 0.5,
          inventoryQuantity: Number(item.inventoryQuantity) || 0,
          productType: item.productType || "regular",
          readyNowCategory: item.readyNowCategory || "",
          categoryId: item.categoryId?._id || item.categoryId,
          sizes: productSizes,
          flavours: productFlavours,
        };
        if (!cancelled) {
          setProduct(normalized);
          setSize(productSizes[0].label);
          setFlavour(productFlavours[0].name);
        }
      } catch (error) {
        if (!cancelled && !getStaticProductById(id)) {
          setProduct(null);
          setLoadError(error?.response?.data?.message || error.message || "Could not load this product.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadProduct();
    return () => { cancelled = true; };
  }, [id]);

  // Product not found
  if (!product) {
    return (
      <section className="page-container py-16 text-center">
        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {loading ? "Loading cake..." : "Cake not found"}
        </h1>
        {!loading && loadError && <p role="alert" className="mt-2 text-sm text-red-600">{loadError}</p>}

        <Link
          to="/category/all"
          className="mt-4 inline-block text-sm font-semibold text-[var(--brand)]"
        >
          Browse cakes
        </Link>
      </section>
    );
  }

  // Selected size
  const selectedSize =
    product.sizes.find((item) => item.label === size) ||
    product.sizes[0];

  // Selected flavour
  const selectedFlavour =
    product.flavours.find((item) => item.name === flavour) ||
    product.flavours[0];

  // Calculate cake price
  const price =
    selectedFlavour.basePrice *
    (selectedSize.weight / (product.baseWeight || 0.5));
  // Regular cakes are prepared to order, so inventory should not block
  // customisation or adding them to the cart. Ready Now items use stock.
  const isOutOfStock = product.productType === "ready_now"
    && Number.isFinite(product.inventoryQuantity)
    && product.inventoryQuantity < 1;

  /*
   * ADD TO CART
   */
  function handleAddToCart() {
    const cartItem = {
      key: `${product.id}-${selectedSize.label}-${selectedFlavour.name}-${createCheckoutId()}`,

      productId: product.id,

      name: product.name,

      image: product.image,

      category: product.category,

      size: selectedSize.label,

      weight: selectedSize.weight,

      flavour: selectedFlavour.name,

      basePrice: price,
      quantity: 1,

      decorationCharge: 0,

      message: "",

      addons: [],

      customisation: {
        nameOnCake: "",
        messageOnCake: "",
        colourChange: "",
        addPhoto: "",
        otherRequest: "",
        voiceNote: "",
        referenceImage: "",
      },

      delivery: {
        method: "",
        date: "",
        time: "",
        address: "",
      },
    };

    addToCart(cartItem);

    navigate("/cart");
  }

  /*
   * PERSONALISE CAKE
   */
  function handlePersonalise() {
    updateCheckout({
      checkoutId: createCheckoutId(),
      cartItemKey: null,
      productId: product.id,

      productName: product.name,

      productImage: product.image,

      category: product.category,
      categoryId: product.categoryId || "",

      size: selectedSize.label,

      weight: selectedSize.weight,

      flavour: selectedFlavour.name,

      cakePrice: price,
      quantity: 1,

      customisation: {
        nameOnCake: "",
        messageOnCake: "",
        colourChange: "",
        addPhoto: "",
        otherRequest: "",
        voiceNote: "",
        referenceImage: "",
      },

      addons: [],

      delivery: {
        method: "",
        date: "",
        time: "",
        address: "",
      },
    });

    navigate(
      `/product/${product.id}/personalise`
    );
  }

  function handleReadyNowOrder() {
    updateCheckout({
      checkoutId: createCheckoutId(),
      cartItemKey: null,
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      category: product.readyNowCategory || product.category,
      categoryId: product.categoryId || "",
      productType: "ready_now",
      size: selectedSize.label,
      weight: selectedSize.weight,
      flavour: selectedFlavour.name,
      cakePrice: price,
      quantity: 1,
      customisation: {},
      addons: [],
      delivery: { method: "", date: "", time: "", address: "", phone: "" },
    });
    navigate("/checkout/delivery");
  }

  return (
    <section className="page-container py-6 md:py-10">

      {/* Back */}
      <Link
        to={product.category ? `/category/${product.category}` : "/category/all"}
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)]"
      >
        <ArrowLeft size={16} />
        All cakes
      </Link>

      <div className="mt-5 grid gap-8 md:grid-cols-2 md:gap-12">

        {/* Product Image */}
        <div className="overflow-hidden rounded-xl bg-[var(--cream-dark)]">
          <img
            src={product.image}
            alt={product.name}
            className="aspect-square w-full object-cover"
          />
        </div>

        {/* Product Information */}
        <div className="py-1 md:py-5">

          {/* Small heading */}
          <p className="text-xs font-semibold uppercase tracking-[2px] text-[var(--brand)]">
            Freshly made for you
          </p>

          {/* Product name */}
          <h1
            className="mt-3 text-3xl font-semibold"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {product.name}
          </h1>

          {/* Description */}
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            {product.description || "A handcrafted celebration cake finished fresh by our cake studio."}
          </p>

          {/* Price */}
          <p className="mt-5 text-2xl font-semibold text-[var(--brand)]">
            ₹{price}
          </p>

          {/* SIZE */}
          <div className="mt-7">
            <h2 className="text-sm font-semibold">
              Choose a size
            </h2>

            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() =>
                    setSize(item.label)
                  }
                  aria-pressed={
                    size === item.label
                  }
                  className={`
                    rounded-lg
                    border
                    px-4
                    py-2
                    text-sm
                    transition
                    ${
                      size === item.label
                        ? "border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand)]"
                        : "border-[var(--border)] bg-white hover:border-[var(--brand)]"
                    }
                  `}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* FLAVOUR */}
          <div className="mt-6">
            <label
              htmlFor="flavour"
              className="text-sm font-semibold"
            >
              Flavour
            </label>

            <select
              id="flavour"
              value={flavour}
              onChange={(event) =>
                setFlavour(event.target.value)
              }
              className="mt-3 block w-full rounded-lg border border-[var(--border)] bg-white px-3 py-3 text-sm"
            >
              {product.flavours.map((item) => (
                <option
                  key={item.name}
                  value={item.name}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* DELIVERY */}
          <div className="mt-6 flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Clock3 size={15} />

            {isOutOfStock
              ? "Currently unavailable. Please contact us to check availability."
              : "Made fresh for your selected delivery time"}
          </div>

          {/* ACTIONS */}
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {product.productType === "ready_now" ? (
              <button type="button" onClick={handleReadyNowOrder} disabled={isOutOfStock} className="col-span-full flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-50">
                Order Now <ArrowRight size={17} />
              </button>
            ) : <>

            {/* ADD TO CART */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-lg
                border
                border-[var(--brand)]
                bg-white
                px-5
                py-3.5
                text-sm
                font-semibold
                text-[var(--brand)]
                transition
                hover:bg-[var(--brand-light)]
                disabled:cursor-not-allowed disabled:opacity-50
              "
            >
              <ShoppingBag size={17} />

              Add to cart
            </button>

            {/* PERSONALISE */}
            <button
              type="button"
              onClick={handlePersonalise}
              disabled={isOutOfStock}
              className="
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-[var(--brand)]
                px-5
                py-3.5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-[var(--brand-dark)]
                disabled:cursor-not-allowed disabled:opacity-50
              "
            >
              Personalise

              <ArrowRight size={17} />
            </button>

            </>}

          </div>

          {product.productType !== "ready_now" && <p className="mt-3 text-center text-xs text-[var(--text-muted)]">
            Personalisation lets you add cake messages,
            decorations, photos and other custom requests.
          </p>}

        </div>
      </div>
    </section>
  );
}

export default ProductPage;
