import api from "./axios";

export const getStaffOrders = (params = {}) =>
  api.get("/orders", { params }).then((response) => response.data.data);

export const changeOrderStatus = (orderId, status, version, reason = "") =>
  api.patch(`/orders/${encodeURIComponent(orderId)}/status`, {
    status,
    version,
    reason,
  }).then((response) => response.data.data);

export const overrideOrderStatus = (orderId, status, version, reason) =>
  api.patch(`/orders/${encodeURIComponent(orderId)}/admin-override`, {
    status,
    version,
    reason,
  }).then((response) => response.data.data);

export const updateAdminOrderDetails = (orderId, details) =>
  api.patch(`/orders/${encodeURIComponent(orderId)}/admin-details`, details)
    .then((response) => response.data.data);

export const updateCustomerOrderDetails = (orderId, details) =>
  api.patch(`/orders/${encodeURIComponent(orderId)}/customer-details`, details)
    .then((response) => response.data.data);

export const recordCodPayment = (orderId, amount, method = "cash") =>
  api.post(`/orders/${encodeURIComponent(orderId)}/payment/collect`, { amount, method })
    .then((response) => response.data.data);

export const recordDeliveryAttempt = (orderId, reason, resolution) =>
  api.post(`/orders/${encodeURIComponent(orderId)}/delivery-attempt`, {
    reason,
    resolution,
  }).then((response) => response.data.data);

export const cancelOrder = (orderId, reason) =>
  api.post(`/orders/${encodeURIComponent(orderId)}/cancel`, { reason })
    .then((response) => response.data.data);

export const requestOrderCancellation = (orderId, reason, verification, checkoutId) =>
  api.post(`/orders/${encodeURIComponent(orderId)}/cancellation-request`, {
    reason,
    customerEmail: verification?.email,
    emailVerificationToken: verification?.token,
    checkoutId,
  }, {
    headers: verification?.token
      ? { Authorization: `Bearer ${verification.token}` }
      : undefined,
  }).then((response) => response.data.data);

export const decideOrderCancellation = (orderId, decision, reason = "") =>
  api.patch(`/orders/${encodeURIComponent(orderId)}/cancellation-decision`, {
    decision,
    reason,
  }).then((response) => response.data.data);

export const assignOrderDelivery = (orderId, deliveryUserId) =>
  api.patch(`/orders/${encodeURIComponent(orderId)}/assignment`, {
    deliveryUserId,
  }).then((response) => response.data.data);

export const mapApiOrder = (order) => {
  const statuses = {
    Confirmed: "Pending",
    Preparing: "Preparing",
    "Ready for Delivery": "Ready",
    "Out for Delivery": "Out for Delivery",
    Delivered: "Delivered",
    "Delivery Failed": "Not Delivered",
    "Returned to Bakery": "Returned",
    Cancelled: "Cancelled",
    Rejected: "Rejected",
  };
  const paymentStatus = String(
    order.payment?.status || order.paymentStatus || ""
  ).trim().toLowerCase();
  const isPaid = paymentStatus === "paid";
  const paymentMethod = String(
    order.payment?.method || order.customisation?.paymentPreference || "cod"
  ).toLowerCase();
  const isCod = ["cod", "cash"].includes(paymentMethod);
  const normalizedStatus = String(order.status || "").trim().toLowerCase();
  const status = Object.entries(statuses).find(
    ([apiStatus]) => apiStatus.toLowerCase() === normalizedStatus
  )?.[1] || order.status;
  return {
    ...order,
    id: order.orderId,
    channel: order.source === "pos" || order.createdBy?.role === "manager" ? "POS" : order.createdBy?.role === "admin" ? "Admin" : "Website",
    customer: order.customerName || order.phone || "Customer",
    cake: order.items?.length > 1
      ? order.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")
      : order.productName,
    productImage: order.productImage || order.product?.images?.[0]?.url || "",
    flavour: order.flavour,
    weight: order.productType === "ready_now"
      ? order.size
      : order.weight ? `${order.weight} kg` : order.size,
    deliveryTime: [order.delivery?.date, order.delivery?.time].filter(Boolean).join(" Â· "),
    address: order.delivery?.address || "Store pickup",
    totalAmount: Number(order.pricing?.total || 0),
    amount: `â‚¹${Number(order.pricing?.total || 0).toLocaleString("en-IN")}`,
    isCod,
    isCodPending: isCod && !isPaid,
    isPaymentPending: !isPaid,
    payment: isPaid
      ? "Paid"
      : `${paymentMethod.toUpperCase()} Â· Pending`,
    status,
    notes: [order.occasion ? `Occasion: ${order.occasion}` : "",
      order.occasionDate ? `Occasion date: ${order.occasionDate}` : "",
      order.customisation?.theme, order.customisation?.nameOnCake ? `Name on cake: ${order.customisation.nameOnCake}` : "",
      order.customisation?.eggless ? "Eggless" : "",
      order.customisation?.tiers ? `${order.customisation.tiers} tiers` : "",
      order.customisation?.messageOnCake, order.customisation?.designNotes,
      order.customisation?.hasAllergy ? `Allergy: ${order.customisation.allergyNotes || "not specified"}` : "",
      order.customisation?.otherRequest].filter(Boolean).join(" Â· ") || "No special instructions",
  };
};
