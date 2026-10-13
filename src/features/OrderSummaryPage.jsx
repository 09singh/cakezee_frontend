import {
  ArrowLeft,
  ArrowRight,
  MapPin,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import CheckoutSteps from "../components/CheckoutSteps";

import {
  getCheckout,
  updateCheckout,
} from "../utils/checkoutStorage";

function OrderSummaryPage() {
  const navigate = useNavigate();

  const checkout = getCheckout();

  if (!checkout) {
    return (
      <section className="page-container py-16 text-center">
        <h1 className="text-xl font-semibold">
          No order found
        </h1>

        <button
          onClick={() => navigate("/category/all")}
          className="
            mt-5
            rounded-lg
            bg-[var(--brand)]
            px-5
            py-3
            text-sm
            font-semibold
            text-white
          "
        >
          Browse Cakes
        </button>
      </section>
    );
  }

  // -----------------------------
  // PRICE CALCULATION
  // -----------------------------

  const quantity = Number(checkout.quantity) || 1;
  const cakePrice = Number(
    checkout.cakePrice || 0
  ) * quantity;

  const addonsTotal =
    checkout.addons?.reduce(
      (total, addon) =>
        total + Number(addon.price || 0),
      0
    ) * quantity || 0;

  const deliveryFee =
    checkout.delivery?.method === "delivery"
      ? 60
      : 0;

  const subtotal =
    cakePrice +
    addonsTotal +
    deliveryFee;

  // -----------------------------
  // CONTINUE TO PAYMENT
  // -----------------------------

  const handleProceedToPayment = () => {
    // Save current pricing information.
    // Coupon will be applied on Payment Page.
    updateCheckout({
      pricing: {
        cakePrice,
        addonsTotal,
        deliveryFee,
        subtotal,
        discount: 0,
        total: subtotal,
      },
    });

    navigate("/checkout/payment");
  };

  return (
    <section className="page-container py-6 md:py-10">

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="
          inline-flex
          items-center
          gap-2
          text-sm
          text-[var(--text-muted)]
        "
      >
        <ArrowLeft size={16} />
        Delivery
      </button>

      {/* Checkout Tracker */}
      <CheckoutSteps currentStep={4} />

      <div className="mx-auto mt-6 max-w-xl">

        {/* Heading */}
        <p className="
          text-xs
          font-semibold
          uppercase
          tracking-[2px]
          text-[var(--brand)]
        ">
          Almost ready
        </p>

        <h1
          className="mt-2 text-3xl font-semibold"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Order Summary
        </h1>

        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Review your cake, customisation and delivery details
          before making payment.
        </p>

        {/* =========================
            CAKE
        ========================= */}

        <div className="
          mt-6
          rounded-xl
          border
          border-[var(--border)]
          bg-white
          p-4
        ">

          <div className="flex gap-4">

            <img
              src={checkout.productImage}
              alt={checkout.productName}
              className="
                h-20
                w-20
                rounded-lg
                object-cover
              "
            />

            <div className="flex-1">

              <h2 className="text-sm font-semibold">
                {checkout.productName}
              </h2>

              <p className="
                mt-1
                text-xs
                text-[var(--text-muted)]
              ">
                {checkout.size}
                {" · "}
                {checkout.flavour}
                {quantity > 1 ? ` · Qty ${quantity}` : ""}
              </p>

              <p className="
                mt-2
                text-sm
                font-semibold
                text-[var(--brand)]
              ">
                ₹{cakePrice}
              </p>

            </div>
          </div>
        </div>

        {/* =========================
            CUSTOMISATION
        ========================= */}

        <div className="
          mt-4
          rounded-xl
          border
          border-[var(--border)]
          bg-white
          p-4
        ">

          <h2 className="text-sm font-semibold">
            Customisation
          </h2>

          <div className="
            mt-3
            space-y-2
            text-xs
          ">

            {checkout.customisation?.nameOnCake && (
              <p>
                <span className="font-medium">
                  Name:
                </span>{" "}
                {checkout.customisation.nameOnCake}
              </p>
            )}

            {checkout.customisation?.messageOnCake && (
              <p>
                <span className="font-medium">
                  Message:
                </span>{" "}
                {checkout.customisation.messageOnCake}
              </p>
            )}

            {checkout.customisation?.colourChange && (
              <p>
                <span className="font-medium">
                  Colour:
                </span>{" "}
                {checkout.customisation.colourChange}
              </p>
            )}

            {checkout.customisation?.addPhoto && (
              <p>
                <span className="font-medium">
                  Design:
                </span>{" "}
                {checkout.customisation.addPhoto}
              </p>
            )}

            {checkout.customisation?.otherRequest && (
              <p>
                <span className="font-medium">
                  Request:
                </span>{" "}
                {checkout.customisation.otherRequest}
              </p>
            )}

            {checkout.customisation?.referenceImage && (
              <p className="
                font-medium
                text-[var(--brand)]
              ">
                ✓ Reference image attached
              </p>
            )}

            {!checkout.customisation?.nameOnCake &&
              !checkout.customisation?.messageOnCake &&
              !checkout.customisation?.colourChange &&
              !checkout.customisation?.addPhoto &&
              !checkout.customisation?.otherRequest &&
              !checkout.customisation?.referenceImage && (
                <p className="text-[var(--text-muted)]">
                  No customisation added
                </p>
              )}

          </div>
        </div>

        {/* =========================
            ADD-ONS
        ========================= */}

        <div className="
          mt-4
          rounded-xl
          border
          border-[var(--border)]
          bg-white
          p-4
        ">

          <div className="flex items-center justify-between">

            <h2 className="text-sm font-semibold">
              Add-ons
            </h2>

            <span className="
              text-sm
              font-semibold
              text-[var(--brand)]
            ">
              ₹{addonsTotal}
            </span>

          </div>

          {checkout.addons?.length ? (
            <div className="mt-3 space-y-3">

              {checkout.addons.map((addon) => (
                <div
                  key={addon.id}
                  className="
                    flex
                    justify-between
                    text-sm
                  "
                >
                  <span>
                    {addon.name}
                  </span>

                  <span className="font-medium">
                    ₹{Number(addon.price || 0)}
                  </span>
                </div>
              ))}

            </div>
          ) : (
            <p className="
              mt-2
              text-xs
              text-[var(--text-muted)]
            ">
              No add-ons selected
            </p>
          )}

        </div>

        {/* =========================
            DELIVERY
        ========================= */}

        <div className="
          mt-4
          rounded-xl
          border
          border-[var(--border)]
          bg-white
          p-4
        ">

          <h2 className="
            flex
            items-center
            gap-2
            text-sm
            font-semibold
          ">

            <MapPin
              size={16}
              className="text-[var(--brand)]"
            />

            {checkout.delivery?.method === "pickup"
              ? "Store Pickup"
              : "Delivery"}

          </h2>

          <div className="
            mt-3
            space-y-1
            text-xs
            text-[var(--text-muted)]
          ">

            <p>
              Date:{" "}
              {checkout.delivery?.date ||
                "Not selected"}
            </p>

            <p>
              Time:{" "}
              {checkout.delivery?.time ||
                "Not selected"}
            </p>

            {checkout.delivery?.method ===
              "delivery" && (
              <p>
                Address:{" "}
                {checkout.delivery?.address ||
                  "Not provided"}
              </p>
            )}

          </div>

        </div>

        {/* =========================
            PRICE DETAILS
        ========================= */}

        <div className="
          mt-5
          rounded-xl
          bg-[var(--cream-dark)]
          p-4
        ">

          <h2 className="text-sm font-semibold">
            Price Details
          </h2>

          <div className="mt-4 space-y-3">

            {/* Cake */}
            <div className="
              flex
              justify-between
              text-sm
            ">
              <span>
                Cake
              </span>

              <span>
                ₹{cakePrice}
              </span>
            </div>

            {/* Add-ons */}
            <div className="
              flex
              justify-between
              text-sm
            ">
              <span>
                Add-ons
              </span>

              <span>
                ₹{addonsTotal}
              </span>
            </div>

            {/* Delivery */}
            <div className="
              flex
              justify-between
              text-sm
            ">
              <span>
                Delivery
              </span>

              <span>
                {deliveryFee === 0
                  ? "Free"
                  : `₹${deliveryFee}`}
              </span>
            </div>

            {/* Divider */}
            <div className="
              border-t
              border-black/10
              pt-3
            " />

            {/* Total */}
            <div className="
              flex
              justify-between
              text-lg
              font-semibold
            ">

              <span>
                Total
              </span>

              <span className="text-[var(--brand)]">
                ₹{subtotal}
              </span>

            </div>

          </div>
        </div>

        {/* =========================
            PAYMENT BUTTON
        ========================= */}

        <button
          type="button"
          onClick={handleProceedToPayment}
          className="
            mt-5
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
            hover:bg-[var(--brand-dark)]
          "
        >
          Proceed to Payment · ₹{subtotal}

          <ArrowRight size={17} />
        </button>

      </div>
    </section>
  );
}

export default OrderSummaryPage;