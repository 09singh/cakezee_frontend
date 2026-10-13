import api from "../../../api/axios";

/*
|--------------------------------------------------------------------------
| PRODUCT API
|--------------------------------------------------------------------------
| All product/category/add-on requests stay here.
| UI components should not directly handle Axios requests.
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| PRODUCTS
|--------------------------------------------------------------------------
*/

/**
 * Get products for admin.
 *
 * Later we can add:
 * - page
 * - limit
 * - search
 * - categoryId
 * - isActive
 */
export const getProducts = async (params = {}) => {
  const response = await api.get(
    "/products/admin",
    {
      params,
    }
  );

  return response.data;
};

/**
 * Get single product.
 */
export const getProductById = async (id) => {
  const response = await api.get(
    `/products/${id}`
  );

  return response.data;
};

/**
 * Create product.
 *
 * FormData requests include JSON product data and image files.
 */
export const createProduct = async (
  productData
) => {
  const response = await api.post(
    "/products/admin",
    productData,
    { timeout: 120000 }
  );

  return response.data;
};

/**
 * Update product.
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
 * Delete/deactivate product.
 *
 * Prefer soft-delete/deactivation on backend.
 */
export const deleteProduct = async (id) => {
  const response = await api.delete(
    `/products/admin/${id}`
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| CATEGORIES
|--------------------------------------------------------------------------
*/

/**
 * Get every category for admin management.
 */
export const getCategories = async () => {
  const response = await api.get(
    "/categories/admin"
  );

  return response.data;
};

/**
 * Create category.
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

/**
 * Permanently remove a category.
 */
export const deleteCategory = async (id) => {
  const response = await api.delete(
    `/categories/admin/${id}`
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| ADD-ONS
|--------------------------------------------------------------------------
*/

/**
 * Get all add-ons for admin management.
 */
export const getAddons = async () => {
  const response = await api.get(
    "/addons/admin"
  );

  return response.data;
};

/**
 * Create add-on.
 */
export const createAddon = async (
  addonData
) => {
  const response = await api.post(
    "/addons/admin",
    addonData,
    { timeout: 120000 }
  );

  return response.data;
};

/**
 * Delete/deactivate add-on.
 */
export const deleteAddon = async (id) => {
  const response = await api.delete(
    `/addons/admin/${id}`
  );

  return response.data;
};