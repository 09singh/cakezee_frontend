
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  RefreshCw,
  Search,
  FolderOpen,
  Image as ImageIcon,
  Power,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getAdminCategories,
  deactivateCategory,
  activateCategory,
  removeCategory,
} from "../../../api/auth.api";

function ManageCategories() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getAdminCategories();

      // The API helper returns response.data, whose shape is
      // { success, data: [...] } for category endpoints.
      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : response?.data?.data;

      if (!Array.isArray(list)) {
        throw new Error("Invalid categories response from server.");
      }

      setCategories(list);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Categories load nahi ho paayi."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleStatusChange = async (category) => {
    const isActive = category.isActive;

    const confirmed = window.confirm(
      isActive
        ? `Kya tum "${category.name}" category deactivate karna chahte ho?`
        : `Kya tum "${category.name}" category activate karna chahte ho?`
    );

    if (!confirmed) return;

    setUpdatingId(category._id);
    setError("");
    setSuccess("");

    try {
      if (isActive) {
        await deactivateCategory(category._id);
      } else {
        await activateCategory(category._id);
      }

      setCategories((previous) =>
        previous.map((item) =>
          item._id === category._id
            ? { ...item, isActive: !isActive }
            : item
        )
      );

      setSuccess(
        `"${category.name}" category ${
          isActive ? "deactivate" : "activate"
        } ho gayi.`
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Category ka status update nahi ho paaya."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (category) => {
    const confirmed = window.confirm(
      `Permanently remove "${category.name}"? Categories used by products cannot be removed.`
    );
    if (!confirmed) return;

    setUpdatingId(category._id);
    setError("");
    setSuccess("");
    try {
      await removeCategory(category._id);
      setCategories((previous) => previous.filter((item) => item._id !== category._id));
      setSuccess(`"${category.name}" category removed.`);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Category could not be removed."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredCategories = categories.filter((category) => {
    const searchText = search.trim().toLowerCase();

    const matchesSearch =
      category.name?.toLowerCase().includes(searchText) ||
      category.slug?.toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && category.isActive) ||
      (statusFilter === "inactive" && !category.isActive);

    return matchesSearch && matchesStatus;
  });

  const activeCount = categories.filter(
    (category) => category.isActive
  ).length;

  const inactiveCount = categories.length - activeCount;

  return (
    <div className="min-h-screen bg-[#f8f7f4] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
            >
              <ArrowLeft size={17} />
              Go back
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4e4dc] text-[#a65c40]">
                <FolderOpen size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Manage Categories
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your Cakezee product categories.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/products/categories/add")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#a50f3d] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#8d0d35]"
            >
              <Plus size={16} />
              Add category
            </button>
            <button
              type="button"
              onClick={loadCategories}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Status messages */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <div className="flex-1">{error}</div>
            <button
              type="button"
              onClick={() => setError("")}
              className="font-bold"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
            <div className="flex-1">{success}</div>
            <button
              type="button"
              onClick={() => setSuccess("")}
              className="font-bold"
              aria-label="Dismiss success"
            >
              ×
            </button>
          </div>
        )}

        {/* Summary cards */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Categories
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {categories.length}
            </p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Active Categories
            </p>
            <p className="mt-2 text-3xl font-bold text-green-700">
              {activeCount}
            </p>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Inactive Categories
            </p>
            <p className="mt-2 text-3xl font-bold text-orange-600">
              {inactiveCount}
            </p>
          </div>
        </div>

        {/* Listing */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-bold text-gray-900">
                  All Categories
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Activate or deactivate categories when required.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search categories..."
                    className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#b87352] focus:ring-2 focus:ring-[#b87352]/10 sm:w-64"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b87352]"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active only</option>
                  <option value="inactive">Inactive only</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-8">
              <RefreshCw
                size={28}
                className="animate-spin text-[#b87352]"
              />
              <p className="text-sm text-gray-500">
                Loading categories...
              </p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <FolderOpen size={27} />
              </div>
              <h3 className="font-semibold text-gray-900">
                No categories found
              </h3>
              <p className="mt-1 max-w-sm text-sm text-gray-500">
                {categories.length === 0
                  ? "Abhi koi category available nahi hai."
                  : "Search ya status filter change karke dekho."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Category</th>
                      <th className="px-5 py-4 font-semibold">Slug</th>
                      <th className="px-5 py-4 font-semibold">Sort Order</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 text-right font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {filteredCategories.map((category) => (
                      <tr
                        key={category._id}
                        className="transition hover:bg-gray-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {category.image?.url ? (
                              <img
                                src={category.image.url}
                                alt={category.image.alt || category.name}
                                className="h-12 w-12 rounded-xl border border-gray-100 object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                                <ImageIcon size={21} />
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900">
                                {category.name}
                              </p>
                              <p className="mt-1 max-w-xs truncate text-xs text-gray-500">
                                {category.description || "No description"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {category.slug || "—"}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {category.sortOrder ?? 0}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge isActive={category.isActive} />
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <StatusButton
                              category={category}
                              updatingId={updatingId}
                              onClick={handleStatusChange}
                            />
                            <button
                              type="button"
                              disabled={updatingId === category._id}
                              onClick={() => handleRemove(category)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                              aria-label={`Remove ${category.name}`}
                            >
                              <Trash2 size={14} /> Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 p-4 md:hidden">
                {filteredCategories.map((category) => (
                  <div
                    key={category._id}
                    className="rounded-xl border border-gray-100 p-4"
                  >
                    <div className="flex items-start gap-3">
                      {category.image?.url ? (
                        <img
                          src={category.image.url}
                          alt={category.image.alt || category.name}
                          className="h-14 w-14 shrink-0 rounded-xl object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                          <ImageIcon size={22} />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="break-words font-semibold text-gray-900">
                          {category.name}
                        </p>
                        <p className="mt-1 break-all text-xs text-gray-500">
                          {category.slug}
                        </p>
                        <div className="mt-2">
                          <StatusBadge isActive={category.isActive} />
                        </div>
                      </div>
                    </div>

                    {category.description && (
                      <p className="mt-3 text-sm text-gray-600">
                        {category.description}
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                      <span className="text-xs text-gray-500">
                        Sort order: {category.sortOrder ?? 0}
                      </span>
                      <div className="flex gap-2">
                        <StatusButton
                          category={category}
                          updatingId={updatingId}
                          onClick={handleStatusChange}
                        />
                        <button
                          type="button"
                          disabled={updatingId === category._id}
                          onClick={() => handleRemove(category)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="border-t border-gray-100 px-5 py-4 text-xs text-gray-500">
            Showing {filteredCategories.length} of {categories.length} categories
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ isActive }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        isActive
          ? "bg-green-50 text-green-700"
          : "bg-orange-50 text-orange-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isActive ? "bg-green-500" : "bg-orange-500"
        }`}
      />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function StatusButton({ category, updatingId, onClick }) {
  const isUpdating = updatingId === category._id;

  return (
    <button
      type="button"
      disabled={isUpdating}
      onClick={() => onClick(category)}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        category.isActive
          ? "border border-red-200 bg-white text-red-600 hover:bg-red-50"
          : "bg-green-600 text-white hover:bg-green-700"
      }`}
    >
      {isUpdating ? (
        <RefreshCw size={14} className="animate-spin" />
      ) : (
        <Power size={14} />
      )}
      {isUpdating
        ? "Updating..."
        : category.isActive
        ? "Deactivate"
        : "Activate"}
    </button>
  );
}

export default ManageCategories;
