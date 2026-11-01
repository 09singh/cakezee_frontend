import {
  CalendarDays,
  ClipboardList,
  MapPin,
} from "lucide-react";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import EmailOtpVerification from "../../../components/auth/EmailOtpVerification";
import OrderDetailsCard from "../../../components/orders/OrderDetailsCard";
import OrderProgress from "../../../components/orders/OrderProgress";
import { getEmailCustomerOrders } from "../../../api/auth.api";
import { requestOrderCancellation } from "../../../api/orders.api";
import { createCheckoutId, getEmailVerificationSession } from "../../../utils/checkoutStorage";

function OrdersPage() {
  const [email, setEmail] = useState(() => getEmailVerificationSession()?.email || "");
  const [checkoutId] = useState(
    () => getEmailVerificationSession()?.checkoutId || createCheckoutId()
  );
  const [emailVerification, setEmailVerification] = useState(() => {
    const saved = getEmailVerificationSession();
    return Number(saved?.expiresAt) > Date.now() ? saved : null;
  });
  const [orders, setOrders] = useState([]);
  const [ordersLoadedFor, setOrdersLoadedFor] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [cancellingId, setCancellingId] = useState("");
  const [editingOrder, setEditingOrder] = useState(null);
  const [expiredEmailToken, setExpiredEmailToken] = useState("");
  useEffect(() => {
    if (!emailVerification?.token) return undefined;
    const delay = Math.max(0, Number(emailVerification.expiresAt) - Date.now());
    const timer = window.setTimeout(
      () => setExpiredEmailToken(emailVerification.token),
      delay
    );
    return () => window.clearTimeout(timer);
  }, [emailVerification?.token, emailVerification?.expiresAt]);
  const isAuthenticated = Boolean(
    emailVerification?.email === email.trim().toLowerCase() &&
    emailVerification?.token &&
    expiredEmailToken !== emailVerification.token
  );

  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated) {
      return () => {
        cancelled = true;
      };
    }

    const refreshOrders = async () => {
      try {
        const response = await getEmailCustomerOrders(emailVerification);
        if (cancelled) return;
        const loadedOrders = response?.data || [];
        setOrders(Array.isArray(loadedOrders) ? loadedOrders : []);
        setOrdersLoadedFor(emailVerification.email);
        setLookupError("");
      } catch (error) {
        if (cancelled) return;
        setOrdersLoadedFor(emailVerification.email);
        setLookupError(
          error?.response?.data?.message ||
            "Orders linked to this email could not be loaded. Verify your email again."
        );
      }
    };

    refreshOrders();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") refreshOrders();
    }, 30000);
    const onFocus = () => refreshOrders();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAuthenticated, emailVerification]);

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
        reason.trim(),
        emailVerification,
        emailVerification.checkoutId
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

  const visibleOrders = isAuthenticated && ordersLoadedFor === emailVerification?.email ? orders : [];
  const pageLoading = isAuthenticated && ordersLoadedFor !== emailVerification?.email;

  if (!pageLoading && visibleOrders.length === 0) {
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
          {!isAuthenticated
            ? "Verify your email address to view orders linked to that email."
            : "Orders placed with this verified email address will appear here."}
        </p>
        {lookupError && (
          <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {lookupError}
          </p>
        )}

        <div className="mt-6 w-full max-w-sm text-left">
          <EmailOtpVerification
            email={email}
            checkoutId={checkoutId}
            verification={emailVerification}
            onEmailChange={(value) => {
              setEmail(value);
              setEmailVerification(null);
              setOrders([]);
              setOrdersLoadedFor("");
            }}
            onVerificationInvalidated={() => {
              setEmailVerification(null);
              setOrders([]);
              setOrdersLoadedFor("");
            }}
            onVerified={(value) => {
              setEmailVerification(value);
              setEmail(value.email);
            }}
          />
        </div>

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

        {lookupError && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {lookupError}
          </p>
        )}

        {/* Orders */}
        <div className="mt-7 space-y-5">
          {pageLoading ? (
            <div className="rounded-xl border border-[#E8D9D5] bg-white py-12 text-center">
              <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#E8D9D5] border-t-[#65152D]" />

              <p className="mt-3 text-sm text-[#78676A]">
                Loading your orders...
              </p>
            </div>
          ) : (
            visibleOrders.map((order) => {
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

                    <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      order.status === "Cancelled"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-[#E8D9D5] bg-white text-[#65152D]"
                    }`}>
                      {order.status === "Cancelled" ? "Order Cancelled" : "Order Progress"}
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
                        {(order.items?.length ? order.items : [{
                          name: order.productName,
                          itemType: "Cake",
                          weight: order.weight,
                          size: order.size,
                          flavour: order.flavour,
                          quantity: order.quantity,
                        }]).map((item, index) => (
                          <div key={`${item.name}-${index}`} className={index ? "mt-3 border-t border-[#F0E5DF] pt-3" : ""}>
                            <h2 className="text-sm font-semibold leading-6 text-[#35262A] sm:text-base">
                              {item.name}
                            </h2>
                            <p className="mt-1 text-xs leading-5 text-[#78676A]">
                              {item.itemType || "Cake"}
                              {" · "}
                              {item.itemType === "Cake"
                                ? item.weight ? `${item.weight} kg` : item.size
                                : "per piece"}
                              {" · "}
                              {item.flavour}
                              {item.quantity > 1 ? ` · Qty ${item.quantity}` : ""}
                            </p>
                            {item.customisation?.messageOnCake && (
                              <p className="mt-1 text-xs leading-5 text-[#78676A]">
                                Message: <span className="font-medium text-[#35262A]">{item.customisation.messageOnCake}</span>
                              </p>
                            )}
                            {item.customisation?.theme && (
                              <p className="mt-1 text-xs leading-5 text-[#78676A]">
                                Theme: <span className="font-medium text-[#35262A]">{item.customisation.theme}</span>
                              </p>
                            )}
                          </div>
                        ))}

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

                    {!["Delivered", "Cancelled", "Rejected", "Returned to Bakery"].includes(order.status) && (
                      <button
                        type="button"
                        onClick={() => setEditingOrder(order)}
                        className="mt-4 rounded-lg border border-[#65152D] bg-white px-4 py-2.5 text-xs font-semibold text-[#65152D] transition hover:bg-[#FFF5E9]"
                      >
                        Change order details
                      </button>
                    )}

                    {/* Cancellation */}
                    {[
                      "Pending Payment",
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
                            : "Cancel order"}
                        </button>
                      )}
                     {[
                      "Pending Payment",
                      "Confirmed",
                      "Preparing",
                      "Ready for Delivery",
                      "Out for Delivery",
                     ].includes(order.status) && (
                      <p className="mt-2 text-xs text-[#78676A]">
                        Cancellation is available until 2 hours before delivery.
                      </p>
                     )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
      {editingOrder && (
        <OrderDetailsCard
          key={editingOrder.orderId}
          order={editingOrder}
          mode="customer"
          startInEditMode
          onClose={() => setEditingOrder(null)}
          onSaved={(updated) => {
            setOrders((items) => items.map((item) => item.orderId === updated.orderId ? updated : item));
            setEditingOrder(updated);
          }}
        />
      )}
    </section>
  );
}

export default OrdersPage;