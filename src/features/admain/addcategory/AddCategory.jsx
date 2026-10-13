import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ImagePlus,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { createCategory } from "../../../api/auth.api";

function AddCategory() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    sortOrder: "0",
    isActive: true,
  });

  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | CLEANUP OBJECT URL
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    return () => {
      if (image?.preview) {
        URL.revokeObjectURL(image.preview);
      }
    };
  }, [image?.preview]);

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

    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | OTHER FIELDS
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

    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | IMAGE SELECT
  |--------------------------------------------------------------------------
  */

  const handleImageChange = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Only PNG, JPG or WebP images are allowed."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Image size must be less than 5MB."
      );

      event.target.value = "";
      return;
    }

    /*
     * Remove old preview URL
     */

    if (image?.preview) {
      URL.revokeObjectURL(
        image.preview
      );
    }

    const preview =
      URL.createObjectURL(file);

    setImage({
      file,
      preview,
      name: file.name,
      size: file.size,
      type: file.type,
    });

    setError("");

    event.target.value = "";
  };

  /*
  |--------------------------------------------------------------------------
  | REMOVE IMAGE
  |--------------------------------------------------------------------------
  */

  const removeImage = () => {
    if (image?.preview) {
      URL.revokeObjectURL(
        image.preview
      );
    }

    setImage(null);
    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | VALIDATION
  |--------------------------------------------------------------------------
  */

  const validateForm = () => {
    if (!form.name.trim()) {
      setError(
        "Category name is required."
      );
      return false;
    }

    if (form.name.trim().length < 2) {
      setError(
        "Category name must be at least 2 characters."
      );
      return false;
    }

    if (!form.slug.trim()) {
      setError(
        "Category slug is required."
      );
      return false;
    }

    if (form.slug.trim().length < 2) {
      setError(
        "Category slug must be at least 2 characters."
      );
      return false;
    }

    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
        form.slug.trim()
      )
    ) {
      setError(
        "Slug can contain only lowercase letters, numbers and hyphens."
      );
      return false;
    }

    /*
     * Image is optional here.
     *
     * If you want image to be mandatory,
     * uncomment this:
     *
     * if (!image?.file) {
     *   setError("Category image is required.");
     *   return false;
     * }
     */

    return true;
  };

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError("");

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      /*
       * IMPORTANT
       *
       * We are sending FormData because
       * image.file is a real File object.
       */

      const formData = new FormData();

      formData.append(
        "name",
        form.name.trim()
      );

      formData.append(
        "slug",
        form.slug.trim()
      );

      formData.append(
        "description",
        form.description.trim()
      );

      formData.append(
        "isActive",
        String(form.isActive)
      );

      formData.append(
        "sortOrder",
        String(
          Number(form.sortOrder) || 0
        )
      );

      /*
       * Actual image file
       */

      if (image?.file) {
        formData.append(
          "image",
          image.file
        );
      }

      /*
       * Send to backend
       */
      await createCategory(formData);

      /*
       * Success
       */

      navigate(
        "/admin/products/categories"
      );
    } catch (error) {
      const message =
        error?.response?.data
          ?.message ||
        error?.response?.data
          ?.errors?.[0] ||
        "Failed to create category. Please try again.";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <div
        className="
          mx-auto
          max-w-[1000px]
          px-4
          py-5
          sm:px-6
          lg:px-8
        "
      >

        {/* ============================================================ */}
        {/* HEADER */}
        {/* ============================================================ */}

        <div className="mb-6 flex items-center gap-3">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/admin/products"
              )
            }
            disabled={isSubmitting}
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
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <p
              className="
                text-xs
                font-medium
                uppercase
                tracking-wide
                text-gray-400
              "
            >
              Product Management
            </p>

            <h1
              className="
                mt-1
                text-2xl
                font-bold
                tracking-tight
                text-gray-900
                sm:text-3xl
              "
            >
              Add Category
            </h1>

            <p
              className="
                mt-1
                text-sm
                text-gray-500
              "
            >
              Create a category for your
              bakery products.
            </p>
          </div>

        </div>

        {/* ============================================================ */}
        {/* FORM */}
        {/* ============================================================ */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* ======================================================== */}
          {/* BASIC INFORMATION */}
          {/* ======================================================== */}

          <section
            className="
              rounded-xl
              border
              border-gray-200
              bg-white
              p-5
              shadow-[0_1px_3px_rgba(0,0,0,0.03)]
              sm:p-6
            "
          >

            <div className="mb-5">
              <h2
                className="
                  text-base
                  font-bold
                  text-gray-900
                "
              >
                Category Information
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  text-gray-500
                "
              >
                Add the basic information
                for this category.
              </p>
            </div>

            <div
              className="
                grid
                gap-5
                md:grid-cols-2
              "
            >

              {/* NAME */}

              <div>
                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-semibold
                    text-gray-700
                  "
                >
                  Category Name

                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={handleNameChange}
                  placeholder="Birthday Cakes"
                  maxLength={100}
                  disabled={isSubmitting}
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
                    disabled:cursor-not-allowed
                    disabled:bg-gray-50
                  "
                />
              </div>

              {/* SLUG */}

              <div>
                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-semibold
                    text-gray-700
                  "
                >
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
                  placeholder="birthday-cakes"
                  maxLength={120}
                  disabled={isSubmitting}
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
                    disabled:cursor-not-allowed
                    disabled:bg-gray-50
                  "
                />

                <p
                  className="
                    mt-1.5
                    text-xs
                    text-gray-400
                  "
                >
                  Used in category URLs.
                </p>
              </div>

              {/* DESCRIPTION */}

              <div className="md:col-span-2">

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-semibold
                    text-gray-700
                  "
                >
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  maxLength={500}
                  disabled={isSubmitting}
                  placeholder="Cakes for birthdays and special celebrations..."
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
                    disabled:cursor-not-allowed
                    disabled:bg-gray-50
                  "
                />

                <p
                  className="
                    mt-1
                    text-right
                    text-xs
                    text-gray-400
                  "
                >
                  {form.description.length}/500
                </p>

              </div>

            </div>

          </section>

          {/* ======================================================== */}
          {/* CATEGORY IMAGE */}
          {/* ======================================================== */}

          <section
            className="
              rounded-xl
              border
              border-gray-200
              bg-white
              p-5
              shadow-[0_1px_3px_rgba(0,0,0,0.03)]
              sm:p-6
            "
          >

            <div className="mb-5">

              <h2
                className="
                  text-base
                  font-bold
                  text-gray-900
                "
              >
                Category Image
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  text-gray-500
                "
              >
                Add an image that represents
                this category.
              </p>

            </div>

            {!image ? (

              <label
                className="
                  flex
                  min-h-[220px]
                  cursor-pointer
                  flex-col
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-dashed
                  border-gray-300
                  bg-gray-50
                  text-gray-400
                  transition
                  hover:border-[#a50f3d]
                  hover:bg-[#fff8fa]
                  hover:text-[#a50f3d]
                "
              >

                <div
                  className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-full
                    bg-white
                    shadow-sm
                  "
                >
                  <ImagePlus size={22} />
                </div>

                <p
                  className="
                    mt-3
                    text-sm
                    font-semibold
                  "
                >
                  Upload category image
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    text-gray-400
                  "
                >
                  PNG, JPG or WebP • Max 5MB
                </p>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                  className="hidden"
                />

              </label>

            ) : (

              <div
                className="
                  max-w-sm
                  overflow-hidden
                  rounded-xl
                  border
                  border-gray-200
                  bg-gray-50
                "
              >

                <div className="relative">

                  <img
                    src={image.preview}
                    alt={
                      form.name ||
                      "Category"
                    }
                    className="
                      aspect-video
                      w-full
                      object-cover
                    "
                  />

                  <button
                    type="button"
                    onClick={removeImage}
                    disabled={isSubmitting}
                    className="
                      absolute
                      right-3
                      top-3
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-full
                      bg-black/70
                      text-white
                      transition
                      hover:bg-black/90
                      disabled:cursor-not-allowed
                    "
                    aria-label="Remove image"
                  >
                    <X size={16} />
                  </button>

                </div>

                <div className="px-4 py-3">

                  <p
                    className="
                      truncate
                      text-sm
                      font-semibold
                      text-gray-800
                    "
                  >
                    {image.name}
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-gray-400
                    "
                  >
                    {(
                      image.size /
                      1024 /
                      1024
                    ).toFixed(2)}
                    {" "}
                    MB
                  </p>

                </div>

              </div>

            )}

          </section>

          {/* ======================================================== */}
          {/* SETTINGS */}
          {/* ======================================================== */}

          <section
            className="
              rounded-xl
              border
              border-gray-200
              bg-white
              p-5
              shadow-[0_1px_3px_rgba(0,0,0,0.03)]
              sm:p-6
            "
          >

            <div className="mb-5">

              <h2
                className="
                  text-base
                  font-bold
                  text-gray-900
                "
              >
                Category Settings
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  text-gray-500
                "
              >
                Control visibility and
                ordering.
              </p>

            </div>

            <div
              className="
                grid
                gap-5
                sm:grid-cols-2
              "
            >

              {/* SORT ORDER */}

              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-semibold
                    text-gray-700
                  "
                >
                  Sort Order
                </label>

                <input
                  type="number"
                  name="sortOrder"
                  min="0"
                  value={form.sortOrder}
                  onChange={handleChange}
                  disabled={isSubmitting}
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
                    disabled:cursor-not-allowed
                    disabled:bg-gray-50
                  "
                />

                <p
                  className="
                    mt-1.5
                    text-xs
                    text-gray-400
                  "
                >
                  Lower numbers appear first.
                </p>

              </div>

              {/* ACTIVE */}

              <label
                className="
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
                "
              >

                <div>

                  <p
                    className="
                      text-sm
                      font-semibold
                      text-gray-700
                    "
                  >
                    Active Category
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-gray-400
                    "
                  >
                    Show this category to
                    customers.
                  </p>

                </div>

                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="
                    h-4
                    w-4
                    accent-[#a50f3d]
                  "
                />

              </label>

            </div>

          </section>

          {/* ======================================================== */}
          {/* ERROR */}
          {/* ======================================================== */}

          {error && (
            <div
              className="
                rounded-lg
                border
                border-red-200
                bg-red-50
                px-4
                py-3
                text-sm
                text-red-600
              "
            >
              {error}
            </div>
          )}

          {/* ======================================================== */}
          {/* ACTIONS */}
          {/* ======================================================== */}

          <div
            className="
              flex
              flex-col-reverse
              gap-3
              sm:flex-row
              sm:justify-end
            "
          >

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/products"
                )
              }
              disabled={isSubmitting}
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
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
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
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {isSubmitting
                ? "Creating..."
                : "Create Category"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}

export default AddCategory;
