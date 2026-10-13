
import { useEffect, useState } from "react";
import {
  Package,
  Tags,
  Plus,
  RefreshCw,
  Trash2,
  Power,
  Puzzle,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getAdminProducts,
  getAdminAddons,
  getAdminCategories,
  deactivateProduct,
  activateProduct,
  deactivateCategory,
  activateCategory,
  removeProduct,
  removeCategory,
  removeAddon,
} from "../../../api/auth.api";

/* ================= FETCH MANAGEMENT DATA ================= */

const fetchManagementLists = async () => {
  const [addonResponse, categoryResponse] = await Promise.all([
    getAdminAddons(),
    getAdminCategories(),
  ]);

  const allProducts = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const productResponse = await getAdminProducts({
      page,
      limit: 50,
    });

    allProducts.push(
      ...(Array.isArray(productResponse?.data)
        ? productResponse.data
        : [])
    );

    hasNextPage = Boolean(
      productResponse?.pagination?.hasNext
    );

    page += 1;
  }

  return {
    products: allProducts,
    addons: Array.isArray(addonResponse?.data)
      ? addonResponse.data
      : [],
    categories: Array.isArray(categoryResponse?.data)
      ? categoryResponse.data
      : [],
  };
};

/* ================= PRODUCT MANAGEMENT ================= */

function ProductManagement() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addons, setAddons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [activeTab, setActiveTab] = useState("products");

  const managementCards = [
    {
      title: "Add Product",
      description:
        "Create cakes and other products with pricing, flavours, sizes and images.",
      icon: Package,
      action: "Add Product",
      path: "/admin/products/add",
    },
    {
      title: "Add Category",
      description:
        "Create and manage product categories for your store.",
      icon: Tags,
      action: "Add Category",
      path: "/admin/products/categories/add",
    },
    {
      title: "Add Add-on",
      description:
        "Create category-based add-ons such as candles, caps, knives and poppers.",
      icon: Plus,
      action: "Add Add-on",
      path: "/admin/products/addons/add",
    },
    {
      title: "Ready Now",
      description:
        "Add ready-to-order cakes, desserts, pastries and combos.",
      icon: Zap,
      action: "Manage Ready Now",
      path: "/admin/ready-now",
    },
  ];

  /* ================= LOAD DATA ================= */

  const loadProducts = async () => {
    try {
      const lists = await fetchManagementLists();

      setError("");
      setProducts(lists.products);
      setAddons(lists.addons);
      setCategories(lists.categories);
    } catch (loadError) {
      console.error("Failed to load products:", loadError);

      setError(
        loadError?.response?.data?.message ||
          "Failed to load products."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    fetchManagementLists()
      .then((lists) => {
        if (cancelled) return;

        setError("");
        setProducts(lists.products);
        setAddons(lists.addons);
        setCategories(lists.categories);
      })
      .catch((loadError) => {
        if (cancelled) return;

        console.error(
          "Failed to load products:",
          loadError
        );

        setError(
          loadError?.response?.data?.message ||
            "Failed to load products."
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshProducts = () => {
    setLoading(true);
    loadProducts();
  };

  /* ================= CATEGORY HELPERS ================= */

  const getCategoryName = (product) => {
    const category =
      product?.categoryId ??
      product?.category ??
      product?.category_id;

    if (category && typeof category === "object") {
      return (
        category.name ||
        category.title ||
        "Uncategorized"
      );
    }

    if (typeof category === "string") {
      const matchedCategory = categories.find(
        (item) =>
          String(item._id) === category ||
          item.slug === category
      );

      if (matchedCategory) {
        return matchedCategory.name || "Uncategorized";
      }

      // If the API provides a category name instead of an ID.
      const looksLikeObjectId = /^[a-f\d]{24}$/i.test(category);

      return looksLikeObjectId
        ? "Uncategorized"
        : category;
    }

    return "Uncategorized";
  };

  const categoryName = (addon) => {
    const category = addon?.categoryId ?? addon?.category;

    if (category && typeof category === "object") {
      return category.name || category.title || "Category";
    }

    if (category) {
      return (
        categories.find(
          (item) => String(item._id) === String(category)
        )?.name || "Category"
      );
    }

    return "Category";
  };

  /* ================= PRODUCT ACTIONS ================= */

  const changeProductStatus = async (product) => {
    setUpdatingId(product._id);
    setError("");

    try {
      if (product.isActive) {
        await deactivateProduct(product._id);
      } else {
        await activateProduct(product._id);
      }

      setProducts((items) =>
        items.map((item) =>
          item._id === product._id
            ? {
                ...item,
                isActive: !product.isActive,
              }
            : item
        )
      );
    } catch (actionError) {
      setError(
        actionError?.response?.data?.message ||
          "Could not update product status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteProduct = async (product) => {
    if (
      !window.confirm(
        `Permanently remove product "${product.name}"?`
      )
    ) {
      return;
    }

    setUpdatingId(product._id);
    setError("");

    try {
      await removeProduct(product._id);

      setProducts((items) =>
        items.filter((item) => item._id !== product._id)
      );
    } catch (actionError) {
      setError(
        actionError?.response?.data?.message ||
          "Could not remove product."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  /* ================= ADD-ON ACTION ================= */

  const deleteAddon = async (addon) => {
    if (
      !window.confirm(
        `Remove add-on "${addon.name}"?`
      )
    ) {
      return;
    }

    setUpdatingId(addon._id);
    setError("");

    try {
      await removeAddon(addon._id);

      setAddons((items) =>
        items.filter((item) => item._id !== addon._id)
      );
    } catch (actionError) {
      setError(
        actionError?.response?.data?.message ||
          "Could not remove add-on."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  /* ================= CATEGORY ACTIONS ================= */

  const changeCategoryStatus = async (category) => {
    setUpdatingId(category._id);
    setError("");

    try {
      if (category.isActive) {
        await deactivateCategory(category._id);
      } else {
        await activateCategory(category._id);
      }

      setCategories((items) =>
        items.map((item) =>
          item._id === category._id
            ? {
                ...item,
                isActive: !category.isActive,
              }
            : item
        )
      );
    } catch (actionError) {
      setError(
        actionError?.response?.data?.message ||
          "Could not update category status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteCategory = async (category) => {
    if (
      !window.confirm(
        `Permanently remove category "${category.name}"? Categories used by products cannot be removed.`
      )
    ) {
      return;
    }

    setUpdatingId(category._id);
    setError("");

    try {
      await removeCategory(category._id);

      setCategories((items) =>
        items.filter((item) => item._id !== category._id)
      );
    } catch (actionError) {
      setError(
        actionError?.response?.data?.message ||
          "Could not remove category."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  /* ================= RENDER ================= */

  const tabs = [
    {
      id: "products",
      label: "Products",
      icon: Package,
      count: products.length,
    },
    {
      id: "categories",
      label: "Categories",
      icon: Tags,
      count: categories.length,
    },
    {
      id: "addons",
      label: "Add-ons",
      icon: Puzzle,
      count: addons.length,
    },
    {
      id: "readyNow",
      label: "Ready Now",
      icon: Zap,
      count: null,
      path: "/admin/ready-now",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <div className="mx-auto max-w-[1500px] p-4 sm:p-5 lg:p-6">

        {/* HEADER */}

        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Product Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#1f1f1f] sm:text-3xl">
            Products
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Add products and add-ons, then manage or remove them here.
          </p>
        </div>

        {/* TABS */}

        <div
          className="mb-5 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Product management sections"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() =>
                  tab.path
                    ? navigate(tab.path)
                    : setActiveTab(tab.id)
                }
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                  selected
                    ? "border-[#a50f3d] bg-[#a50f3d] text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-[#d9b4c0]"
                }`}
              >
                <Icon size={16} />
                {tab.label}

                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    selected ? "bg-white/20" : "bg-gray-100"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* MAIN PANEL */}

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">

          {/* PANEL HEADER */}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {activeTab === "products"
                  ? "Manage Products"
                  : activeTab === "categories"
                    ? "Manage Categories"
                    : "Manage Add-ons"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {activeTab === "products"
                  ? "Manage products shown in your customer store."
                  : activeTab === "categories"
                    ? "Manage the product categories available in your store."
                    : "Manage optional add-ons shown during product personalisation."}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    activeTab === "products"
                      ? managementCards[0].path
                      : activeTab === "categories"
                        ? managementCards[1].path
                        : managementCards[2].path
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#a50f3d] px-3.5 py-2 text-sm font-semibold text-white"
              >
                <Plus size={15} />
                Add{" "}
                {activeTab === "products"
                  ? "product"
                  : activeTab === "categories"
                    ? "category"
                    : "add-on"}
              </button>

              <button
                type="button"
                onClick={refreshProducts}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={15}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>

          {/* ERROR */}

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          {/* LOADING */}

          {loading ? (
            <div className="mt-6 flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-[#fcfcfb]">
              <div className="text-center">
                <RefreshCw
                  size={24}
                  className="mx-auto animate-spin text-gray-300"
                />
                <p className="mt-3 text-sm text-gray-500">
                  Loading products...
                </p>
              </div>
            </div>
          ) : activeTab === "products" && products.length === 0 ? (
            <div className="mt-6 flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-[#fcfcfb]">
              <div className="text-center">
                <Package
                  size={28}
                  strokeWidth={1.5}
                  className="mx-auto text-gray-300"
                />

                <p className="mt-3 text-sm font-medium text-gray-500">
                  No products to display yet
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Add your first product to get started.
                </p>
              </div>
            </div>
          ) : activeTab === "products" ? (

            /* PRODUCTS TABLE */

            <div className="mt-6 overflow-x-auto rounded-lg border border-gray-100">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Product
                    </th>

                    {/* NEW CATEGORY COLUMN */}

                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Category
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Slug
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Flavours
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Sizes
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Status
                    </th>

                    <th className="px-4 py-3 text-right font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr
                      key={product._id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {product.name || "Unnamed product"}
                      </td>

                      {/* CATEGORY VALUE */}

                      <td className="px-4 py-3 text-gray-600">
                        <span className="inline-flex rounded-full bg-[#f8f0f3] px-2.5 py-1 text-xs font-medium text-[#9c173d]">
                          {getCategoryName(product)}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-gray-500">
                        {product.slug || "—"}
                      </td>

                      <td className="px-4 py-3 text-gray-500">
                        {product.flavours?.length || 0}
                      </td>

                      <td className="px-4 py-3 text-gray-500">
                        {product.sizes?.length || 0}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            product.isActive
                              ? "bg-green-50 text-green-600"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            disabled={updatingId === product._id}
                            onClick={() =>
                              changeProductStatus(product)
                            }
                            className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50"
                          >
                            <Power size={14} />
                            {product.isActive
                              ? "Deactivate"
                              : "Activate"}
                          </button>

                          <button
                            type="button"
                            disabled={updatingId === product._id}
                            onClick={() => deleteProduct(product)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {/* CATEGORIES TABLE */}

          {!loading && activeTab === "categories" && (
            categories.length === 0 ? (
              <p className="mt-6 rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
                No categories yet. Add one to organize your products.
              </p>
            ) : (
              <div className="mt-6 overflow-x-auto rounded-lg border border-gray-100">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">
                        Slug
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {categories.map((category) => (
                      <tr
                        key={category._id}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 font-medium">
                          {category.name}
                        </td>

                        <td className="px-4 py-3 text-gray-500">
                          {category.slug}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              category.isActive
                                ? "bg-green-50 text-green-600"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {category.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              type="button"
                              disabled={updatingId === category._id}
                              onClick={() =>
                                changeCategoryStatus(category)
                              }
                              className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50"
                            >
                              <Power size={14} />
                              {category.isActive
                                ? "Deactivate"
                                : "Activate"}
                            </button>

                            <button
                              type="button"
                              disabled={updatingId === category._id}
                              onClick={() => deleteCategory(category)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2 size={14} />
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* ADD-ONS TABLE */}

          {!loading && activeTab === "addons" && (
            addons.length === 0 ? (
              <p className="mt-6 rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
                No add-ons yet. Add one to make it available in personalisation.
              </p>
            ) : (
              <div className="mt-6 overflow-x-auto rounded-lg border border-gray-100">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">
                        Add-on
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">
                        Price
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {addons.map((addon) => (
                      <tr
                        key={addon._id}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 font-medium">
                          {addon.name}
                        </td>

                        <td className="px-4 py-3">
                          {categoryName(addon)}
                        </td>

                        <td className="px-4 py-3">
                          ₹{addon.price}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            disabled={updatingId === addon._id}
                            onClick={() => deleteAddon(addon)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </section>
      </div>
    </div>
  );
}

export default ProductManagement;
