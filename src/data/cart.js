const CART_KEY = "cakezee_cart";

export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cakezee:cart-updated"));
  return cart;
}

export function addToCart(item) {
  const cart = getCart();

  const existingIndex = cart.findIndex(
    (cartItem) => cartItem.key === item.key
  );

  if (existingIndex !== -1) {
    const updatedCart = [...cart];

    updatedCart[existingIndex] = {
      ...updatedCart[existingIndex],
      quantity:
        updatedCart[existingIndex].quantity + item.quantity,
    };

    return saveCart(updatedCart);
  }

  return saveCart([...cart, item]);
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
}

export function removeCartItem(key) {
  return saveCart(getCart().filter((item) => item.key !== key));
}
