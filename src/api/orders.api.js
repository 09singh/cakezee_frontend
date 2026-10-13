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

export const recordCodPayment = (orderId, amount, method = "cash") =>
  api.post(`/orders/${encodeURIComponent(orderId)}/payment/collect`, { amount, method })
    .then((response) => response.data.data);

export const recordDeliveryAttempt = (orderId, reason, resolution) =>
  api.post(`/orders/${encodeURIComponent(orderId)}/delivery-attempt`, {
    reason,
    resolution,
  }).then((response) => response.data.data);

export const requestOrderCancellation = (orderId, phone, reason) =>
  api.post(`/orders/${encodeURIComponent(orderId)}/cancellation-request`, {
    phone,
    reason,
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
  const isPaid = String(order.payment?.status || "").toLowerCase() === "paid";
  const isCod = [order.payment?.method, order.customisation?.paymentPreference]
    .some((method) => ["cod", "cash"].includes(String(method || "").toLowerCase()));
  return {
    ...order,
    id: order.orderId,
    channel: order.createdBy?.role === "admin" ? "Admin" : "Website",
    customer: order.customerName || order.phone || "Customer",
    cake: order.productName,
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
    payment: isPaid
      ? "Paid"
      : `${order.customisation?.paymentPreference?.toUpperCase() || (order.payment?.method === "cod" ? "CASH" : order.payment?.method?.toUpperCase() || "COD")} Â· Pending`,
    status: statuses[order.status] || order.status,
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
