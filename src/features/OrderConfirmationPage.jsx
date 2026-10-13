
import {
  Check,
  ArrowRight,
  CalendarDays,
  MapPin,
  ShoppingBag,
} from "lucide-react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { getCheckout } from "../utils/checkoutStorage";
import OrderProgress from "../components/orders/OrderProgress";

function OrderConfirmationPage() {
  const navigate = useNavigate();

  const checkout = getCheckout();
  const [order] = useState(() => checkout?.confirmedOrder || null);

  if (!checkout || !order) {
    return (
      <section className="page-container py-16 text-center">
        <h1 className="text-xl font-semibold">
          Order not found
        </h1>

        <button
          onClick={() => navigate("/category/all")}
          className="mt-5 rounded-lg bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white"
        >
          Continue Shopping
        </button>
      </section>
    );
  }

  const cakePrice = Number(
    order.pricing?.cakePrice ||
      order.cakePrice ||
      0
  );

  const addonsTotal =
    order.pricing?.addonsTotal || 0;

  const deliveryFee =
    order.pricing?.deliveryFee || 0;

  const discount =
    order.pricing?.discount || 0;

  const total =
    order.pricing?.total ??
    cakePrice +
      addonsTotal +
      deliveryFee -
      discount;

  return (
    <section className="page-container py-6 md:py-10">
      <div className="mx-auto max-w-xl">

        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--brand)] shadow-lg">
            <Check
              size={42}
              strokeWidth={3}
              className="text-white"
            />
          </div>
        </div>

        {/* Heading */}
        <div className="mt-5 text-center">
          <h1
            className="text-3xl font-semibold"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Order Placed!
          </h1>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--text-muted)]">
            Thank you for choosing Cakezee.
            We’ve received your order. Payment is pending; the bakery will contact you to confirm payment before preparation.
          </p>
        </div>

        {/* Order Info */}
        <div className="mt-6 rounded-xl bg-[var(--cream-dark)] p-4">

          <p className="text-sm font-semibold">
            Order #{order.orderId}
          </p>
          <p className="mt-1 text-xs capitalize text-[var(--text-muted)]">
            Payment: {order.payment?.status || "pending"}
          </p>

          <div className="mt-3 flex items-start gap-3">
            <CalendarDays
              size={17}
              className="mt-0.5 text-[var(--brand)]"
            />

            <div>
              <p className="text-sm font-medium">
                {order.delivery?.date ||
                  "Selected date"}
              </p>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {order.delivery?.time ||
                  "Selected time"}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)] bg-white">
          <OrderProgress status={order.status} />
        </div>

        {/* Cake */}
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-white p-4">

          <div className="flex gap-3">

            <img
              src={order.productImage}
              alt={order.productName}
              className="h-20 w-20 rounded-lg object-cover"
            />

            <div className="min-w-0 flex-1">

              <h2 className="text-sm font-semibold">
                {order.productName}
              </h2>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {order.weight
                  ? `${order.weight} kg`
                  : order.size}
                {" · "}
                {order.flavour}
              </p>

              <p className="mt-2 text-sm font-semibold text-[var(--brand)]">
                ₹{cakePrice}
              </p>

            </div>
          </div>

          {/* Pricing */}
          <div className="mt-5 space-y-3 border-t border-[var(--border)] pt-4">

            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">
                Cake
              </span>

              <span>
                ₹{cakePrice}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">
                Add-ons
              </span>

              <span>
                ₹{addonsTotal}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">
                Delivery
              </span>

              <span>
                ₹{deliveryFee}
              </span>
            </div>

            {order.coupon && discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>
                  Coupon ({order.coupon.code})
                </span>

                <span>
                  -₹{discount}
                </span>
              </div>
            )}

            <div className="flex justify-between border-t border-[var(--border)] pt-3 text-base font-semibold">

              <span>
                Total
              </span>

              <span className="text-[var(--brand)]">
                ₹{total}
              </span>

            </div>

          </div>
        </div>

        {/* Delivery / Pickup */}
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-white p-4">

          <div className="flex items-start gap-3">

            <MapPin
              size={18}
              className="mt-0.5 text-[var(--brand)]"
            />

            <div>

              <p className="text-sm font-semibold">
                {order.delivery?.method === "pickup"
                  ? "Store Pickup"
                  : "Delivery"}
              </p>

              {order.delivery?.method ===
                "delivery" && (
                <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                  {order.delivery?.address}
                </p>
              )}

              {order.delivery?.method ===
                "pickup" && (
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Your cake will be ready at the
                  store for pickup.
                </p>
              )}

            </div>

          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 grid grid-cols-2 gap-3">

          <button
            onClick={() => navigate("/orders")}
            className="
              flex
              items-center
              justify-center
              gap-2
              rounded-lg
              border
              border-[var(--brand)]
              bg-white
              px-4
              py-3.5
              text-sm
              font-semibold
              text-[var(--brand)]
            "
          >
            <ShoppingBag size={16} />
            View Order
          </button>

          <button
            onClick={() =>
              navigate("/category/all")
            }
            className="
              flex
              items-center
              justify-center
              gap-2
              rounded-lg
              bg-[var(--brand)]
              px-4
              py-3.5
              text-sm
              font-semibold
              text-white
            "
          >
            Continue Shopping
            <ArrowRight size={16} />
          </button>

        </div>

      </div>
    </section>
  );
}

export default OrderConfirmationPage;
