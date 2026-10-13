import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Landmark,
  Lock,
  Banknote,
  Smartphone,
  Wallet,
} from "lucide-react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import CheckoutSteps from "../components/CheckoutSteps";
import {
  createCheckoutId,
  getCheckout,
  updateCheckout,
} from "../utils/checkoutStorage";

import api from "../api/axios";
import { createGuestOrder } from "../api/auth.api";
import { saveOrderLookup } from "../data/order";
import { removeCartItem } from "../data/cart";

function PaymentPage() {
  const navigate = useNavigate();
  const checkout = getCheckout();

  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [couponCode, setCouponCode] = useState(
    checkout?.coupon?.code || ""
  );

  const [appliedCoupon, setAppliedCoupon] = useState(
    checkout?.coupon || null
  );

  const [couponMessage, setCouponMessage] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  if (!checkout) {
    return (
      <section className="page-container py-16 text-center">
        <h1 className="text-xl font-semibold">
          Your checkout has expired
        </h1>

        <button
          type="button"
          onClick={() => navigate("/category/all")}
          className="mt-5 rounded-lg bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-dark)]"
        >
          Browse Cakes
        </button>
      </section>
    );
  }

  // PRICE CALCULATION

  const quantity = Number(checkout.quantity) || 1;

  const cakePrice = Number(checkout.cakePrice || 0) * quantity;

  const addonsTotal =
    checkout.addons?.reduce(
      (total, addon) => total + Number(addon.price || 0),
      0
    ) * quantity || 0;

  const deliveryFee =
    checkout.delivery?.method === "delivery" ? 60 : 0;

  const subtotal = cakePrice + addonsTotal + deliveryFee;

  // COUPON DISCOUNT

  const discount =
    appliedCoupon?.discountType === "percentage"
      ? Math.round(
          (subtotal * Number(appliedCoupon.discountValue || 0)) / 100
        )
      : 0;

  const total = Math.max(0, subtotal - discount);

  const formatPrice = (amount) =>
    `â‚¹${Number(amount || 0).toLocaleString("en-IN")}`;

  // APPLY COUPON

  const handleApplyCoupon = async () => {
    const enteredCode = couponCode.trim().toUpperCase();
    if (!enteredCode) { setCouponMessage("Please enter a coupon code."); setAppliedCoupon(null); return; }
    setIsApplyingCoupon(true);
    try {
      const response = await api.post("/coupons/validate", { code: enteredCode });
      const coupon = response.data?.data;
      if (!coupon?.code || coupon.discountType !== "percentage") throw new Error("Invalid or expired coupon.");
      setAppliedCoupon(coupon); setCouponCode(coupon.code);
      setCouponMessage(`${coupon.discountValue}% discount applied`);
    } catch (error) {
      setAppliedCoupon(null);
      setCouponMessage(error.response?.data?.message || error.message || "Invalid or expired coupon.");
    } finally { setIsApplyingCoupon(false); }
  };

  // REMOVE COUPON

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponMessage("");
  };

  // PLACE COD ORDER

  const handlePayment = async () => {
    if (isSubmitting) return;

    // Online payment is not enabled yet.
    if (paymentMethod !== "cod") {
      setPaymentError(
        "This payment method is coming soon. Please select Cash on Delivery."
      );
      return;
    }

    setIsSubmitting(true);
    setPaymentError("");

    try {
      const checkoutId =
        checkout.checkoutId || createCheckoutId();

      // Persist the idempotency key before sending the request so a reload or
      // network retry uses the same key instead of creating a second order.
      updateCheckout({ checkoutId });

      const response = await createGuestOrder({
        checkoutId,
        phone: checkout.delivery?.phone || "",
        productId: checkout.productId,
        size: checkout.size,
        flavour: checkout.flavour,
        quantity,

        addonIds: (checkout.addons || []).map(
          (addon) => addon.id || addon._id
        ),

        customisation: checkout.customisation || {},
        delivery: checkout.delivery,
        couponCode: appliedCoupon?.code || null,

        // Only COD orders can be submitted currently.
        paymentMethod: "cod",
      });

      const order = response?.success === true ? response.data : null;

      if (!order?.orderId) {
        throw new Error(
          "The order service returned an invalid confirmation."
        );
      }

      updateCheckout({
        checkoutId,
        orderId: order.orderId,
        confirmedOrder: order,
        pricing: order.pricing,
        paymentMethod: "cod",
        paymentStatus: "pending",
      });

      if (checkout.delivery?.phone) {
        saveOrderLookup(
          checkout.delivery.phone,
          order.orderId
        );
      }

      if (checkout.cartItemKey) {
        removeCartItem(checkout.cartItemKey);
      }

      navigate("/checkout/confirmation");
    } catch (error) {
      console.error("Order submission failed:", error);

      const responseMessage = error?.response?.data?.message;
      const validationErrors = error?.response?.data?.errors;
      setPaymentError(
        (Array.isArray(validationErrors) && validationErrors.length
          ? `${responseMessage || "Please check your order details."} ${validationErrors.join(" ")}`
          : responseMessage) ||
          error?.message ||
          "We could not place your order. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="page-container py-6 md:py-10">
      <div className="mx-auto max-w-xl">

        {/* CHECKOUT STEPS */}

        <CheckoutSteps currentStep={4} />

        {/* BACK BUTTON */}

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-5 inline-flex items-center gap-2 text-sm text-[var(--text-muted)] transition hover:text-[var(--brand)]"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* HEADER */}

        <div className="mt-5 rounded-xl border border-[var(--border)] p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2
              size={21}
              className="mt-0.5 shrink-0 text-[var(--brand)]"
            />

            <div>
              <h1 className="text-base font-semibold">
                Your order is almost ready!
              </h1>

              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Select your payment method and review your order before
                placing it.
              </p>
            </div>
          </div>
        </div>

        {/* TOTAL AMOUNT */}

        <div className="mt-5 rounded-xl border border-[var(--border)] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold">
              Total Amount
            </span>

            <span className="text-xl font-bold text-[var(--brand)]">
              {formatPrice(total)}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              document
                .getElementById("price-details")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="mt-2 text-xs text-[var(--brand)] hover:underline"
          >
            View Order Details â†“
          </button>
        </div>

        {/* PAYMENT METHODS */}

        <div className="mt-5 rounded-xl border border-[var(--border)] bg-white">
          <div className="border-b border-[var(--border)] p-4">
            <h2 className="text-sm font-semibold">
              Payment Method
            </h2>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Choose how you would like to pay.
            </p>
          </div>

          {/* CASH ON DELIVERY */}

          <button
            type="button"
            onClick={() => {
              setPaymentMethod("cod");
              setPaymentError("");
            }}
            className="flex w-full items-center gap-3 border-b border-[var(--border)] p-4 text-left"
          >
            <Banknote
              size={20}
              className="shrink-0 text-[var(--brand)]"
            />

            <div className="flex-1">
              <p className="text-sm font-medium">
                Cash on Delivery (COD)
              </p>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Pay when your order is delivered.
              </p>
            </div>

            <span
              className={`h-4 w-4 rounded-full border-2 ${
                paymentMethod === "cod"
                  ? "border-[var(--brand)] bg-[var(--brand)]"
                  : "border-gray-400"
              }`}
            />
          </button>

          {/* UPI - FUTURE INTEGRATION */}

          <div className="flex items-center gap-3 border-b border-[var(--border)] p-4 opacity-60">
            <Smartphone size={20} className="shrink-0" />

            <div className="flex-1">
              <p className="text-sm font-medium">UPI</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Google Pay, PhonePe, Paytm
              </p>
            </div>

            <span className="rounded-full border border-[var(--border)] px-2 py-1 text-[10px]">
              Coming soon
            </span>
          </div>

          {/* CARD - FUTURE INTEGRATION */}

          <div className="flex items-center gap-3 border-b border-[var(--border)] p-4 opacity-60">
            <CreditCard size={20} className="shrink-0" />

            <div className="flex-1">
              <p className="text-sm font-medium">Credit / Debit Card</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Visa, Mastercard and more
              </p>
            </div>

            <span className="rounded-full border border-[var(--border)] px-2 py-1 text-[10px]">
              Coming soon
            </span>
          </div>

          {/* NET BANKING - FUTURE INTEGRATION */}

          <div className="flex items-center gap-3 border-b border-[var(--border)] p-4 opacity-60">
            <Landmark size={20} className="shrink-0" />

            <div className="flex-1">
              <p className="text-sm font-medium">Net Banking</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Pay directly through your bank.
              </p>
            </div>

            <span className="rounded-full border border-[var(--border)] px-2 py-1 text-[10px]">
              Coming soon
            </span>
          </div>

          {/* WALLET - FUTURE INTEGRATION */}

          <div className="flex items-center gap-3 p-4 opacity-60">
            <Wallet size={20} className="shrink-0" />

            <div className="flex-1">
              <p className="text-sm font-medium">Wallet</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Supported digital wallets
              </p>
            </div>

            <span className="rounded-full border border-[var(--border)] px-2 py-1 text-[10px]">
              Coming soon
            </span>
          </div>
        </div>

        {/* COUPON */}

        <div className="mt-5 rounded-xl border border-[var(--border)] bg-white p-4">
          <p className="text-sm font-semibold">
            Have a coupon?
          </p>

          <div className="mt-3 flex gap-2">
            <input
              value={couponCode}
              onChange={(event) => {
                setCouponCode(event.target.value.toUpperCase());
                setCouponMessage("");
              }}
              disabled={Boolean(appliedCoupon)}
              placeholder="Enter coupon code"
              className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-transparent px-3 py-3 text-sm uppercase outline-none focus:border-[var(--brand)] disabled:opacity-60"
            />

            {appliedCoupon ? (
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="rounded-lg border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--brand)]"
              >
                Remove
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={isApplyingCoupon}
                className="rounded-lg bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-dark)]"
              >
                {isApplyingCoupon ? "Checking…" : "Apply"}
              </button>
            )}
          </div>

          {couponMessage && (
            <p
              className={`mt-2 text-xs ${
                appliedCoupon
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {couponMessage}
            </p>
          )}
        </div>

        {/* ORDER SUMMARY - ABOVE PLACE ORDER BUTTON */}

        <div
          id="price-details"
          className="mt-5 rounded-xl border border-[var(--border)] bg-white p-4"
        >
          <h2 className="text-sm font-semibold">
            Order Summary
          </h2>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-[var(--text-muted)]">
                Cake Ã— {quantity}
              </span>

              <span>{formatPrice(cakePrice)}</span>
            </div>

            {addonsTotal > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-[var(--text-muted)]">
                  Add-ons
                </span>

                <span>{formatPrice(addonsTotal)}</span>
              </div>
            )}

            <div className="flex justify-between gap-4">
              <span className="text-[var(--text-muted)]">
                Delivery
              </span>

              <span>
                {deliveryFee === 0
                  ? "Free"
                  : formatPrice(deliveryFee)}
              </span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between gap-4 text-green-600">
                <span>
                  Coupon ({appliedCoupon.code})
                </span>

                <span>-{formatPrice(discount)}</span>
              </div>
            )}

            <div className="border-t border-[var(--border)] pt-3">
              <div className="flex justify-between gap-4 font-semibold">
                <span>Total Payable</span>

                <span className="text-[var(--brand)]">
                  {formatPrice(total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PAYMENT ERROR */}

        {paymentError && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700"
          >
            {paymentError}
          </p>
        )}

        {/* PLACE ORDER - AT THE BOTTOM */}

        <button
          type="button"
          onClick={handlePayment}
          disabled={isSubmitting}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Lock size={16} />

          {isSubmitting
            ? "Placing order..."
            : `Place COD Order Â· ${formatPrice(total)}`}
        </button>

        <p className="mt-3 text-center text-xs text-[var(--text-muted)]">
          Pay in cash when your order is delivered. Online payment
          options will be available in a future update.
        </p>
      </div>
    </section>
  );
}

export default PaymentPage;

