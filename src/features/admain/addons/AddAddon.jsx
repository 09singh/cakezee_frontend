import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ImagePlus,
  PackagePlus,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createAddon, getCategories } from "../../../api/auth.api";

function AddAddon() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    categoryId: "",
    price: "",
    sortOrder: "0",
    isActive: true,
  });

  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!imagePreview) return undefined;
    return () => URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((response) => {
        const list = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
        if (!cancelled) setCategories(list.filter((item) => item.isActive !== false));
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError?.response?.data?.message || "Could not load categories.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCategories(false);
      });
    return () => { cancelled = true; };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | SLUG
  |--------------------------------------------------------------------------
  */

  const generateSlug = (value) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  /*
  |--------------------------------------------------------------------------
  | NAME
  |--------------------------------------------------------------------------
  */

  const handleNameChange = (event) => {
    const value = event.target.value;

    setForm((previous) => ({
      ...previous,
      name: value,
      slug: generateSlug(value),
    }));

    if (error) {
      setError("");
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FIELD CHANGE
  |--------------------------------------------------------------------------
  */

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Choose a JPG, PNG or WebP image.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Add-on image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  /*
  |--------------------------------------------------------------------------
  | VALIDATION
  |--------------------------------------------------------------------------
  */

  const validateForm = () => {
    if (!form.name.trim()) {
      setError(
        "Add-on name is required."
      );
      return false;
    }

    if (!form.slug.trim()) {
      setError(
        "Add-on slug is required."
      );
      return false;
    }

    if (!form.categoryId) {
      setError(
        "Please select a category."
      );
      return false;
    }

    if (
      form.price === "" ||
      Number(form.price) < 0
    ) {
      setError(
        "Please enter a valid price."
      );
      return false;
    }

    return true;
  };

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting || !validateForm()) {
      return;
    }

    const payload = new FormData();
    payload.append("name", form.name.trim());
    payload.append("slug", form.slug.trim());
    payload.append("description", form.description.trim());
    payload.append("categoryId", form.categoryId);
    payload.append("price", String(Number(form.price)));
    payload.append("sortOrder", String(Number(form.sortOrder) || 0));
    payload.append("isActive", String(form.isActive));
    if (imageFile) payload.append("image", imageFile);

    try {
      setIsSubmitting(true);
      await createAddon(payload);
      navigate("/admin/products");
    } catch (submitError) {
      setError(submitError?.response?.data?.message || "Could not create add-on.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f8f6]">

      <div className="mx-auto max-w-[1000px] px-4 py-5 sm:px-6 lg:px-8">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-6 flex items-center gap-3">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/admin/products"
              )
            }
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-lg
              border
              border-gray-200
              bg-white
              text-gray-600
              transition
              hover:border-gray-300
              hover:bg-gray-50
            "
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>

          <div>

            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Product Management
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Add Add-on
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Create an optional add-on for
              your bakery products.
            </p>

          </div>

        </div>

        {/* =====================================================
            FORM
        ===================================================== */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* ===================================================
              BASIC INFORMATION
          =================================================== */}

          <section className="
            rounded-xl
            border
            border-gray-200
            bg-white
            p-5
            shadow-[0_1px_3px_rgba(0,0,0,0.03)]
            sm:p-6
          ">

            <div className="mb-5">

              <h2 className="text-base font-bold text-gray-900">
                Add-on Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Enter the details customers will
                see when selecting an add-on.
              </p>

            </div>

            <div className="grid gap-5 md:grid-cols-2">

              {/* NAME */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Add-on Name
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={handleNameChange}
                  placeholder="Birthday Candles"
                  maxLength={100}
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-200
                    bg-white
                    px-3.5
                    py-2.5
                    text-sm
                    outline-none
                    transition
                    focus:border-[#a50f3d]
                  "
                />

              </div>

              {/* SLUG */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Slug
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="birthday-candles"
                  maxLength={100}
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-200
                    bg-white
                    px-3.5
                    py-2.5
                    text-sm
                    outline-none
                    transition
                    focus:border-[#a50f3d]
                  "
                />

              </div>

              {/* CATEGORY */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Category
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <select
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleChange}
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-200
                    bg-white
                    px-3.5
                    py-2.5
                    text-sm
                    outline-none
                    transition
                    focus:border-[#a50f3d]
                  "
                >

                  <option value="">
                    Select category
                  </option>

                  {isLoadingCategories ? (
                    <option value="">Loading categories…</option>
                  ) : categories.map((category) => (
                    <option key={category._id} value={category._id}>{category.name}</option>
                  ))}

                </select>

              </div>

              {/* PRICE */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Price
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <div className="relative">

                  <span className="
                    pointer-events-none
                    absolute
                    left-3.5
                    top-1/2
                    -translate-y-1/2
                    text-sm
                    text-gray-400
                  ">
                    ₹
                  </span>

                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="1"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="99"
                    className="
                      w-full
                      rounded-lg
                      border
                      border-gray-200
                      bg-white
                      py-2.5
                      pl-8
                      pr-3.5
                      text-sm
                      outline-none
                      transition
                      focus:border-[#a50f3d]
                    "
                  />

                </div>

              </div>

              {/* DESCRIPTION */}

              <div className="md:col-span-2">

                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  maxLength={500}
                  placeholder="Add a short description of this add-on..."
                  className="
                    w-full
                    resize-none
                    rounded-lg
                    border
                    border-gray-200
                    bg-white
                    px-3.5
                    py-2.5
                    text-sm
                    outline-none
                    transition
                    focus:border-[#a50f3d]
                  "
                />

                <p className="mt-1 text-right text-xs text-gray-400">
                  {form.description.length}/500
                </p>

              </div>

              {/* IMAGE */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Add-on Image
                </label>
                <p className="mb-3 text-xs text-gray-500">
                  JPG, PNG or WebP, up to 5 MB. Customers will see this image beside the add-on.
                </p>
                {imagePreview ? (
                  <div className="relative w-full max-w-xs overflow-hidden rounded-xl border border-gray-200">
                    <img
                      src={imagePreview}
                      alt="Add-on preview"
                      className="aspect-square w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview("");
                      }}
                      aria-label="Remove add-on image"
                      className="absolute right-2 top-2 rounded-full bg-white p-2 text-gray-700 shadow"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex min-h-36 max-w-xs cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 text-sm font-medium text-gray-600 hover:border-[#a50f3d]">
                    <ImagePlus size={24} className="text-[#a50f3d]" />
                    Choose an image
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                  </label>
                )}
              </div>

            </div>

          </section>

          {/* ===================================================
              EXAMPLE
          =================================================== */}

          <section className="
            rounded-xl
            border
            border-[#f0dce2]
            bg-[#fff8fa]
            p-5
            sm:p-6
          ">

            <div className="flex gap-3">

              <div className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-lg
                bg-white
                text-[#a50f3d]
              ">
                <PackagePlus size={20} />
              </div>

              <div>

                <h3 className="text-sm font-bold text-[#7f1235]">
                  Category-based add-ons
                </h3>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  For example, a Birthday category
                  can have Candles ₹49, Caps ₹99,
                  Knife ₹29 and Popper ₹79.
                </p>

              </div>

            </div>

          </section>

          {/* ===================================================
              SETTINGS
          =================================================== */}

          <section className="
            rounded-xl
            border
            border-gray-200
            bg-white
            p-5
            shadow-[0_1px_3px_rgba(0,0,0,0.03)]
            sm:p-6
          ">

            <div className="mb-5">

              <h2 className="text-base font-bold text-gray-900">
                Add-on Settings
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Control visibility and ordering.
              </p>

            </div>

            <div className="grid gap-5 sm:grid-cols-2">

              {/* SORT ORDER */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Sort Order
                </label>

                <input
                  type="number"
                  name="sortOrder"
                  min="0"
                  value={form.sortOrder}
                  onChange={handleChange}
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-200
                    bg-white
                    px-3.5
                    py-2.5
                    text-sm
                    outline-none
                    focus:border-[#a50f3d]
                  "
                />

                <p className="mt-1.5 text-xs text-gray-400">
                  Lower numbers appear first.
                </p>

              </div>

              {/* ACTIVE */}

              <label className="
                flex
                cursor-pointer
                items-center
                justify-between
                rounded-lg
                border
                border-gray-200
                bg-gray-50
                px-4
                py-3
              ">

                <div>

                  <p className="text-sm font-semibold text-gray-700">
                    Active Add-on
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Make this add-on available
                    to customers.
                  </p>

                </div>

                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="
                    h-4
                    w-4
                    accent-[#a50f3d]
                  "
                />

              </label>

            </div>

          </section>

          {/* ===================================================
              ERROR
          =================================================== */}

          {error && (
            <div className="
              rounded-lg
              border
              border-red-200
              bg-red-50
              px-4
              py-3
              text-sm
              text-red-600
            ">
              {error}
            </div>
          )}

          {/* ===================================================
              ACTIONS
          =================================================== */}

          <div className="
            flex
            flex-col-reverse
            gap-3
            sm:flex-row
            sm:justify-end
          ">

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/products"
                )
              }
              className="
                rounded-lg
                border
                border-gray-200
                bg-white
                px-5
                py-2.5
                text-sm
                font-semibold
                text-gray-700
                transition
                hover:bg-gray-50
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              className="
                rounded-lg
                bg-[#a50f3d]
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-[#8d0d35]
                focus:outline-none
                focus:ring-2
                focus:ring-[#a50f3d]/20
              "
            >
              {isSubmitting ? "Creating..." : "Create Add-on"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}

export default AddAddon;
