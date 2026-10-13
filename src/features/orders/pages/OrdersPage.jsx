import {
  CalendarDays,
  ClipboardList,
  MapPin,
} from "lucide-react";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getOrderLookups, saveOrderLookup } from "../../../data/order";
import { getGuestOrder } from "../../../api/auth.api";
import { requestOrderCancellation } from "../../../api/orders.api";
import OrderProgress from "../../../components/orders/OrderProgress";

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [orderId, setOrderId] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [cancellingId, setCancellingId] = useState("");

  useEffect(() => {
    let cancelled = false;

    const lookups = getOrderLookups();

    Promise.allSettled(
      lookups.map(({ phone: savedPhone, orderId: savedOrderId }) =>
        getGuestOrder(savedPhone, savedOrderId)
      )
    )
      .then((results) => {
        if (cancelled) return;

        const loadedOrders = results
          .filter((result) => result.status === "fulfilled")
          .map((result) => result.value?.data)
          .filter(Boolean);

        setOrders(loadedOrders);

        const failedLookup = results.some(
          (result) => result.status === "rejected"
        );

        if (failedLookup) {
          setLookupError(
            "Some saved orders could not be loaded. Check their phone and order reference."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLookup = async (event) => {
    event.preventDefault();

    if (lookingUp) return;

    setLookingUp(true);
    setLookupError("");

    try {
      const response = await getGuestOrder(
        phone.trim(),
        orderId.trim()
      );

      const foundOrder = response?.data;

      if (!foundOrder?.orderId) {
        throw new Error(
          "The order service returned an invalid response."
        );
      }

      saveOrderLookup(phone.trim(), foundOrder.orderId);

      setOrders((current) => [
        foundOrder,
        ...current.filter(
          (item) => item.orderId !== foundOrder.orderId
        ),
      ]);

      setOrderId("");
    } catch (error) {
      setLookupError(
        error?.response?.data?.message ||
          error.message ||
          "Could not find that order."
      );
    } finally {
      setLookingUp(false);
    }
  };

  const handleCancellation = async (order) => {
    if (cancellingId) return;

    const reason = window.prompt(
      "Why do you need to cancel this order?"
    );

    if (!reason?.trim()) return;

    setCancellingId(order.orderId);
    setLookupError("");

    try {
      const updated = await requestOrderCancellation(
        order.orderId,
        order.phone,
        reason.trim()
      );

      setOrders((items) =>
        items.map((item) =>
          item.orderId === order.orderId ? updated : item
        )
      );
    } catch (error) {
      setLookupError(
        error?.response?.data?.message ||
          "Cancellation request failed. The order was not changed."
      );
    } finally {
      setCancellingId("");
    }
  };

  const inputClass =
    "w-full min-w-0 rounded-lg border border-[#E8D9D5] bg-white px-3 py-3 text-sm text-[#35262A] outline-none transition placeholder:text-[#9B898B] focus:border-[#65152D] focus:ring-2 focus:ring-[#65152D]/10";

  const primaryButtonClass =
    "rounded-lg bg-[#65152D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#501023] disabled:cursor-not-allowed disabled:opacity-60";

  if (!loading && orders.length === 0) {
    return (
      <section className="page-container flex min-h-[60vh] flex-col items-center justify-center bg-[#FFF5E9] py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-[#E8D9D5]">
          <ClipboardList
            size={34}
            strokeWidth={1.5}
            className="text-[#65152D]"
          />
        </div>

        <h1
          className="mt-5 text-2xl font-semibold text-[#65152D]"
          style={{ fontFamily: "Georgia, serif" }}
        >
          No saved orders
        </h1>

        <p className="mt-2 max-w-sm text-sm leading-6 text-[#78676A]">
          Look up an order with its contact phone number and order
          reference.
        </p>

        <form
          onSubmit={handleLookup}
          className="mt-6 w-full max-w-sm space-y-3 text-left"
        >
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
            autoComplete="tel"
            placeholder="Contact phone number"
            className={inputClass}
          />

          <input
            value={orderId}
            onChange={(event) =>
              setOrderId(event.target.value.toUpperCase())
            }
            required
            placeholder="Order reference (e.g. CZ...)"
            className={inputClass}
          />

          {lookupError && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {lookupError}
            </p>
          )}

          <button
            type="submit"
            disabled={lookingUp}
            className={`w-full ${primaryButtonClass}`}
          >
            {lookingUp ? "Looking up..." : "Find order"}
          </button>
        </form>

        <Link
          to="/category/all"
          className="mt-5 text-sm font-semibold text-[#65152D] transition hover:text-[#501023] hover:underline"
        >
          Browse Cakes
        </Link>
      </section>
    );
  }

  return (
    <section className="page-container min-h-screen bg-[#FFF5E9] py-8 md:py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[2px] text-[#8A334B]">
            Your Cakezee history
          </p>

          <h1
            className="mt-2 text-3xl font-semibold text-[#65152D] md:text-4xl"
            style={{ fontFamily: "Georgia, serif" }}
          >
            My Orders
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#78676A]">
            Your confirmed orders are retrieved from the Cakezee
            database.
          </p>
        </div>

        {/* Order Lookup */}
        <form
          onSubmit={handleLookup}
          className="mt-6 grid gap-3 rounded-xl border border-[#E8D9D5] bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto]"
        >
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
            autoComplete="tel"
            placeholder="Contact phone number"
            className={inputClass}
          />

          <input
            value={orderId}
            onChange={(event) =>
              setOrderId(event.target.value.toUpperCase())
            }
            required
            placeholder="Order reference"
            className={inputClass}
          />

          <button
            type="submit"
            disabled={lookingUp}
            className={primaryButtonClass}
          >
            {lookingUp ? "Searching..." : "Find order"}
          </button>

          {lookupError && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-3"
            >
              {lookupError}
            </p>
          )}
        </form>

        {/* Orders */}
        <div className="mt-7 space-y-5">
          {loading ? (
            <div className="rounded-xl border border-[#E8D9D5] bg-white py-12 text-center">
              <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#E8D9D5] border-t-[#65152D]" />

              <p className="mt-3 text-sm text-[#78676A]">
                Loading your orders...
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const cakePrice = Number(
                order.pricing?.cakePrice ||
                  order.cakePrice ||
                  0
              );

              const addonsTotal = Number(
                order.pricing?.addonsTotal || 0
              );

              const deliveryFee = Number(
                order.pricing?.deliveryFee || 0
              );

              const discount = Number(
                order.pricing?.discount || 0
              );

              const total =
                order.pricing?.total ??
                cakePrice +
                  addonsTotal +
                  deliveryFee -
                  discount;

              return (
                <article
                  key={order.orderId}
                  className="overflow-hidden rounded-xl border border-[#E8D9D5] bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
                >
                  {/* Order Header */}
                  <div className="flex flex-col justify-between gap-3 border-b border-[#E8D9D5] bg-[#F8EBDD] p-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-xs font-medium text-[#78676A]">
                        Order ID
                      </p>

                      <p className="mt-1 break-all text-sm font-semibold text-[#65152D]">
                        #{order.orderId}
                      </p>
                    </div>

                    <span className="inline-flex w-fit items-center rounded-full border border-[#E8D9D5] bg-white px-3 py-1.5 text-xs font-semibold text-[#65152D]">
                      Order Progress
                    </span>
                  </div>

                  <div className="border-b border-[#E8D9D5] px-4 py-3">
                    <OrderProgress status={order.status} />
                  </div>

                  {order.cancellation?.decision && (
                    <p className="px-4 pt-3 text-xs leading-5 text-amber-800">
                      Cancellation {order.cancellation.decision}:{" "}
                      {order.cancellation.reason}
                    </p>
                  )}

                  {order.payment?.status === "pending" && (
                    <p className="px-4 pt-3 text-xs leading-5 text-amber-700">
                      Payment has not been processed online. The
                      bakery will contact you to confirm it.
                    </p>
                  )}

                  {/* Product */}
                  <div className="p-4 sm:p-5">
                    <div className="flex gap-4">
                      <img
                        src={order.productImage}
                        alt={order.productName}
                        loading="lazy"
                        className="h-24 w-24 shrink-0 rounded-xl border border-[#F0E5DF] bg-[#FFF5E9] object-cover sm:h-28 sm:w-28"
                      />

                      <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-semibold leading-6 text-[#35262A] sm:text-base">
                          {order.productName}
                        </h2>

                        <p className="mt-1 text-xs leading-5 text-[#78676A]">
                          {order.weight
                            ? `${order.weight} kg`
                            : order.size}
                          {" · "}
                          {order.flavour}
                          {order.quantity > 1
                            ? ` · Qty ${order.quantity}`
                            : ""}
                        </p>

                        {order.customisation?.nameOnCake && (
                          <p className="mt-2 text-xs leading-5 text-[#78676A]">
                            Name on cake:{" "}
                            <span className="font-medium text-[#35262A]">
                              {order.customisation.nameOnCake}
                            </span>
                          </p>
                        )}

                        {order.customisation?.messageOnCake && (
                          <p className="mt-1 text-xs leading-5 text-[#78676A]">
                            Message:{" "}
                            <span className="font-medium text-[#35262A]">
                              {order.customisation.messageOnCake}
                            </span>
                          </p>
                        )}

                        <p className="mt-2 text-base font-bold text-[#65152D]">
                          ₹{cakePrice}
                        </p>
                      </div>
                    </div>

                    {/* Delivery Information */}
                    <div className="mt-5 grid gap-4 border-t border-[#E8D9D5] pt-4 sm:grid-cols-2">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFF5E9]">
                          <CalendarDays
                            size={17}
                            className="text-[#65152D]"
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs text-[#78676A]">
                            Delivery / Pickup
                          </p>

                          <p className="mt-1 text-sm font-medium text-[#35262A]">
                            {order.delivery?.date ||
                              "Date not selected"}
                          </p>

                          <p className="mt-1 text-xs text-[#78676A]">
                            {order.delivery?.time ||
                              "Time not selected"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFF5E9]">
                          <MapPin
                            size={17}
                            className="text-[#65152D]"
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs text-[#78676A]">
                            {order.delivery?.method === "pickup"
                              ? "Store Pickup"
                              : "Delivery"}
                          </p>

                          {order.delivery?.method === "delivery" ? (
                            <p className="mt-1 break-words text-sm leading-5 text-[#35262A]">
                              {order.delivery?.address ||
                                "Address not available"}
                            </p>
                          ) : (
                            <p className="mt-1 text-xs leading-5 text-[#78676A]">
                              Cake will be ready at the store for
                              pickup.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="mt-5 rounded-xl border border-[#E8D9D5] bg-[#FFFCF8] p-4">
                      <h3 className="mb-4 text-sm font-semibold text-[#65152D]">
                        Price Summary
                      </h3>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between gap-4">
                          <span className="text-[#78676A]">
                            Cake
                          </span>

                          <span className="font-medium text-[#35262A]">
                            ₹{cakePrice}
                          </span>
                        </div>

                        <div className="flex justify-between gap-4">
                          <span className="text-[#78676A]">
                            Add-ons
                          </span>

                          <span className="font-medium text-[#35262A]">
                            ₹{addonsTotal}
                          </span>
                        </div>

                        <div className="flex justify-between gap-4">
                          <span className="text-[#78676A]">
                            Delivery
                          </span>

                          <span className="font-medium text-[#35262A]">
                            ₹{deliveryFee}
                          </span>
                        </div>

                        {discount > 0 && (
                          <div className="flex justify-between gap-4 text-green-600">
                            <span>
                              Discount
                              {order.coupon?.code
                                ? ` (${order.coupon.code})`
                                : ""}
                            </span>

                            <span>-₹{discount}</span>
                          </div>
                        )}

                        <div className="flex justify-between gap-4 border-t border-[#E8D9D5] pt-3 text-base font-bold">
                          <span className="text-[#35262A]">
                            Total
                          </span>

                          <span className="text-[#65152D]">
                            ₹{total}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Created Date */}
                    {order.createdAt && (
                      <p className="mt-4 text-xs text-[#78676A]">
                        Ordered on{" "}
                        {new Date(order.createdAt).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </p>
                    )}

                    {/* Cancellation */}
                    {[
                      "Confirmed",
                      "Preparing",
                      "Ready for Delivery",
                      "Out for Delivery",
                    ].includes(order.status) &&
                      !["pending", "approved"].includes(
                        order.cancellation?.decision
                      ) && (
                        <button
                          type="button"
                          disabled={Boolean(cancellingId)}
                          onClick={() => handleCancellation(order)}
                          className="mt-4 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {cancellingId === order.orderId
                            ? "Submitting..."
                            : "Request cancellation"}
                        </button>
                      )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

export default OrdersPage;