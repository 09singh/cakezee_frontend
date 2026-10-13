const ORDER_LOOKUPS_KEY = "cakezee_order_lookups";

export function getOrderLookups() {
  try {
    const saved = localStorage.getItem(ORDER_LOOKUPS_KEY);
    const lookups = saved ? JSON.parse(saved) : [];
    return Array.isArray(lookups) ? lookups : [];
  } catch (error) {
    console.error("Failed to read saved order references:", error);
    return [];
  }
}

export function saveOrderLookup(phone, orderId) {
  const lookups = getOrderLookups().filter(
    (item) => item.orderId !== orderId
  );
  lookups.unshift({ phone, orderId });
  try {
    localStorage.setItem(ORDER_LOOKUPS_KEY, JSON.stringify(lookups));
  } catch (error) {
    console.error("Failed to save order reference locally:", error);
  }
  return lookups;
}
