
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Truck,
  PackageCheck,
  Clock3,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  Search,
  Navigation,
  X,
} from "lucide-react";

import {
  changeOrderStatus,
  getStaffOrders,
  mapApiOrder,
  recordDeliveryAttempt,
} from "../../../api/orders.api";

const filters = [
  "All",
  "Ready",
  "Out for Delivery",
  "Delivered",
  "Not Delivered",
];

/* ================= PRICE HELPERS ================= */

function parsePrice(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "object") return null;

  const parsed =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/[₹,\s]/g, ""));

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function getOrderAmount(order) {
  const candidates = [
    order?.totalAmount,
    order?.amount,
    order?.pricing?.totalAmount,
    order?.pricing?.grandTotal,
    order?.pricing?.total,
    order?.pricing?.finalAmount,
    order?.finalAmount,
    order?.grandTotal,
    order?.total,
    order?.paymentAmount,
    order?.pricing?.subtotal,
    order?.subtotal,
  ];

  for (const value of candidates) {
    const amount = parsePrice(value);

    if (amount !== null && amount > 0) {
      return amount;
    }
  }

  return 0;
}

function formatPrice(value) {
  return `₹${Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

/* ================= CAKE IMAGE PREVIEW ================= */

function CakeImagePreview({ image, name, onClose }) {
  useEffect(() => {
    if (!image) return;

    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [image, onClose]);

  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cake image preview"
        className="relative w-full max-w-3xl rounded-2xl bg-white p-3 shadow-2xl sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close image preview"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-800 shadow-md transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#9c173d]"
        >
          <X size={22} />
        </button>

        <img
          src={image}
          alt={name || "Cake preview"}
          className="max-h-[75vh] w-full rounded-xl bg-gray-50 object-contain"
        />

        <p className="mt-3 text-center text-sm font-semibold text-gray-800">
          {name || "Cake Preview"}
        </p>
      </div>
    </div>
  );
}

/* ================= DELIVERY DASHBOARD ================= */

function DeliveryDashboard() {
  const [orders, setOrders] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyOrderId, setBusyOrderId] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [previewImage, setPreviewImage] = useState(null);

  const closePreview = useCallback(() => {
    setPreviewImage(null);
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const result = await getStaffOrders({ limit: 100 });
      setOrders((result?.items || []).map(mapApiOrder));
      setLoadError("");
    } catch {
      setLoadError(
        "Could not load assigned deliveries. Please retry shortly."
      );
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(loadOrders, 0);
    const interval = window.setInterval(loadOrders, 20000);

    const onFocus = () => loadOrders();
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadOrders]);

  /* ================= FILTER ORDERS ================= */

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesFilter =
        activeFilter === "All" || order.status === activeFilter;

      const matchesSearch =
        String(order.id || "").toLowerCase().includes(query) ||
        String(order.customer || "").toLowerCase().includes(query) ||
        String(order.address || "").toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [orders, activeFilter, search]);

  /* ================= ORDER COUNTS ================= */

  const counts = {
    total: orders.length,
    ready: orders.filter((order) => order.status === "Ready").length,
    out: orders.filter(
      (order) => order.status === "Out for Delivery"
    ).length,
    delivered: orders.filter(
      (order) => order.status === "Delivered"
    ).length,
    failed: orders.filter(
      (order) => order.status === "Not Delivered"
    ).length,
  };

  /* ================= UPDATE DELIVERY STATUS ================= */

  const updateStatus = async (orderId, status) => {
    if (busyOrderId) return;

    const order = orders.find((item) => item.id === orderId);
    if (!order) return;

    setBusyOrderId(orderId);
    setActionError("");

    try {
      let updated;

      if (status === "Not Delivered") {
        const reason = window.prompt(
          "Reason: customer_unavailable, incorrect_address, customer_refused, or other"
        );

        if (!reason?.trim()) return;

        const resolution = window.confirm(
          "Return this order to the bakery? Choose Cancel to retry delivery."
        )
          ? "return"
          : "retry";

        updated = await recordDeliveryAttempt(
          orderId,
          reason.trim(),
          resolution
        );
      } else {
        const apiStatus =
          status === "Ready" ? "Ready for Delivery" : status;

        updated = await changeOrderStatus(
          orderId,
          apiStatus,
          order.lifecycleVersion
        );
      }

      setOrders((items) =>
        items.map((item) =>
          item.id === orderId ? mapApiOrder(updated) : item
        )
      );
    } catch {
      setActionError(
        "Delivery status could not be updated. Please refresh and try again."
      );
    } finally {
      setBusyOrderId("");
    }
  };

  /* ================= DASHBOARD UI ================= */

  return (
    <div className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
      <CakeImagePreview
        image={previewImage?.image}
        name={previewImage?.name}
        onClose={closePreview}
      />

      {/* HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[2px] text-[#9c173d]">
            Delivery
          </p>

          <h1
            className="mt-1 text-3xl font-semibold"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Today's Deliveries
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Pick up ready orders and update delivery status.
          </p>
        </div>
      </div>

      {/* STATS */}

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <DeliveryStat
          title="Today's Orders"
          value={counts.total}
          icon={<Truck size={18} />}
        />

        <DeliveryStat
          title="Ready"
          value={counts.ready}
          icon={<PackageCheck size={18} />}
        />

        <DeliveryStat
          title="Out for Delivery"
          value={counts.out}
          icon={<Navigation size={18} />}
        />

        <DeliveryStat
          title="Delivered"
          value={counts.delivered}
          icon={<CheckCircle2 size={18} />}
        />

        <DeliveryStat
          title="Not Delivered"
          value={counts.failed}
          icon={<XCircle size={18} />}
        />
      </section>

      {/* FILTERS AND ORDERS */}

      <section className="mt-6 rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                  activeFilter === filter
                    ? "bg-[#9c173d] text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-[260px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order..."
              aria-label="Search deliveries"
              className="h-10 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-[#9c173d]"
            />
          </div>
        </div>

        <div className="space-y-3 p-4">
          {loadError && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {loadError}

              <button
                type="button"
                className="ml-2 underline"
                onClick={loadOrders}
              >
                Retry
              </button>
            </div>
          )}

          {actionError && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {actionError}
            </div>
          )}

          {filteredOrders.length === 0 && !loadError && (
            <div className="py-12 text-center text-sm text-gray-500">
              No deliveries found.
            </div>
          )}

          {filteredOrders.map((order) => (
            <DeliveryOrderCard
              key={order.id}
              order={order}
              onUpdateStatus={updateStatus}
              busy={busyOrderId === order.id}
              onPreviewImage={(image, name) =>
                setPreviewImage({ image, name })
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}

/* ================= DELIVERY CARD ================= */

function DeliveryOrderCard({
  order,
  onUpdateStatus,
  busy,
  onPreviewImage,
}) {
  const paymentLabel = String(order.payment || "Payment");
  const amount = getOrderAmount(order);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        {/* ORDER INFORMATION */}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold">{order.id}</span>
            <DeliveryStatus status={order.status} />
          </div>

          <div className="mt-3 flex items-start gap-3">
            {order.productImage && (
              <button
                type="button"
                onClick={() =>
                  onPreviewImage(order.productImage, order.cake)
                }
                aria-label={`View larger image of ${order.cake || "cake"}`}
                title="Click to view full image"
                className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#9c173d]"
              >
                <img
                  src={order.productImage}
                  alt={order.cake || "Ordered cake"}
                  className="h-full w-full object-cover transition-transform duration-200 hover:scale-110"
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </button>
            )}

            <div className="min-w-0">
              <h3 className="text-base font-semibold">
                {order.cake || "Cake order"}
              </h3>

              <p className="mt-1 text-sm text-gray-700">
                {order.customer}
              </p>

              {order.productImage && (
                <button
                  type="button"
                  onClick={() =>
                    onPreviewImage(order.productImage, order.cake)
                  }
                  className="mt-1 text-xs font-medium text-[#9c173d] hover:underline"
                >
                  View cake image
                </button>
              )}
            </div>
          </div>

          {/* ADDRESS */}

          <div className="mt-3 flex items-start gap-2">
            <MapPin
              size={16}
              className="mt-0.5 shrink-0 text-[#9c173d]"
            />

            <p className="break-words text-sm text-gray-600">
              {order.address}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock3 size={13} />
              {order.deliveryTime}
            </span>

            <span className="flex items-center gap-1">
              <Phone size={13} />
              {order.phone}
            </span>
          </div>
        </div>

        {/* ACTION AREA */}

        <div className="flex shrink-0 flex-col gap-3 xl:w-[240px]">
          <div className="flex items-center justify-between xl:block xl:text-right">
            <div>
              <p className="text-xs text-gray-400">Amount</p>

              <p className="text-lg font-bold">
                {formatPrice(amount)}
              </p>
            </div>

            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                paymentLabel.toUpperCase().includes("COD")
                  ? "bg-orange-50 text-orange-600"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {paymentLabel}
            </span>
          </div>

          {/* READY */}

          {order.status === "Ready" && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                onUpdateStatus(order.id, "Out for Delivery")
              }
              className="flex items-center justify-center gap-2 rounded-lg bg-[#9c173d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#861334] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Truck size={17} />
              {busy ? "Updating..." : "Pick Up & Start Delivery"}
            </button>
          )}

          {/* OUT FOR DELIVERY */}

          {order.status === "Out for Delivery" && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => onUpdateStatus(order.id, "Delivered")}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-3 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle2 size={15} />
                {busy ? "Updating..." : "Delivered"}
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => onUpdateStatus(order.id, "Not Delivered")}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                <XCircle size={15} />
                Not Delivered
              </button>
            </div>
          )}

          {/* DELIVERED: FINAL STATUS ONLY */}

          {order.status === "Delivered" && (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600">
              <CheckCircle2 size={17} />
              Delivered
            </div>
          )}

          {/* NOT DELIVERED */}

          {order.status === "Not Delivered" && (
            <div className="rounded-lg bg-red-50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-red-600">
                <XCircle size={17} />
                Not Delivered
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  onUpdateStatus(order.id, "Out for Delivery")
                }
                className="mt-2 text-xs font-semibold text-red-600 underline disabled:opacity-50"
              >
                Try Delivery Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= STATUS ================= */

function DeliveryStatus({ status }) {
  const config = {
    Ready: {
      className: "bg-orange-50 text-orange-600",
      dot: "bg-orange-500",
    },
    "Out for Delivery": {
      className: "bg-blue-50 text-blue-600",
      dot: "bg-blue-500",
    },
    Delivered: {
      className: "bg-emerald-50 text-emerald-600",
      dot: "bg-emerald-500",
    },
    "Not Delivered": {
      className: "bg-red-50 text-red-600",
      dot: "bg-red-500",
    },
  };

  const item = config[status] || {
    className: "bg-gray-100 text-gray-600",
    dot: "bg-gray-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${item.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />
      {status}
    </span>
  );
}

/* ================= STAT ================= */

function DeliveryStat({ title, value, icon }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{title}</p>
        <span className="text-[#9c173d]">{icon}</span>
      </div>

      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

export default DeliveryDashboard;
