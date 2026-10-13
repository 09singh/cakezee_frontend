
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CircleHelp,
  Eye,
  Plus,
  Search,
  X,
} from "lucide-react";

import {
  createAdminOrder,
  getAdminCategories,
  getAdminProducts,
} from "../../../api/auth.api";
import {
  decideOrderCancellation,
  getStaffOrders,
  mapApiOrder,
  overrideOrderStatus,
} from "../../../api/orders.api";

const dateFilters = [
  "Upcoming",
  "Today",
  "Tomorrow",
  "Next 3 Days",
  "Next 7 Days",
  "This Month",
  "Custom Date",
  "All",
];

const quickFilters = [
  "Balance Due",
  "Urgent",
  "Delivery",
  "Pickup",
  "Has Images",
];

const statusFilters = [
  "All",
  "Pending",
  "Baking",
  "Decoration",
  "Ready",
  "Delivered",
  "Cancelled",
];

const businessDate = (date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const addDays = (dateString, amount) => {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
};

const responseItems = (response) => {
  const pending = [response];
  const visited = new Set();

  while (pending.length) {
    const value = pending.shift();

    if (Array.isArray(value)) return value;
    if (!value || typeof value !== "object" || visited.has(value)) continue;

    visited.add(value);

    pending.push(
      value.data,
      value.items,
      value.products,
      value.categories,
      value.results
    );
  }

  return [];
};

const getEntityId = (value) => {
  if (value == null) return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return String(value._id || value.id || value.$oid || value.value || "");
};

const createManualCheckoutId = () => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const getOrderDate = (order) =>
  String(
    order.delivery?.date ||
      order.deliveryDate ||
      order.scheduledDeliveryDate ||
      ""
  ).slice(0, 10);

const getStatusGroup = (status = "") => {
  const normalized = String(status).toLowerCase();

  if (
    normalized === "confirmed" ||
    normalized === "pending" ||
    normalized === "new"
  ) {
    return "Pending";
  }

  if (normalized === "preparing" || normalized === "baking") {
    return "Baking";
  }

  if (normalized === "decoration" || normalized === "decorating") {
    return "Decoration";
  }

  if (
    normalized.includes("ready") ||
    normalized === "out for delivery"
  ) {
    return "Ready";
  }

  if (normalized === "delivered") return "Delivered";

  if (normalized === "cancelled" || normalized === "canceled") {
    return "Cancelled";
  }

  return status || "Pending";
};

const getCancellationInfo = (order) => {
  const cancellation = order.cancellation || {};
  const history = Array.isArray(order.statusHistory)
    ? order.statusHistory
    : [];

  const cancelledEvent = [...history].reverse().find((event) =>
    ["cancelled", "canceled"].includes(
      String(event.status || event.to || "").toLowerCase()
    )
  );

  const reason =
    cancellation.reason ||
    cancellation.cancellationReason ||
    cancellation.requestReason ||
    order.cancellationReason ||
    order.cancelReason ||
    order.delivery?.cancellationReason ||
    cancelledEvent?.reason ||
    "";

  const source = [
    cancellation.source,
    cancellation.requestedBy,
    cancellation.cancelledBy,
    cancellation.canceledBy,
    cancelledEvent?.source,
    cancelledEvent?.actorRole,
    cancelledEvent?.changedBy?.role,
    cancelledEvent?.actor?.role,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let sourceLabel = "Source not specified";

  if (/delivery|rider|driver/.test(source)) {
    sourceLabel = "Delivery person";
  } else if (/customer|guest/.test(source)) {
    sourceLabel = "Customer";
  } else if (/admin|staff/.test(source)) {
    sourceLabel = "Staff";
  }

  return {
    reason: reason || "No cancellation reason recorded",
    sourceLabel,
  };
};

const hasOrderImages = (order) => {
  const customisation = order.customisation || {};

  return Boolean(
    customisation.addPhoto ||
      customisation.referenceImage ||
      customisation.image ||
      customisation.images?.length
  );
};

const isUrgent = (order) =>
  Boolean(
    order.isUrgent ||
      order.urgent ||
      order.priority === "urgent" ||
      order.customisation?.urgent
  );

const hasBalanceDue = (order) => {
  const total = Number(order.pricing?.total || 0);
  const paid = Number(
    order.payment?.amountPaid || order.payment?.paidAmount || 0
  );

  return total > paid && order.payment?.status !== "paid";
};

const getOrderSearchText = (order) =>
  [
    order.id,
    order.orderId,
    order.invoiceNumber,
    order.invoiceId,
    order.customer,
    order.customerName,
    order.phone,
    order.cake,
    order.productName,
    order.flavour,
    order.theme,
    order.customisation?.theme,
    order.customisation?.nameOnCake,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const getSizeOptions = (product) => {
  const sizes = Array.isArray(product?.sizes) ? product.sizes : [];

  return sizes.map((size) => {
    const value = Number(size.value);
    const unit = String(size.unit || "kg").toLowerCase();
    const weight = unit === "g" ? value / 1000 : value;

    return {
      label: size.name || `${value} ${unit}`,
      payload: size.name || `${value} ${unit}`,
      weight,
    };
  });
};

const getProductCategoryId = (product) =>
  getEntityId(
    product?.categoryId ||
      product?.category ||
      product?.category_id ||
      product?.categoryID
  );

const fileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () =>
      reject(new Error(`Could not read ${file.name}.`));

    reader.readAsDataURL(file);
  });

const getFlavourOptions = (product) =>
  product?.flavours || product?.flavors || [];

function StatusBadge({ status }) {
  const group = getStatusGroup(status);

  const styles = {
    Pending: "border-amber-200 bg-amber-50 text-amber-800",
    Baking: "border-orange-200 bg-orange-50 text-orange-800",
    Decoration: "border-purple-200 bg-purple-50 text-purple-800",
    Ready: "border-blue-200 bg-blue-50 text-blue-800",
    Delivered: "border-emerald-200 bg-emerald-50 text-emerald-800",
    Cancelled: "border-red-200 bg-red-50 text-red-800",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${
        styles[group] ||
        "border-[#E8D9D5] bg-[#FFF5E9] text-[#78676A]"
      }`}
    >
      {group}
    </span>
  );
}

function FilterPill({ active, children, onClick, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
        active
          ? "border-[#65152D] bg-[#65152D] text-white shadow-sm"
          : "border-[#E8D9D5] bg-white text-[#652B3B] hover:border-[#65152D]/30 hover:bg-[#FFF5E9]"
      }`}
    >
      {children}

      {count !== undefined && (
        <span
          className={`rounded-full px-1.5 text-[10px] ${
            active
              ? "bg-white/20 text-white"
              : "bg-[#F8EBDD] text-[#65152D]"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function ManualOrderDrawer({ onClose, onCreated }) {
  const today = businessDate(new Date());

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [referenceImages, setReferenceImages] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    occasion: "",
    occasionDate: "",
    nameOnCake: "",
    eggless: false,
    gstin: "",
    categoryId: "",
    productId: "",
    price: "",
    size: "",
    flavour: "",
    quantity: "1",
    theme: "",
    tiersEnabled: false,
    tiers: "1",
    messageOnProduct: "",
    designNotes: "",
    hasAllergy: false,
    allergyNotes: "",
    method: "delivery",
    date: today,
    time: "",
    address: "",
    mapLink: "",
    mapLinkText: "",
    deliveryFee: "60",
    paymentMethod: "cash",
  });

  useEffect(() => {
    let active = true;

    const loadCategories = async () => {
      try {
        const response = await getAdminCategories();
        if (!active) return;

        const available = responseItems(response).filter(
          (category) => category.isActive !== false
        );

        setCategories(available);

        setForm((current) => ({
          ...current,
          categoryId: available.some(
            (category) => getEntityId(category) === current.categoryId
          )
            ? current.categoryId
            : getEntityId(available[0]),
        }));
      } catch (error) {
        if (!active) return;

        setProductError(
          error?.response?.data?.message || "Could not load categories."
        );
      }
    };

    const loadProducts = async () => {
      try {
       let productResponse = await getAdminProducts({
            limit: 20,
            page: 1,
          });

        let available = responseItems(productResponse);
        let page = 1;

        while (productResponse?.pagination?.hasNext && page < 100) {
          page += 1;

          productResponse = await getAdminProducts({
            limit: 100,
            page,
          });

          available = [...available, ...responseItems(productResponse)];
        }

        if (!active) return;

        available = available.filter(
          (product) => product.isActive !== false
        );

        setProducts(available);

        setForm((current) => {
          const product =
            available.find(
              (item) =>
                getProductCategoryId(item) === current.categoryId
            ) || available[0];

          const sizes = getSizeOptions(product);
          const flavours = getFlavourOptions(product);
          const firstFlavour = flavours[0];

          const weight =
            sizes[0]?.weight ||
            Number(product?.pricing?.baseWeight) ||
            0;

          const baseWeight =
            Number(product?.pricing?.baseWeight) || weight || 1;

          return {
            ...current,
            categoryId:
              getProductCategoryId(product) || current.categoryId,
            productId: getEntityId(product),
            size: sizes[0]?.payload || "",
            flavour: firstFlavour?.name || "",
            price: firstFlavour
              ? String(
                  Math.round(
                    (Number(firstFlavour.basePrice || 0) * weight) /
                      baseWeight
                  )
                )
              : "",
          };
        });
      } catch (error) {
        if (active) {
          setProductError(
            error?.response?.data?.message || "Could not load products."
          );
        }
      } finally {
        if (active) setLoadingProducts(false);
      }
    };

    loadCategories();
    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const selectedProduct = products.find(
    (product) =>
      String(product._id || product.id) === String(form.productId)
  );

  const categoryProducts = products.filter(
    (product) => getProductCategoryId(product) === String(form.categoryId)
  );

  const sizes = getSizeOptions(selectedProduct);
  const flavours = getFlavourOptions(selectedProduct);

  const selectedFlavour = flavours.find(
    (flavour) => flavour.name === form.flavour
  );

  const selectedSize = sizes.find(
    (size) => size.payload === form.size
  );

  const calculatedPrice = selectedFlavour
    ? Math.round(
        (Number(selectedFlavour.basePrice || 0) *
          (selectedSize?.weight || 1)) /
          (Number(selectedProduct?.pricing?.baseWeight) || 1)
      )
    : 0;

  const orderTotal =
    Math.max(0, Number(form.price) || 0) *
      Math.max(1, Number(form.quantity) || 1) +
      (form.method === "delivery" ? Math.max(0, Number(form.deliveryFee) || 0) : 0);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateProductOption = (key, value) => {
    const nextSize =
      key === "size"
        ? sizes.find((size) => size.payload === value)
        : selectedSize;

    const nextFlavour =
      key === "flavour"
        ? flavours.find((flavour) => flavour.name === value)
        : selectedFlavour;

    const baseWeight =
      Number(selectedProduct?.pricing?.baseWeight) ||
      nextSize?.weight ||
      1;

    const price = nextFlavour
      ? String(
          Math.round(
            (Number(nextFlavour.basePrice || 0) *
              (nextSize?.weight || 1)) /
              baseWeight
          )
        )
      : "";

    setForm((current) => ({ ...current, [key]: value, price }));
  };

  const handleProductChange = (productId) => {
    const product = products.find(
      (item) => String(item._id || item.id) === productId
    );

    const productSizes = getSizeOptions(product);
    const productFlavours = getFlavourOptions(product);

    const initialWeight =
      productSizes[0]?.weight ||
      Number(product?.pricing?.baseWeight) ||
      0;

    const baseWeight =
      Number(product?.pricing?.baseWeight) || initialWeight || 1;

    setForm((current) => ({
      ...current,
      productId,
      size: productSizes[0]?.payload || "",
      flavour: productFlavours[0]?.name || "",
      price: productFlavours[0]
        ? String(
            Math.round(
              (Number(productFlavours[0].basePrice || 0) *
                initialWeight) /
                baseWeight
            )
          )
        : "",
    }));
  };

  const handleCategoryChange = (categoryId) => {
    const firstProduct = products.find(
      (product) => getProductCategoryId(product) === categoryId
    );

    setForm((current) => ({
      ...current,
      categoryId,
      productId: "",
    }));

    if (firstProduct) {
      handleProductChange(getEntityId(firstProduct));
    }
  };

  const handleReferenceImages = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) return;

    const remaining = 5 - referenceImages.length;

    if (files.length > remaining) {
      setSubmitError("You can attach up to 5 reference images.");
      return;
    }

    if (
      files.some(
        (file) =>
          !file.type.startsWith("image/") ||
          file.size > 350 * 1024
      )
    ) {
      setSubmitError(
        "Each reference image must be an image file of 350 KB or less."
      );
      return;
    }

    try {
      const dataUrls = await Promise.all(files.map(fileAsDataUrl));

      const currentSize = referenceImages.reduce(
        (total, image) => total + image.length,
        0
      );

      const addedSize = dataUrls.reduce(
        (total, image) => total + image.length,
        0
      );

      if (currentSize + addedSize > 700_000) {
        setSubmitError(
          "Reference images together must stay under 700 KB so the order can be uploaded safely."
        );
        return;
      }

      setReferenceImages((current) => [...current, ...dataUrls]);
      setSubmitError("");
    } catch (error) {
      setSubmitError(
        error.message || "The reference image could not be read."
      );
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    setSubmitError("");

    if (
      !categories.some(
        (category) =>
          String(category._id || category.id) === form.categoryId
      ) ||
      !selectedProduct ||
      !form.size ||
      !form.flavour
    ) {
      setSubmitError(
        "Select an active category, product, size, and flavour."
      );
      return;
    }

    if (
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) <= 0
    ) {
      setSubmitError("Enter a valid price greater than zero.");
      return;
    }

    if (form.date < today) {
      setSubmitError(
        "Choose today or a future delivery/pickup date."
      );
      return;
    }

    if (form.method === "delivery" && !form.address.trim()) {
      setSubmitError("Enter a delivery address or select pickup.");
      return;
    }

    const phoneDigits = form.phone.replace(/\D/g, "");

    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      setSubmitError("Enter a valid customer phone number.");
      return;
    }

    if (
      form.gstin.trim() &&
      !/^[0-9A-Z]{15}$/i.test(form.gstin.trim())
    ) {
      setSubmitError("GSTIN must contain 15 letters and numbers.");
      return;
    }

    setSaving(true);

    try {
      const checkoutId = createManualCheckoutId();

      const response = await createAdminOrder({
        checkoutId,
        customerName: form.customerName.trim(),
        phone: form.phone.trim(),
        occasion: form.occasion.trim(),
        occasionDate: form.occasionDate,
        gstin: form.gstin.trim().toUpperCase(),
        categoryId: form.categoryId,
        productId: selectedProduct._id || selectedProduct.id,
        productName: selectedProduct.name,
        size: form.size,
        flavour: form.flavour,
        quantity: Math.max(1, Number(form.quantity) || 1),
        unitPrice: Number(form.price),
        pricing: {
          subtotal: orderTotal,
          total: orderTotal,
          currency: "INR",
          gstInclusive: true,
        },
        customisation: {
          theme: form.theme.trim(),
          nameOnCake: form.nameOnCake.trim(),
          eggless: form.eggless,
          tiers: form.tiersEnabled ? Number(form.tiers) : null,
          messageOnCake: form.messageOnProduct.trim(),
          designNotes: form.designNotes.trim(),
          hasAllergy: form.hasAllergy,
          allergyNotes: form.hasAllergy
            ? form.allergyNotes.trim()
            : "",
          paymentPreference: form.paymentMethod,
          referenceImage: referenceImages[0] || "",
          referenceImages: referenceImages.slice(1),
        },
        delivery: {
          method: form.method,
          date: form.date,
          time: form.time.trim(),
          address:
            form.method === "delivery" ? form.address.trim() : "",
          mapLink: form.method === "delivery" ? form.mapLink.trim() : "",
          mapLinkText: form.method === "delivery" ? form.mapLinkText.trim() : "",
          phone: form.phone.trim(),
        },
        deliveryFee: Number(form.deliveryFee) || 0,
        paymentMethod:
          form.paymentMethod === "cash" ? "cod" : "upi",
        paymentPreference: form.paymentMethod,
      });

      const orderCandidates = [
        response?.order,
        response?.data?.order,
        response?.data?.data,
        response?.data,
        response,
      ];

      const order = orderCandidates.find(
        (candidate) => candidate?.orderId
      );

      if (!order) {
        throw new Error(
          "The order service did not return a saved order."
        );
      }

      onCreated(order);
    } catch (error) {
      const responseData = error?.response?.data;

      const detail = Array.isArray(responseData?.errors)
        ? responseData.errors
            .map((item) =>
              typeof item === "string"
                ? item
                : item?.message || JSON.stringify(item)
            )
            .join(" ")
        : responseData?.errors &&
            typeof responseData.errors === "object"
          ? Object.entries(responseData.errors)
              .map(
                ([field, value]) =>
                  `${field}: ${
                    typeof value === "string"
                      ? value
                      : value?.message || JSON.stringify(value)
                  }`
              )
              .join(" ")
          : "";

      setSubmitError(
        detail ||
          responseData?.message ||
          (error?.response?.status
            ? `Order request failed (HTTP ${error.response.status}).`
            : "") ||
          error?.message ||
          "The order could not be saved. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-[#E8D9D5] bg-white px-3 py-2.5 text-sm text-[#35262A] outline-none transition placeholder:text-[#A18D90] focus:border-[#65152D] focus:ring-2 focus:ring-[#65152D]/10 disabled:cursor-not-allowed disabled:bg-[#FFF5E9]";

  const labelClass = "text-xs font-medium text-[#78676A]";

  const sectionClass =
    "rounded-xl border border-[#E8D9D5] bg-[#FFFCF8] p-3";

  const selectedOptionClass = "bg-[#65152D] text-white";
  const unselectedOptionClass =
    "border border-[#E8D9D5] bg-white text-[#78676A] hover:bg-[#FFF5E9]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#28131B]/55 p-3 backdrop-blur-[2px] sm:p-5"
      onMouseDown={(event) =>
        event.target === event.currentTarget && onClose()
      }
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-order-title"
        className="my-auto flex max-h-[min(92vh,920px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#E8D9D5] bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-[#E8D9D5] bg-[#FFFCF8] px-5 py-4">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#95616E]">
              Cakezee · Order Management
            </p>
            <h2
              id="new-order-title"
              className="text-lg font-bold text-[#65152D]"
            >
              New Order
            </h2>
            <p className="mt-1 text-xs text-[#78676A]">
              Create an order in your order database.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close new order"
            className="rounded-lg p-2 text-[#78676A] transition hover:bg-[#F8EBDD] hover:text-[#65152D]"
          >
            <X size={19} />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-white p-4 sm:p-5"
        >
          {productError && (
            <p
              role="alert"
              className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
            >
              {productError}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Occasion
              <input
                value={form.occasion}
                onChange={(event) => update("occasion", event.target.value)}
                className={`${inputClass} mt-1.5`}
                placeholder="Birthday, anniversary, etc."
              />
            </label>
            <label className={labelClass}>
              Date of occasion
              <input
                type="date"
                value={form.occasionDate}
                onChange={(event) => update("occasionDate", event.target.value)}
                className={`${inputClass} mt-1.5`}
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Customer name
              <input value={form.customerName} onChange={(event) => update("customerName", event.target.value)} className={`${inputClass} mt-1.5`} placeholder="Customer name" />
            </label>

            <label className={labelClass}>
              Phone number *
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(event) =>
                  update("phone", event.target.value)
                }
                className={`${inputClass} mt-1.5`}
                placeholder="Customer phone"
                autoComplete="tel"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              GSTIN <span className="font-normal">(optional)</span>
              <input
                value={form.gstin}
                onChange={(event) =>
                  update("gstin", event.target.value.toUpperCase())
                }
                maxLength={15}
                className={`${inputClass} mt-1.5`}
                placeholder="15 character GSTIN"
              />
            </label>

            <label className={labelClass}>
              Category *
              <select
                required
                disabled={categories.length === 0}
                value={form.categoryId}
                onChange={(event) =>
                  handleCategoryChange(event.target.value)
                }
                className={`${inputClass} mt-1.5`}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option
                    key={getEntityId(category)}
                    value={getEntityId(category)}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className={`block ${labelClass}`}>
            Product *
            <select
              required
              disabled={
                loadingProducts || categoryProducts.length === 0
              }
              value={form.productId}
              onChange={(event) =>
                handleProductChange(event.target.value)
              }
              className={`${inputClass} mt-1.5`}
            >
              <option value="">Select product</option>
              {categoryProducts.map((product) => (
                <option
                  key={product._id || product.id}
                  value={product._id || product.id}
                >
                  {product.name}
                </option>
              ))}
            </select>
          </label>

          {!loadingProducts &&
            form.categoryId &&
            categoryProducts.length === 0 && (
              <p className="-mt-3 text-xs text-amber-700">
                No active products are available in this category.
              </p>
            )}

          <div className="grid gap-3 sm:grid-cols-3">
            <label className={labelClass}>
              Size *
              <select
                required
                value={form.size}
                onChange={(event) =>
                  updateProductOption("size", event.target.value)
                }
                className={`${inputClass} mt-1.5`}
              >
                {sizes.map((size) => (
                  <option key={size.payload} value={size.payload}>
                    {size.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClass}>
              Flavour *
              <select
                required
                value={form.flavour}
                onChange={(event) =>
                  updateProductOption("flavour", event.target.value)
                }
                className={`${inputClass} mt-1.5`}
              >
                {flavours.map((flavour) => (
                  <option key={flavour.name} value={flavour.name}>
                    {flavour.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClass}>
              Quantity
              <input
                type="number"
                min="1"
                max="20"
                required
                value={form.quantity}
                onChange={(event) =>
                  update("quantity", event.target.value)
                }
                className={`${inputClass} mt-1.5`}
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Price per item (₹, GST inclusive) *
              <input
                type="number"
                min="1"
                step="1"
                required
                value={form.price}
                onChange={(event) =>
                  update("price", event.target.value)
                }
                className={`${inputClass} mt-1.5`}
                placeholder={String(calculatedPrice || 0)}
              />
            </label>

            <div className="flex items-center justify-between rounded-xl border border-[#E8D9D5] bg-[#FFF5E9] px-4 py-3">
              <div>
                <span className="block text-xs font-medium text-[#78676A]">
                  Order total
                </span>
                <span className="mt-1 block text-[10px] text-[#95616E]">
                  {form.method === "delivery"
                    ? "Including ₹60 delivery"
                    : "Pickup order"}
                </span>
              </div>
              <strong className="text-xl font-bold text-[#65152D]">
                ₹{orderTotal.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>

          <label className={`block ${labelClass}`}>
            Theme
            <input
              value={form.theme}
              onChange={(event) => update("theme", event.target.value)}
              className={`${inputClass} mt-1.5`}
              placeholder="e.g. floral, superhero"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Name on cake
              <input value={form.nameOnCake} onChange={(event) => update("nameOnCake", event.target.value)} className={`${inputClass} mt-1.5`} placeholder="Name to write on the cake" />
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-[#78676A]">
              <input type="checkbox" checked={form.eggless} onChange={(event) => update("eggless", event.target.checked)} className="accent-[#65152D]" />
              Eggless
            </label>
          </div>

          <fieldset className={sectionClass}>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#652B3B]">
              <input
                type="checkbox"
                checked={form.tiersEnabled}
                onChange={(event) =>
                  update("tiersEnabled", event.target.checked)
                }
                className="accent-[#65152D]"
              />
              Specify cake structure / tiers (optional)
            </label>

            {form.tiersEnabled && (
              <label className={`mt-3 block ${labelClass}`}>
                Number of tiers
                <select
                  value={form.tiers}
                  onChange={(event) =>
                    update("tiers", event.target.value)
                  }
                  className={`${inputClass} mt-1.5`}
                >
                  {Array.from({ length: 6 }, (_, index) => index + 1).map(
                    (tier) => (
                      <option key={tier} value={tier}>
                        {tier} {tier === 1 ? "tier" : "tiers"}
                      </option>
                    )
                  )}
                </select>
              </label>
            )}
          </fieldset>

          <label className={`block ${labelClass}`}>
            Message on product (cake / plaque)
            <input
              value={form.messageOnProduct}
              onChange={(event) =>
                update("messageOnProduct", event.target.value)
              }
              className={`${inputClass} mt-1.5`}
              placeholder="e.g. Happy Birthday Arjun"
            />
          </label>

          <label className={`block ${labelClass}`}>
            Design notes
            <textarea
              rows="3"
              value={form.designNotes}
              onChange={(event) =>
                update("designNotes", event.target.value)
              }
              className={`${inputClass} mt-1.5`}
              placeholder="Notes for the decorator"
            />
          </label>

          <fieldset className={sectionClass}>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#652B3B]">
              <input
                type="checkbox"
                checked={form.hasAllergy}
                onChange={(event) =>
                  update("hasAllergy", event.target.checked)
                }
                className="accent-[#65152D]"
              />
              Customer has an allergy
            </label>

            {form.hasAllergy && (
              <textarea
                required
                rows="2"
                value={form.allergyNotes}
                onChange={(event) =>
                  update("allergyNotes", event.target.value)
                }
                className={`${inputClass} mt-3`}
                placeholder="List allergens / allergy notes"
              />
            )}
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-[#78676A]">
              Fulfilment
            </legend>

            <div className="flex gap-2">
              {["delivery", "pickup"].map((method) => (
                <button
                  key={method}
                  type="button"
                  aria-pressed={form.method === method}
                  onClick={() => update("method", method)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold capitalize transition ${
                    form.method === method
                      ? selectedOptionClass
                      : unselectedOptionClass
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Delivery / pickup date *
              <input
                type="date"
                min={today}
                required
                value={form.date}
                onChange={(event) => update("date", event.target.value)}
                className={`${inputClass} mt-1.5`}
              />
            </label>

            <label className={labelClass}>
              Time
              <input
                required
                value={form.time}
                onChange={(event) => update("time", event.target.value)}
                className={`${inputClass} mt-1.5`}
                placeholder="e.g. 10:00 AM - 12:00 PM"
              />
            </label>
          </div>

          {form.method === "delivery" && (
            <div className="space-y-3">
              <label className={`block ${labelClass}`}>
                Delivery address *
                <textarea required rows="2" value={form.address} onChange={(event) => update("address", event.target.value)} className={`${inputClass} mt-1.5`} placeholder="Full delivery address" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={labelClass}>Google Maps link<input type="url" value={form.mapLink} onChange={(event) => update("mapLink", event.target.value)} className={`${inputClass} mt-1.5`} placeholder="https://maps.google.com/..." /></label>
                <label className={labelClass}>Map link text<input value={form.mapLinkText} onChange={(event) => update("mapLinkText", event.target.value)} className={`${inputClass} mt-1.5`} placeholder="Open delivery location" /></label>
                <label className={labelClass}>Delivery charges (₹)<input type="number" min="0" step="1" value={form.deliveryFee} onChange={(event) => update("deliveryFee", event.target.value)} className={`${inputClass} mt-1.5`} /></label>
              </div>
            </div>
          )}

          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-[#78676A]">
              Payment method *
            </legend>

            <div className="grid grid-cols-2 gap-2">
              {["cash", "upi"].map((method) => (
                <button
                  key={method}
                  type="button"
                  aria-pressed={form.paymentMethod === method}
                  onClick={() => update("paymentMethod", method)}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-semibold uppercase transition ${
                    form.paymentMethod === method
                      ? selectedOptionClass
                      : unselectedOptionClass
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#78676A]">
              <span>Reference images (optional)</span>
              <span>{referenceImages.length}/5</span>
            </div>

            <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#CDAFB7] bg-[#FFFCF8] px-4 py-4 text-sm font-semibold text-[#65152D] transition hover:border-[#65152D] hover:bg-[#FFF5E9]">
              <Plus size={16} className="mr-2" />
              Add reference images (up to 5)
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={referenceImages.length >= 5}
                onChange={handleReferenceImages}
                className="sr-only"
              />
            </label>

            {referenceImages.length > 0 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {referenceImages.map((image, index) => (
                  <div
                    key={`${index}-${image.slice(-12)}`}
                    className="relative"
                  >
                    <img
                      src={image}
                      alt={`Order reference ${index + 1}`}
                      className="h-16 w-full rounded-lg border border-[#E8D9D5] object-cover"
                    />

                    <button
                      type="button"
                      aria-label={`Remove reference image ${index + 1}`}
                      onClick={() =>
                        setReferenceImages((items) =>
                          items.filter(
                            (_, itemIndex) => itemIndex !== index
                          )
                        )
                      }
                      className="absolute -right-1 -top-1 rounded-full bg-white p-1 text-red-600 shadow"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-1 text-[11px] text-[#958186]">
              Images up to 350 KB each.
            </p>
          </div>

          {submitError && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {submitError}
            </p>
          )}

          <p className="text-xs leading-5 text-[#958186]">
            The order is sent to the shared order service and then refreshed
            from the server.
          </p>

          <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t border-[#E8D9D5] bg-white px-4 py-4 sm:-mx-5 sm:px-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#E8D9D5] px-4 py-2.5 text-sm font-semibold text-[#652B3B] transition hover:bg-[#FFF5E9]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving || loadingProducts || products.length === 0
              }
              className="rounded-lg bg-[#65152D] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#501023] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Booking..." : "Book Order"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function OrdersDashboard() {
  const [orders, setOrders] = useState([]);
  const [orderError, setOrderError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyOrderId, setBusyOrderId] = useState("");
  const [dateFilter, setDateFilter] = useState("Upcoming");
  const [customDate, setCustomDate] = useState(
    businessDate(new Date())
  );
  const [activeQuickFilters, setActiveQuickFilters] = useState([]);
  const [activeStatus, setActiveStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [showNewOrder, setShowNewOrder] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const result = await getStaffOrders({ limit: 100 });

      setOrders((result?.items || []).map(mapApiOrder));
      setOrderError("");
    } catch (error) {
      setOrderError(
        error?.response?.data?.message || "Could not load orders."
      );
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(loadOrders, 0);
    const interval = window.setInterval(loadOrders, 30000);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadOrders]);

  const handleOverride = async (order) => {
    if (busyOrderId) return;

    if (order.cancellation?.decision === "pending") {
      const decision = window.confirm(
        `Approve cancellation request for ${order.id}? Choose Cancel to reject it.`
      )
        ? "approve"
        : "reject";

      const reason =
        decision === "reject"
          ? window.prompt(
              "Reason for rejecting this cancellation request (required):"
            )
          : "";

      if (decision === "reject" && !reason?.trim()) return;

      setBusyOrderId(order.id);
      setActionError("");

      try {
        const updated = await decideOrderCancellation(
          order.id,
          decision,
          reason?.trim() || ""
        );

        setOrders((items) =>
          items.map((item) =>
            item.id === order.id ? mapApiOrder(updated) : item
          )
        );
      } catch (error) {
        setActionError(
          error?.response?.data?.message ||
            "Cancellation decision failed."
        );
      } finally {
        setBusyOrderId("");
      }

      return;
    }

    const status = window.prompt(
      "Enter new order status (Confirmed, Preparing, Ready for Delivery, Out for Delivery, Delivered, Cancelled):",
      order.status
    );

    if (!status || status === order.status) return;

    const reason = window.prompt(
      "Reason for this Admin override (required):"
    );

    if (!reason?.trim() || !window.confirm(`Apply ${status} to ${order.id}?`)) {
      return;
    }

    setBusyOrderId(order.id);
    setActionError("");

    try {
      const updated = await overrideOrderStatus(
        order.id,
        status,
        order.lifecycleVersion,
        reason.trim()
      );

      setOrders((items) =>
        items.map((item) =>
          item.id === order.id ? mapApiOrder(updated) : item
        )
      );
    } catch (error) {
      setActionError(
        error?.response?.data?.message ||
          "Override failed; the order was not changed."
      );
    } finally {
      setBusyOrderId("");
    }
  };

  const toggleQuickFilter = (filter) => {
    setActiveQuickFilters((current) =>
      current.includes(filter)
        ? current.filter((item) => item !== filter)
        : [...current, filter]
    );
  };

  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(
      statusFilters.map((status) => [status, 0])
    );

    counts.All = orders.length;

    orders.forEach((order) => {
      const group = getStatusGroup(order.status);

      if (counts[group] !== undefined) {
        counts[group] += 1;
      }
    });

    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const today = businessDate(new Date());
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const date = getOrderDate(order);
      let matchesDate = true;

      if (dateFilter === "Upcoming") {
        matchesDate =
          Boolean(date) &&
          date >= today &&
          getStatusGroup(order.status) !== "Cancelled" &&
          getStatusGroup(order.status) !== "Delivered";
      } else if (dateFilter === "Today") {
        matchesDate = date === today;
      } else if (dateFilter === "Tomorrow") {
        matchesDate = date === addDays(today, 1);
      } else if (dateFilter === "Next 3 Days") {
        matchesDate =
          Boolean(date) &&
          date >= today &&
          date <= addDays(today, 3);
      } else if (dateFilter === "Next 7 Days") {
        matchesDate =
          Boolean(date) &&
          date >= today &&
          date <= addDays(today, 7);
      } else if (dateFilter === "This Month") {
        matchesDate = date.startsWith(today.slice(0, 7));
      } else if (dateFilter === "Custom Date") {
        matchesDate = date === customDate;
      }

      const method = String(
        order.delivery?.method || ""
      ).toLowerCase();

      const matchesQuickFilters = activeQuickFilters.every((filter) => {
        if (filter === "Balance Due") return hasBalanceDue(order);
        if (filter === "Urgent") return isUrgent(order);

        if (filter === "Delivery") {
          return (
            method === "delivery" ||
            (!method && Boolean(order.delivery?.address))
          );
        }

        if (filter === "Pickup") {
          return (
            method === "pickup" ||
            (!method && !order.delivery?.address)
          );
        }

        if (filter === "Has Images") return hasOrderImages(order);

        return true;
      });

      const matchesStatus =
        activeStatus === "All" ||
        getStatusGroup(order.status) === activeStatus;

      const matchesSearch =
        !query || getOrderSearchText(order).includes(query);

      return (
        matchesDate &&
        matchesQuickFilters &&
        matchesStatus &&
        matchesSearch
      );
    });
  }, [
    orders,
    dateFilter,
    customDate,
    activeQuickFilters,
    activeStatus,
    search,
  ]);

  const handleOrderCreated = (order) => {
    setOrders((current) => [mapApiOrder(order), ...current]);
    setShowNewOrder(false);
    setNotice(`Order ${order.orderId} saved successfully.`);

    window.setTimeout(() => setNotice(""), 5000);
    loadOrders();
  };

  return (
    <div className="min-h-screen bg-[#FFF5E9] text-[#35262A]">
      <div className="mx-auto max-w-[1500px] p-4 sm:p-5 lg:p-7">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#95616E]">
              Cakezee · Management
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-[#65152D] sm:text-3xl">
              Orders
            </h1>

            <p className="mt-1.5 text-sm text-[#78676A]">
              {filteredOrders.length} shown · {orders.length} total orders
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setNotice("");
              setShowNewOrder(true);
            }}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#65152D] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#501023] focus:outline-none focus:ring-2 focus:ring-[#65152D]/30 focus:ring-offset-2"
          >
            <Plus size={17} />
            Add Order
          </button>
        </header>

        <section className="rounded-2xl border border-[#E8D9D5] bg-white p-4 shadow-[0_3px_14px_rgba(76,28,43,0.04)] sm:p-5">
          <label className="flex h-12 items-center gap-3 rounded-xl border border-[#E8D9D5] bg-[#FFFCF8] px-3.5 transition focus-within:border-[#65152D] focus-within:ring-2 focus-within:ring-[#65152D]/10">
            <Search size={17} className="shrink-0 text-[#95616E]" />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer, phone, order #, invoice #, cake, flavour, theme..."
              aria-label="Search orders"
              className="min-w-0 flex-1 bg-transparent text-sm text-[#35262A] outline-none placeholder:text-[#A18D90]"
            />
          </label>

          <div className="mt-5">
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#95616E]">
              Date
            </p>

            <div className="flex flex-wrap gap-2">
              {dateFilters.map((filter) => (
                <FilterPill
                  key={filter}
                  active={dateFilter === filter}
                  onClick={() => setDateFilter(filter)}
                >
                  {filter}
                </FilterPill>
              ))}

              {dateFilter === "Custom Date" && (
                <label className="inline-flex items-center gap-2 rounded-full border border-[#E8D9D5] bg-[#FFFCF8] px-3 py-1">
                  <CalendarDays size={15} className="text-[#95616E]" />

                  <input
                    aria-label="Custom order date"
                    type="date"
                    value={customDate}
                    onChange={(event) =>
                      setCustomDate(event.target.value)
                    }
                    className="bg-transparent text-xs text-[#652B3B] outline-none"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="mt-5 border-t border-[#F0E5E1] pt-4">
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#95616E]">
              Quick Filters
            </p>

            <div className="flex flex-wrap gap-2">
              {quickFilters.map((filter) => (
                <FilterPill
                  key={filter}
                  active={activeQuickFilters.includes(filter)}
                  onClick={() => toggleQuickFilter(filter)}
                >
                  {filter}
                </FilterPill>
              ))}
            </div>
          </div>

          <div className="mt-5 border-t border-[#F0E5E1] pt-4">
            <div className="mb-2.5 flex items-center gap-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#95616E]">
                Status
              </p>

              <CircleHelp
                size={13}
                className="text-[#A18D90]"
                aria-label="Filter orders by status"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {statusFilters.map((status) => (
                <FilterPill
                  key={status}
                  active={activeStatus === status}
                  count={statusCounts[status]}
                  onClick={() => setActiveStatus(status)}
                >
                  {status}
                </FilterPill>
              ))}
            </div>
          </div>
        </section>

        {notice && (
          <p
            role="status"
            className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
          >
            {notice}
          </p>
        )}

        {orderError && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {orderError}

            <button
              type="button"
              onClick={loadOrders}
              className="ml-2 font-semibold underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}

        {actionError && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {actionError}
          </p>
        )}

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#E8D9D5] bg-white shadow-[0_3px_14px_rgba(76,28,43,0.04)]">
          {filteredOrders.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] border-collapse">
                <thead>
                  <tr className="border-b border-[#E8D9D5] bg-[#FFFCF8] text-left">
                    {[
                      "Order #",
                      "Customer",
                      "Cake",
                      "Flavour / Theme",
                      "Delivery / Pickup",
                      "Amount",
                      "Status",
                      "Action",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="whitespace-nowrap px-4 py-3.5 text-xs font-bold text-[#78676A]"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order) => {
                    const cancellation = getCancellationInfo(order);
                    const statusGroup = getStatusGroup(order.status);

                    return (
                      <tr
                        key={order.id}
                        className="border-b border-[#F0E5E1] transition-colors last:border-0 hover:bg-[#FFFCF8]"
                      >
                        <td className="px-4 py-4 text-xs font-bold text-[#65152D]">
                          #{order.id}
                        </td>

                        <td className="px-4 py-4 text-sm font-semibold text-[#35262A]">
                          {order.customer}

                          <p className="mt-1 text-xs font-normal text-[#78676A]">
                            {order.phone || "Phone not available"}
                          </p>

                          {order.gstin && (
                            <p className="mt-1 text-[11px] font-normal text-[#78676A]">
                              GSTIN: {order.gstin}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4 text-sm font-medium text-[#35262A]">
                          {order.cake || "Cake"}

                          <p className="mt-1 text-xs font-normal text-[#78676A]">
                            {order.weight || order.size || ""}
                          </p>

                          {order.category && (
                            <p className="mt-1 text-[11px] font-normal text-[#95616E]">
                              {order.category}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4 text-sm text-[#652B3B]">
                          {[
                            order.occasion,
                            order.occasionDate,
                            order.flavour,
                            order.theme || order.customisation?.theme,
                            order.customisation?.nameOnCake
                              ? `Name: ${order.customisation.nameOnCake}`
                              : "",
                            order.customisation?.eggless ? "Eggless" : "",
                            order.customisation?.tiers
                              ? `${order.customisation.tiers} tiers`
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" · ") || "—"}

                          {(
                            order.customisation?.messageOnCake ||
                            order.customisation?.designNotes ||
                            order.customisation?.allergyNotes
                          ) && (
                            <p className="mt-1 max-w-64 whitespace-normal text-[11px] leading-5 text-[#78676A]">
                              {[
                                order.customisation.messageOnCake,
                                order.customisation.designNotes,
                                order.customisation.allergyNotes
                                  ? `Allergy: ${order.customisation.allergyNotes}`
                                  : "",
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4 text-sm text-[#652B3B]">
                          <span className="capitalize">
                            {order.delivery?.method ||
                              (order.delivery?.address
                                ? "delivery"
                                : "pickup")}
                          </span>

                          <p className="mt-1 text-xs text-[#78676A]">
                            {order.deliveryTime || "Date not set"}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-sm font-bold text-[#65152D]">
                          ₹
                          {Number(
                            order.pricing?.total || 0
                          ).toLocaleString("en-IN")}

                          <p className="mt-1 text-[11px] font-normal text-[#78676A]">
                            {order.payment?.method?.toUpperCase() ||
                              "COD"}{" "}
                            · {order.payment?.status || "pending"}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge status={order.status} />

                          {statusGroup === "Cancelled" && (
                            <p className="mt-2 max-w-60 whitespace-normal text-xs leading-5 text-red-800">
                              <span className="font-semibold">
                                {cancellation.sourceLabel}:
                              </span>{" "}
                              {cancellation.reason}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => handleOverride(order)}
                            disabled={busyOrderId === order.id}
                            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#E8D9D5] bg-white px-3 py-2 text-xs font-semibold text-[#65152D] transition hover:border-[#CDAFB7] hover:bg-[#FFF5E9] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Eye size={14} />

                            {busyOrderId === order.id
                              ? "Processing..."
                              : order.cancellation?.decision === "pending"
                                ? "Review Cancellation"
                                : "Override"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-5 py-12 text-center">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF5E9] text-[#65152D]"
                aria-hidden="true"
              >
                <Search size={24} />
              </span>

              <h2 className="mt-4 font-bold text-[#65152D]">
                No {dateFilter === "Upcoming" ? "upcoming " : ""}orders
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-[#78676A]">
                {orders.length
                  ? "No orders match the selected filters. Try changing your search or filters."
                  : "There are no active future orders right now."}
              </p>

              {!orders.length && (
                <button
                  type="button"
                  onClick={() => setShowNewOrder(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#65152D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#501023]"
                >
                  <Plus size={16} />
                  Create a new order
                </button>
              )}
            </div>
          )}
        </section>

        <p className="mt-2 text-center text-[11px] text-[#958186] sm:hidden">
          Swipe horizontally to see all order details
        </p>
      </div>

      {showNewOrder && (
        <ManualOrderDrawer
          onClose={() => setShowNewOrder(false)}
          onCreated={handleOrderCreated}
        />
      )}
    </div>
  );
}

export default OrdersDashboard;
