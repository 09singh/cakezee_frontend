import api from "./axios";

/*
|--------------------------------------------------------------------------
| Customer Authentication
|--------------------------------------------------------------------------
*/

/**
 * Request OTP for customer login
 * POST /api/v1/auth/customer/request-otp
 */
export const requestCustomerOtp = async (phone) => {
  const response = await api.post(
    "/auth/customer/request-otp",
    { phone }
  );

  return response.data;
};

/**
 * Verify customer OTP
 * POST /api/v1/auth/customer/verify-otp
 */
export const verifyCustomerOtp = async (phone, otp) => {
  const response = await api.post(
    "/auth/customer/verify-otp",
    { phone, otp }
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Staff Authentication
|--------------------------------------------------------------------------
*/

/**
 * Staff login
 * POST /api/v1/auth/staff/login
 */
export const staffLogin = async (email, password) => {
  const response = await api.post(
    "/auth/staff/login",
    {
      email,
      password,
    }
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Current User
|--------------------------------------------------------------------------
*/

/**
 * Get currently authenticated user
 * GET /api/v1/auth/me
 */
export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");

  return response.data;
};

export const getAdminCustomers = async (params = {}) => {
  const response = await api.get("/auth/admin/customers", { params });
  return response.data;
};

export const createAdminCustomer = async (customer) => {
  const response = await api.post("/auth/admin/customers", customer);
  return response.data;
};

export const importAdminCustomers = async (customers) => {
  const response = await api.post("/auth/admin/customers/bulk", { customers });
  return response.data;
};

export const getAdminCustomerOrders = async (phone) => {
  const response = await api.get(`/auth/admin/customers/${encodeURIComponent(phone)}/orders`);
  return response.data;
};

/*
|--------------------------------------------------------------------------
| Logout
|--------------------------------------------------------------------------
*/

/**
 * Logout authenticated user
 * POST /api/v1/auth/logout
 */
export const logout = async () => {
  const response = await api.post("/auth/logout");

  return response.data;
};

/*
|--------------------------------------------------------------------------
| PRODUCTS - CUSTOMER
|--------------------------------------------------------------------------
*/

/**
 * Get active customer products
 * GET /api/v1/products
 */
export const getProducts = async (params = {}) => {
  const response = await api.get("/products", {
    params,
  });

  return response.data;
};

/**
 * Get customer product by ID
 * GET /api/v1/products/:id
 */
export const getProductById = async (id) => {
  const response = await api.get(
    `/products/${id}`
  );

  return response.data;
};

/**
 * Get customer product by slug
 * GET /api/v1/products/slug/:slug
 */
export const getProductBySlug = async (slug) => {
  const response = await api.get(
    `/products/slug/${slug}`
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| PRODUCTS - ADMIN
|--------------------------------------------------------------------------
*/

/**
 * Get admin products
 * GET /api/v1/products/admin
 *
 * Requires:
 * - Authentication
 * - admin role
 */
export const getAdminProducts = async (params = {}) => {
  const response = await api.get(
    "/products/admin",
    {
      params,
    }
  );

  return response.data;
};

export const getReadyNowProducts = async (params = {}) => {
  const response = await api.get("/products/ready-now", { params });
  return response.data;
};

export const getAdminReadyNowProducts = async () => {
  const response = await api.get("/products/admin/ready-now");
  return response.data;
};

export const createAdminReadyNowProduct = async (formData) => {
  const response = await api.post("/products/admin/ready-now", formData, { timeout: 120000 });
  return response.data;
};

/**
 * Create product
 * POST /api/v1/products/admin
 *
 * Requires:
 * - Authentication
 * - admin role
 */
export const createProduct = async (productData) => {
  const response = await api.post(
    "/products/admin",
    productData,
    { timeout: 120000 }
  );

  return response.data;
};

/**
 * Update product
 * PATCH /api/v1/products/admin/:id
 */
export const updateProduct = async (
  id,
  productData
) => {
  const response = await api.patch(
    `/products/admin/${id}`,
    productData
  );

  return response.data;
};

/**
 * Deactivate product
 * PATCH /api/v1/products/admin/:id/deactivate
 */
export const deactivateProduct = async (id) => {
  const response = await api.patch(
    `/products/admin/${id}/deactivate`
  );

  return response.data;
};

/**
 * Activate product
 * PATCH /api/v1/products/admin/:id/activate
 */
export const activateProduct = async (id) => {
  const response = await api.patch(
    `/products/admin/${id}/activate`
  );
 
  return response.data;
};

/*
|--------------------------------------------------------------------------
| CATEGORIES - CUSTOMER
|--------------------------------------------------------------------------
*/

/**
 * Get active categories
 * GET /api/v1/categories
 */
export const getCategories = async () => {
  const response = await api.get(
    "/categories"
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| CATEGORIES - ADMIN
|--------------------------------------------------------------------------
*/

/**
 * Create category
 * POST /api/v1/categories/admin
 *
 * Requires:
 * - Authentication
 * - admin role
 */
export const createCategory = async (
  categoryData
) => {
  const response = await api.post(
    "/categories/admin",
    categoryData
  );

  return response.data;
};



export const getAdminCategories = async () => {
  const response = await api.get("/categories/admin");
  return response.data;
};

export const deactivateCategory = async (id) => {
  const response = await api.patch(
    `/categories/admin/${id}/deactivate`
  );
  return response.data;
};

export const activateCategory = async (id) => {
  const response = await api.patch(
    `/categories/admin/${id}/activate`
  );
  return response.data;
};

export const removeProduct = async (id) => {
  const response = await api.delete(`/products/admin/${id}`);
  return response.data;
};

export const removeCategory = async (id) => {
  const response = await api.delete(`/categories/admin/${id}`);
  return response.data;
};

export const getAdminAddons = async () => {
  const response = await api.get("/addons/admin");
  return response.data;
};

export const getCategoryAddons = async (categorySlug) => {
  const response = await api.get("/addons", {
    params: { categorySlug },
  });
  return response.data;
};

export const createGuestOrder = async (orderData) => {
  const checkoutId = orderData?.checkoutId;
  const response = await api.post("/orders", orderData, {
    // The backend must enforce this key with a unique constraint or an
    // equivalent atomic idempotency check. Reusing checkoutId makes retries safe.
    headers: checkoutId ? { "Idempotency-Key": checkoutId } : undefined,
  });
  return response.data;
};

export const createAdminOrder = async (orderData) => {
  const checkoutId = orderData?.checkoutId;
  const response = await api.post("/orders/admin", orderData, {
    headers: checkoutId ? { "Idempotency-Key": checkoutId } : undefined,
  });
  return response.data;
};

export const getGuestOrder = async (phone, orderId) => {
  const response = await api.get("/orders/lookup", {
    params: { phone, orderId },
  });
  return response.data;
};

export const createAddon = async (addonData) => {
  const response = await api.post("/addons/admin", addonData, {
    timeout: 120000,
  });
  return response.data;
};

export const removeAddon = async (id) => {
  const response = await api.delete(`/addons/admin/${id}`);
  return response.data;
};
