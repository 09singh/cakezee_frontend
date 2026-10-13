
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChefHat,
  Clock3,
  CheckCircle2,
  CircleAlert,
  PackageCheck,
  Search,
  X,
  Image as ImageIcon,
} from "lucide-react";

import {
  changeOrderStatus,
  getStaffOrders,
  mapApiOrder,
} from "../../../api/orders.api";

const filters = ["All", "Pending", "Preparing", "Ready"];

/* ================= KITCHEN TIME ================= */

const getKitchenTime = (deliveryTime = "") =>
  deliveryTime.replace(
    /(\d{1,2}):(\d{2})(\s*[ap]m)?|(\d{1,2})(\s*[ap]m)/gi,
    (
      _match,
      hour24Text,
      minuteText,
      suffix24 = "",
      hour12Text,
      suffix12 = ""
    ) => {
      const hourText = hour24Text || hour12Text;
      minuteText ||= "00";

      const meridiem = (suffix24 || suffix12).trim().toUpperCase();
      const hour = Number(hourText);
      const minute = Number(minuteText);

      let totalMinutes = hour * 60 + minute;

      if (meridiem) {
        totalMinutes =
          (hour % 12) * 60 +
          minute +
          (meridiem === "PM" ? 12 * 60 : 0);
      }

      totalMinutes =
        (totalMinutes - 60 + 24 * 60) % (24 * 60);

      const shiftedHour24 = Math.floor(totalMinutes / 60);
      const shiftedMinute = String(totalMinutes % 60).padStart(2, "0");

      if (meridiem) {
        const shiftedHour12 = shiftedHour24 % 12 || 12;
        const shiftedSuffix = shiftedHour24 >= 12 ? "PM" : "AM";

        return `${shiftedHour12}:${shiftedMinute} ${shiftedSuffix}`;
      }

      return `${String(shiftedHour24).padStart(2, "0")}:${shiftedMinute}`;
    }
  );

/* ================= IMAGE PREVIEW MODAL ================= */

function ImagePreviewModal({ image, name, onClose }) {
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
        aria-label="Image preview"
        className="relative w-full max-w-4xl rounded-2xl bg-white p-3 shadow-2xl sm:p-5"
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
          alt={name || "Cake image"}
          className="max-h-[78vh] w-full rounded-xl bg-gray-50 object-contain"
        />

        <p className="mt-3 text-center text-sm font-semibold text-gray-800">
          {name || "Image Preview"}
        </p>
      </div>
    </div>
  );
}

/* ================= KITCHEN DASHBOARD ================= */

function KitchenDashboard() {
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
    } catch (error) {
      setLoadError(
        error?.response?.data?.message ||
          "Could not load kitchen orders. Retry shortly."
      );
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(loadOrders, 0);
    const interval = window.setInterval(loadOrders, 30000);
    const onFocus = () => loadOrders();

    window.addEventListener("focus", onFocus);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesFilter =
        activeFilter === "All" || order.status === activeFilter;

      const matchesSearch =
        String(order.id || "").toLowerCase().includes(searchText) ||
        String(order.customer || "").toLowerCase().includes(searchText) ||
        String(order.cake || "").toLowerCase().includes(searchText);

      return matchesFilter && matchesSearch;
    });
  }, [orders, activeFilter, search]);

  const counts = {
    total: orders.length,
    pending: orders.filter((order) => order.status === "Pending").length,
    preparing: orders.filter((order) => order.status === "Preparing").length,
    ready: orders.filter((order) => order.status === "Ready").length,
    completed: orders.filter((order) => order.status === "Completed").length,
  };

  const updateStatus = async (orderId, status) => {
    if (busyOrderId) return;

    setBusyOrderId(orderId);
    setActionError("");

    const apiStatus =
      status === "Ready" ? "Ready for Delivery" : status;

    try {
      const current = orders.find((order) => order.id === orderId);

      const updated = await changeOrderStatus(
        orderId,
        apiStatus,
        current?.lifecycleVersion
      );

      setOrders((items) =>
        items.map((order) =>
          order.id === orderId ? mapApiOrder(updated) : order
        )
      );
    } catch (error) {
      setActionError(
        error?.response?.data?.message ||
          "Status update failed. The order was not changed; refresh and retry."
      );
    } finally {
      setBusyOrderId("");
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
      {/* IMAGE PREVIEW */}

      <ImagePreviewModal
        image={previewImage?.image}
        name={previewImage?.name}
        onClose={closePreview}
      />

      {/* HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[2px] text-[#9c173d]">
            Kitchen
          </p>

          <h1
            className="mt-1 text-3xl font-semibold"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Today's Orders
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Prepare today's cakes and update their status.
          </p>
        </div>
      </div>

      {/* STATS */}

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KitchenStat
          title="Today's Orders"
          value={counts.total}
          icon={<ChefHat size={18} />}
        />

        <KitchenStat
          title="Pending"
          value={counts.pending}
          icon={<Clock3 size={18} />}
        />

        <KitchenStat
          title="Preparing"
          value={counts.preparing}
          icon={<ChefHat size={18} />}
        />

        <KitchenStat
          title="Ready"
          value={counts.ready}
          icon={<PackageCheck size={18} />}
        />

        <KitchenStat
          title="Completed"
          value={counts.completed}
          icon={<CheckCircle2 size={18} />}
        />
      </section>

      {/* FILTERS AND SEARCH */}

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
              aria-label="Search kitchen orders"
              className="h-10 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-[#9c173d]"
            />
          </div>
        </div>

        {/* ORDERS */}

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
              No orders found.
            </div>
          )}

          {filteredOrders.map((order) => (
            <KitchenOrderCard
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

/* ================= KITCHEN ORDER CARD ================= */

function KitchenOrderCard({
  order,
  onUpdateStatus,
  busy,
  onPreviewImage,
}) {
  const customisation = order.customisation || {};

  const referenceImages = [
    customisation.referenceImage,
    ...(Array.isArray(customisation.referenceImages)
      ? customisation.referenceImages
      : []),
  ]
    .map((image) =>
      typeof image === "string"
        ? image
        : image?.url || image?.dataUrl || ""
    )
    .filter((image, index, images) => {
      return (
        typeof image === "string" &&
        image.length > 0 &&
        images.indexOf(image) === index
      );
    });

  const personalisationDetails = [
    ["Theme", customisation.theme],
    [
      "Cake structure",
      customisation.tiers
        ? `${customisation.tiers} tier${customisation.tiers === 1 ? "" : "s"}`
        : "",
    ],
    ["Name on cake", customisation.nameOnCake],
    ["Cake message", customisation.messageOnCake],
    ["Design notes", customisation.designNotes],
    ["Colour change", customisation.colourChange],
    [
      "Photo on cake",
      typeof customisation.addPhoto === "boolean"
        ? customisation.addPhoto
          ? "Yes"
          : "No"
        : customisation.addPhoto,
    ],
    [
      "Allergy warning",
      customisation.hasAllergy
        ? customisation.allergyNotes || "Allergy noted"
        : "",
    ],
    ["Other request", customisation.otherRequest],
  ].filter(([, value]) => value !== undefined && value !== null && value !== "");

  return (
    <div
      className={`rounded-xl border bg-white p-4 transition ${
        order.priority === "Urgent"
          ? "border-red-200 bg-red-50/30"
          : "border-gray-200"
      }`}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        {/* LEFT: ORDER DETAILS */}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold">{order.id}</span>

            {order.priority === "Urgent" && (
              <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-bold text-red-600">
                URGENT
              </span>
            )}

            <KitchenStatus status={order.status} />
          </div>

          {/* MAIN CAKE IMAGE */}

          <div className="mt-3 flex items-start gap-3">
            {order.productImage ? (
              <button
                type="button"
                onClick={() =>
                  onPreviewImage(order.productImage, order.cake)
                }
                aria-label={`View larger image of ${order.cake || "cake"}`}
                title="Click to view full cake image"
                className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#9c173d]"
              >
                <img
                  src={order.productImage}
                  alt={order.cake || "Ordered cake"}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110"
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />

                <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                  <ImageIcon size={22} />
                </span>
              </button>
            ) : (
              <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-400">
                <ImageIcon size={22} />
                <span className="text-[10px]">No image</span>
              </div>
            )}

            <div className="min-w-0">
              <h3 className="text-base font-semibold">
                {order.cake || "Cake order"}
              </h3>

              <p className="mt-1 text-sm text-gray-600">
                {order.customer}
              </p>

              {order.productImage && (
                <button
                  type="button"
                  onClick={() =>
                    onPreviewImage(order.productImage, order.cake)
                  }
                  className="mt-2 text-xs font-medium text-[#9c173d] hover:underline"
                >
                  View full cake image
                </button>
              )}
            </div>
          </div>

          {/* CAKE INFORMATION */}

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
            <span>
              <b className="text-gray-700">Flavour:</b>{" "}
              {order.flavour || "Not specified"}
            </span>

            <span>
              <b className="text-gray-700">Weight:</b>{" "}
              {order.weight || "Not specified"}
            </span>

            <span>
              <b className="text-gray-700">
                Kitchen target (1 hr early):
              </b>{" "}
              {getKitchenTime(order.deliveryTime) || "Time not set"}
            </span>
          </div>

          {/* PERSONALISATION */}

          <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
            <div className="flex items-center gap-2 font-semibold text-gray-700">
              <CircleAlert
                size={14}
                className="shrink-0 text-gray-400"
              />
              Cake personalisation
            </div>

            {personalisationDetails.length > 0 ? (
              <dl className="mt-2 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                {personalisationDetails.map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="inline font-medium text-gray-700">
                      {label}:{" "}
                    </dt>

                    <dd className="inline break-words">
                      {typeof value === "boolean"
                        ? value
                          ? "Yes"
                          : "No"
                        : value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-2">No customisation requested.</p>
            )}

            {/* CUSTOMER REFERENCE IMAGES */}

            {referenceImages.length > 0 && (
              <div className="mt-4 border-t border-gray-200 pt-3">
                <p className="mb-2 font-semibold text-[#9c173d]">
                  Customer reference images ({referenceImages.length})
                </p>

                <div className="flex flex-wrap gap-3">
                  {referenceImages.map((image, index) => (
                    <button
                      key={`${index}-${image.slice(-12)}`}
                      type="button"
                      onClick={() =>
                        onPreviewImage(
                          image,
                          `Customer reference ${index + 1} - ${order.cake || "Cake"}`
                        )
                      }
                      aria-label={`View customer reference image ${index + 1}`}
                      title="Click to view full image"
                      className="group relative h-28 w-36 overflow-hidden rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#9c173d]"
                    >
                      <img
                        src={image}
                        alt={`Customer reference ${index + 1}`}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110"
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />

                      <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                        <Search size={20} />
                      </span>
                    </button>
                  ))}
                </div>

                <p className="mt-2 text-[11px] text-gray-400">
                  Click any image to view it in full size.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: STATUS ACTIONS */}

        <div className="flex shrink-0 flex-col gap-3 xl:w-[230px]">
          {order.status === "Pending" && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                onUpdateStatus(order.id, "Preparing")
              }
              className="flex items-center justify-center gap-2 rounded-lg bg-[#9c173d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#861334] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChefHat size={17} />
              {busy ? "Updating..." : "Start Preparing"}
            </button>
          )}

          {order.status === "Preparing" && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                onUpdateStatus(order.id, "Ready")
              }
              className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PackageCheck size={17} />
              {busy ? "Updating..." : "Mark Ready"}
            </button>
          )}

          {order.status === "Ready" && (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-600">
              <CheckCircle2 size={17} />
              Ready for Delivery
            </div>
          )}

          {order.status === "Completed" && (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-500">
              <CheckCircle2 size={17} />
              Completed
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= STATUS ================= */

function KitchenStatus({ status }) {
  const config = {
    Pending: {
      className: "bg-orange-50 text-orange-600",
      dot: "bg-orange-500",
    },
    Preparing: {
      className: "bg-blue-50 text-blue-600",
      dot: "bg-blue-500",
    },
    Ready: {
      className: "bg-emerald-50 text-emerald-600",
      dot: "bg-emerald-500",
    },
    Completed: {
      className: "bg-gray-100 text-gray-600",
      dot: "bg-gray-500",
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

function KitchenStat({ title, value, icon }) {
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

export default KitchenDashboard;
