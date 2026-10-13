const CHECKOUT_KEY = "cakezee_checkout";

export const createCheckoutId = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    return (character === "x" ? random : (random & 0x3) | 0x8).toString(16);
  });

export const getCheckout = () => {
  try {
    const data = sessionStorage.getItem(CHECKOUT_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to read checkout:", error);
    return null;
  }
};

export const saveCheckout = (data) => {
  try {
    sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save checkout:", error);
  }
};

export const updateCheckout = (updates) => {
  const current = getCheckout() || {};

  const updated = {
    ...current,
    ...updates,
  };

  saveCheckout(updated);

  return updated;
};

export const clearCheckout = () => {
  sessionStorage.removeItem(CHECKOUT_KEY);
};