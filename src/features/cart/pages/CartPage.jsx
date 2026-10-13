
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getCart, saveCart } from "../../../data/cart";
import { createCheckoutId, updateCheckout } from "../../../utils/checkoutStorage";

function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(getCart);

  const subtotal = cart.reduce(
    (total, item) =>
      total +
      (item.basePrice + item.decorationCharge) * item.quantity,
    0
  );

  function updateQuantity(key, change) {
    setCart((current) =>
      saveCart(
        current
          .map((item) =>
            item.key === key
              ? { ...item, quantity: item.quantity + change }
              : item
          )
          .filter((item) => item.quantity > 0)
      )
    );
  }

  function removeItem(key) {
    setCart((current) =>
      saveCart(current.filter((item) => item.key !== key))
    );
  }

  function continueToCheckout(item) {
    const checkoutId = createCheckoutId();
    updateCheckout({
      checkoutId,
      cartItemKey: item.key,
      productId: item.productId,
      productName: item.name,
      productImage: item.image,
      category: item.category || "",
      size: item.size,
      weight: item.weight,
      flavour: item.flavour,
      cakePrice: Number(item.basePrice || 0),
      quantity: Number(item.quantity) || 1,
      customisation: item.customisation || {},
      addons: item.addons || [],
      delivery: {},
    });
    navigate(`/product/${item.productId}/personalise`);
  }

  if (cart.length === 0) {
    return (
      <section className="page-container flex min-h-[60vh] flex-col items-center justify-center py-12 text-center">
        <ShoppingBag
          size={36}
          strokeWidth={1.4}
          className="text-[var(--brand)]"
        />

        <h1
          className="mt-5 text-2xl font-semibold"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Your cart is waiting
        </h1>

        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Find something lovely for the next celebration.
        </p>

        <Link
          to="/category/all"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white"
        >
          Explore cakes
          <ArrowRight size={16} />
        </Link>
      </section>
    );
  }

  return (
    <section className="page-container max-w-4xl py-8 md:py-12">
      <p className="text-xs font-semibold uppercase tracking-[2px] text-[var(--brand)]">
        Your celebration, taking shape
      </p>

      <h1
        className="mt-2 text-3xl font-semibold"
        style={{ fontFamily: "Georgia, serif" }}
      >
        Your cart
      </h1>

      <div className="mt-7 divide-y divide-[var(--border)] border-y border-[var(--border)]">
        {cart.map((item) => (
          <article key={item.key} className="flex gap-4 py-5">
            <img
              src={item.image}
              alt=""
              className="h-24 w-24 shrink-0 rounded-lg bg-[var(--cream-dark)] object-cover"
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">
                    {item.name}
                  </h2>

                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {item.size} · {item.flavour}
                  </p>

                  {item.message && (
                    <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                      “{item.message}”
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.key)}
                  aria-label={`Remove ${item.name}`}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--brand)]"
                >
                  <Trash2 size={17} />
                </button>
              </div>

              {item.decorationCharge > 0 && (
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Decoration +₹{item.decorationCharge}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-2 py-1">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => updateQuantity(item.key, -1)}
                    className="h-6 w-6 text-lg"
                  >
                    −
                  </button>

                  <span className="min-w-4 text-center text-sm">
                    {item.quantity}
                  </span>

                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => updateQuantity(item.key, 1)}
                    className="h-6 w-6 text-lg"
                  >
                    +
                  </button>
                </div>

                <span className="text-sm font-semibold">
                  ₹
                  {(item.basePrice + item.decorationCharge) *
                    item.quantity}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="ml-auto mt-7 max-w-sm">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">
            Subtotal
          </span>

          <span className="font-semibold">
            ₹{subtotal}
          </span>
        </div>

        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Delivery and any applicable offers are calculated at
          checkout.
        </p>

        {/* Redirect to ProductPage */}
        <button
          type="button"
          onClick={() => continueToCheckout(cart[0])}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
        >
          Continue to checkout
          <ArrowRight size={16} />
        </button>

        <p className="mt-3 text-center text-xs leading-5 text-[var(--text-muted)]">
          You can review your cake selection before continuing.
        </p>
      </div>
    </section>
  );
}

export default CartPage;
