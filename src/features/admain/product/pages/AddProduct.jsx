import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ImagePlus,
  Plus,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getCategories } from "../../../../api/auth.api";
import { createProduct } from "../product.api";

const INITIAL_SIZE = {
  name: "",
  value: "",
  unit: "kg",
};

const INITIAL_FLAVOUR = {
  name: "",
  basePrice: "",
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#a50f3d]";

const labelClass =
  "mb-2 block text-sm font-semibold text-gray-700";

const fetchActiveCategories = async () => {
  const response = await getCategories();
  const possibleLists = [
    response,
    response?.categories,
    response?.data,
    response?.data?.categories,
    response?.data?.data,
    response?.data?.data?.categories,
  ];
  const list = possibleLists.find((item) => Array.isArray(item));
  if (!list) throw new Error("The categories API returned an unexpected response.");
  return list.filter(
    (category) =>
      category &&
      category._id &&
      category.name &&
      category.isActive !== false
  );
};

function AddProduct() {
  const navigate = useNavigate();
  const imageRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    categoryId: "",
    badge: "",
    baseWeight: "0.5",
    currency: "INR",
    isActive: true,
    sortOrder: "0",
  });

  const [sizes, setSizes] = useState([
    { name: "0.5 Kg", value: "0.5", unit: "kg" },
    { name: "1 Kg", value: "1", unit: "kg" },
  ]);

  const [flavours, setFlavours] = useState([
    { ...INITIAL_FLAVOUR },
  ]);

  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});

  const [isLoadingCategories, setIsLoadingCategories] =
    useState(true);
  const [categoryLoadError, setCategoryLoadError] =
    useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | CATEGORY LOADING
  |--------------------------------------------------------------------------
  */

  const loadCategories = async () => {
    try {
      const activeCategories = await fetchActiveCategories();

      setCategoryLoadError("");
      setCategories(activeCategories);

      // Clear a selection if it no longer exists.
      setForm((previous) => ({
        ...previous,
        categoryId: activeCategories.some(
          (category) =>
            String(category._id) === previous.categoryId
        )
          ? previous.categoryId
          : "",
      }));

      if (activeCategories.length === 0) {
        setCategoryLoadError(
          "No active categories found. Create or activate a category first."
        );
      }
    } catch (error) {
      console.error("Failed to load categories:", error);

      setCategories([]);
      setCategoryLoadError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load categories. Check your API URL and backend."
      );
    } finally {
      setIsLoadingCategories(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetchActiveCategories()
      .then((activeCategories) => {
        if (cancelled) return;
        setCategoryLoadError(
          activeCategories.length
            ? ""
            : "No active categories found. Create or activate a category first."
        );
        setCategories(activeCategories);
        setForm((previous) => ({
          ...previous,
          categoryId: activeCategories.some(
            (category) => String(category._id) === previous.categoryId
          )
            ? previous.categoryId
            : "",
        }));
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to load categories:", error);
          setCategories([]);
          setCategoryLoadError(
            error?.response?.data?.message ||
              error?.message ||
              "Unable to load categories. Check your API URL and backend."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCategories(false);
      });
    return () => { cancelled = true; };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CLEAN UP IMAGE PREVIEWS WHEN COMPONENT UNMOUNTS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    imageRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imageRef.current.forEach((image) => {
        if (image?.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | SLUG
  |--------------------------------------------------------------------------
  */

  const generateSlug = (value) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  /*
  |--------------------------------------------------------------------------
  | FIELD HANDLERS
  |--------------------------------------------------------------------------
  */

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
      server: "",
    }));
  };

  const handleNameChange = (event) => {
    const value = event.target.value;

    setForm((previous) => ({
      ...previous,
      name: value,
      // Update the slug automatically while typing the name.
      slug: generateSlug(value),
    }));

    setErrors((previous) => ({
      ...previous,
      name: "",
      slug: "",
      server: "",
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | SIZE HANDLERS
  |--------------------------------------------------------------------------
  */

  const updateSize = (index, field, value) => {
    setSizes((previous) =>
      previous.map((size, sizeIndex) =>
        sizeIndex === index
          ? { ...size, [field]: value }
          : size
      )
    );

    setErrors((previous) => ({
      ...previous,
      sizes: "",
      server: "",
    }));
  };

  const addSize = () => {
    setSizes((previous) => [
      ...previous,
      { ...INITIAL_SIZE },
    ]);
  };

  const removeSize = (index) => {
    if (sizes.length <= 1) return;

    setSizes((previous) =>
      previous.filter((_, i) => i !== index)
    );
  };

  /*
  |--------------------------------------------------------------------------
  | FLAVOUR HANDLERS
  |--------------------------------------------------------------------------
  */

  const updateFlavour = (index, field, value) => {
    setFlavours((previous) =>
      previous.map((flavour, flavourIndex) =>
        flavourIndex === index
          ? { ...flavour, [field]: value }
          : flavour
      )
    );

    setErrors((previous) => ({
      ...previous,
      flavours: "",
      server: "",
    }));
  };

  const addFlavour = () => {
    setFlavours((previous) => [
      ...previous,
      { ...INITIAL_FLAVOUR },
    ]);
  };

  const removeFlavour = (index) => {
    if (flavours.length <= 1) return;

    setFlavours((previous) =>
      previous.filter((_, i) => i !== index)
    );
  };

  /*
  |--------------------------------------------------------------------------
  | IMAGE PREVIEWS
  |--------------------------------------------------------------------------
  |
  | Keep the original files for the multipart product upload.
  |--------------------------------------------------------------------------
  */

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(
      event.target.files || []
    );

    if (!selectedFiles.length) return;

    const allowedFiles = [];
    const rejectedFiles = [];

    selectedFiles.forEach((file) => {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        rejectedFiles.push(file.name);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        rejectedFiles.push(`${file.name} (over 5 MB)`);
        return;
      }

      allowedFiles.push(file);
    });

    const remainingImageSlots = Math.max(0, 10 - images.length);
    if (allowedFiles.length > remainingImageSlots) {
      rejectedFiles.push(
        ...allowedFiles.slice(remainingImageSlots).map((file) => file.name)
      );
    }
    const acceptedFiles = allowedFiles.slice(0, remainingImageSlots);

    if (rejectedFiles.length) {
      setErrors((previous) => ({
        ...previous,
        image:
          `These files were skipped: ${rejectedFiles.join(", ")}. ` +
          "Select up to 10 JPG, PNG or WebP images, up to 5 MB each.",
      }));
    } else {
      setErrors((previous) => ({
        ...previous,
        image: "",
      }));
    }

    const imagePreviews = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));

    setImages((previous) => [
      ...previous,
      ...imagePreviews,
    ]);

    event.target.value = "";
  };

  const removeImage = (index) => {
    setImages((previous) => {
      const image = previous[index];

      if (image?.preview) {
        URL.revokeObjectURL(image.preview);
      }

      return previous.filter((_, i) => i !== index);
    });
  };

  /*
  |--------------------------------------------------------------------------
  | VALIDATION
  |--------------------------------------------------------------------------
  */

  const validateForm = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Product name is required.";
    }

    if (!form.slug.trim()) {
      nextErrors.slug = "Product slug is required.";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) {
      nextErrors.slug =
        "Use lowercase letters, numbers and hyphens in the slug.";
    }

    if (!form.categoryId) {
      nextErrors.categoryId = "Please select a category.";
    } else if (
      !categories.some(
        (category) =>
          String(category._id) === form.categoryId
      )
    ) {
      nextErrors.categoryId =
        "Select a valid active category.";
    }

    if (
      !form.baseWeight ||
      !Number.isFinite(Number(form.baseWeight)) ||
      Number(form.baseWeight) <= 0
    ) {
      nextErrors.baseWeight =
        "Base weight must be greater than 0.";
    }

    const validSizes = sizes.filter(
      (size) =>
        size.name.trim() &&
        Number.isFinite(Number(size.value)) &&
        Number(size.value) > 0 &&
        ["kg", "g"].includes(size.unit)
    );

    if (!validSizes.length) {
      nextErrors.sizes =
        "Add at least one valid size.";
    }

    const validFlavours = flavours.filter(
      (flavour) =>
        flavour.name.trim() &&
        flavour.basePrice !== "" &&
        Number.isFinite(Number(flavour.basePrice)) &&
        Number(flavour.basePrice) >= 0
    );

    if (!validFlavours.length) {
      nextErrors.flavours =
        "Add at least one flavour with a valid price.";
    }

    const duplicateSizeNames = validSizes
      .map((size) => size.name.trim().toLowerCase())
      .filter(
        (name, index, all) => all.indexOf(name) !== index
      );

    if (duplicateSizeNames.length) {
      nextErrors.sizes =
        "Size names must be unique.";
    }

    const duplicateFlavours = validFlavours
      .map((flavour) => flavour.name.trim().toLowerCase())
      .filter(
        (name, index, all) => all.indexOf(name) !== index
      );

    if (duplicateFlavours.length) {
      nextErrors.flavours =
        "Flavour names must be unique.";
    }

    if (
      form.sortOrder === "" ||
      !Number.isFinite(Number(form.sortOrder)) ||
      Number(form.sortOrder) < 0
    ) {
      nextErrors.sortOrder =
        "Sort order must be zero or greater.";
    }

    setErrors((previous) => ({
      ...previous,
      ...nextErrors,
      server: "",
    }));

    return Object.keys(nextErrors).length === 0;
  };

  /* Product payload without browser-only image preview URLs. */

  const payloadPreview = useMemo(
    () => ({
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      categoryId: form.categoryId,

      images: [],

      sizes: sizes
        .filter(
          (size) =>
            size.name.trim() &&
            Number(size.value) > 0
        )
        .map((size) => ({
          name: size.name.trim(),
          value: Number(size.value),
          unit: size.unit,
        })),

      flavours: flavours
        .filter(
          (flavour) =>
            flavour.name.trim() &&
            flavour.basePrice !== "" &&
            Number.isFinite(Number(flavour.basePrice)) &&
            Number(flavour.basePrice) >= 0
        )
        .map((flavour) => ({
          name: flavour.name.trim(),
          basePrice: Number(flavour.basePrice),
        })),

      pricing: {
        baseWeight: Number(form.baseWeight),
        weightUnit: "kg",
        currency: form.currency,
      },

      badge: form.badge.trim() || null,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder),
    }),
    [form, sizes, flavours]
  );

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    if (isLoadingCategories) {
      setErrors((previous) => ({
        ...previous,
        server: "Wait for categories to finish loading.",
      }));
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    setErrors((previous) => ({
      ...previous,
      server: "",
    }));

    try {
      const formData = new FormData();
      formData.append("product", JSON.stringify(payloadPreview));
      images.forEach(({ file }) => formData.append("images", file));
      await createProduct(formData);

      navigate("/admin/products");
    } catch (error) {
      console.error("Product creation failed:", error);

      const responseData = error?.response?.data;

      let message =
        responseData?.message ||
        error?.message ||
        "Failed to create product. Please try again.";

      if (Array.isArray(responseData?.errors)) {
        message = responseData.errors
          .map((item) =>
            typeof item === "string"
              ? item
              : item?.message || JSON.stringify(item)
          )
          .join(" ");
      } else if (
        responseData?.errors &&
        typeof responseData.errors === "object"
      ) {
        message = Object.entries(responseData.errors)
          .map(([field, value]) => {
            const detail =
              typeof value === "string"
                ? value
                : value?.message || JSON.stringify(value);

            return `${field}: ${detail}`;
          })
          .join(" ");
      }

      setErrors((previous) => ({
        ...previous,
        server: message,
      }));
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
      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">
        {/* HEADER */}

        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-gray-300 hover:bg-gray-50"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Product Management
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
              Add Product
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Create a new product for your bakery catalogue.
            </p>
          </div>
        </div>

        {/* SERVER ERROR */}

        {errors.server && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {errors.server}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* BASIC INFORMATION */}

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] sm:p-6">
            <div className="mb-5">
              <h2 className="text-base font-bold text-gray-900">
                Basic Information
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Basic information customers will see about this product.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {/* NAME */}

              <div>
                <label className={labelClass}>
                  Product Name <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={handleNameChange}
                  placeholder="Chocolate Truffle Cake"
                  maxLength={150}
                  className={`${inputClass} ${
                    errors.name ? "border-red-400" : ""
                  }`}
                />

                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* SLUG */}

              <div>
                <label className={labelClass}>
                  Slug <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="chocolate-truffle-cake"
                  maxLength={180}
                  className={`${inputClass} ${
                    errors.slug ? "border-red-400" : ""
                  }`}
                />

                {errors.slug && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.slug}
                  </p>
                )}
              </div>

              {/* CATEGORY DROPDOWN */}

              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Category <span className="text-red-500">*</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setIsLoadingCategories(true);
                      setCategoryLoadError("");
                      loadCategories();
                    }}
                    disabled={isLoadingCategories}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#a50f3d] hover:underline disabled:opacity-50"
                  >
                    <RefreshCw
                      size={12}
                      className={
                        isLoadingCategories ? "animate-spin" : ""
                      }
                    />
                    Refresh
                  </button>
                </div>

                <select
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleChange}
                  disabled={
                    isLoadingCategories ||
                    categories.length === 0
                  }
                  className={`${inputClass} ${
                    errors.categoryId ? "border-red-400" : ""
                  } disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500`}
                >
                  <option value="">
                    {isLoadingCategories
                      ? "Loading categories..."
                      : categories.length
                        ? "Select a category"
                        : "No active categories available"}
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category._id}
                      value={String(category._id)}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>

                {errors.categoryId && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.categoryId}
                  </p>
                )}

                {categoryLoadError && (
                  <div className="mt-2 rounded-md bg-amber-50 p-2.5 text-xs leading-5 text-amber-800">
                    {categoryLoadError}
                  </div>
                )}

                {!categoryLoadError &&
                  !isLoadingCategories &&
                  categories.length > 0 && (
                    <p className="mt-1.5 text-xs text-gray-400">
                      Select the category in which this product belongs.
                    </p>
                  )}
              </div>

              {/* BADGE */}

              <div>
                <label className={labelClass}>Badge</label>

                <input
                  type="text"
                  name="badge"
                  value={form.badge}
                  onChange={handleChange}
                  placeholder="Popular"
                  maxLength={50}
                  className={inputClass}
                />
              </div>

              {/* DESCRIPTION */}

              <div className="md:col-span-2">
                <label className={labelClass}>Description</label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  maxLength={2000}
                  placeholder="Describe the cake..."
                  className={`${inputClass} resize-y`}
                />

                <p className="mt-1 text-right text-xs text-gray-400">
                  {form.description.length}/2000
                </p>
              </div>
            </div>
          </section>

          {/* PRODUCT IMAGES */}

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] sm:p-6">
            <div className="mb-5">
              <h2 className="text-base font-bold text-gray-900">
                Product Images
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Preview images locally. Uploading them to the server is not
                connected yet.
              </p>
            </div>

            {errors.image && (
              <p className="mb-3 text-xs text-red-500">
                {errors.image}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {images.map((image, index) => (
                <div
                  key={`${image.name}-${index}`}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                >
                  <img
                    src={image.preview}
                    alt={image.name}
                    className="h-full w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label={`Remove ${image.name}`}
                  >
                    <Trash2 size={14} />
                  </button>

                  <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-2 py-1 text-xs text-white">
                    {image.name}
                  </span>
                </div>
              ))}

              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-400 transition hover:border-[#a50f3d] hover:bg-[#fff8fa] hover:text-[#a50f3d]">
                <ImagePlus size={24} />

                <span className="mt-2 text-xs font-medium">
                  Add Image
                </span>

                <span className="mt-1 text-[10px]">
                  Max 5 MB each
                </span>

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            {images.length > 0 && (
              <p className="mt-3 text-xs text-amber-700">
                These previews are not saved with the product yet.
                Connect the image-upload API before expecting them to
                appear in the customer catalogue.
              </p>
            )}
          </section>

          {/* CAKE SIZES */}

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Cake Sizes
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Define the available cake weights.
                </p>
              </div>

              <button
                type="button"
                onClick={addSize}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
              >
                <Plus size={16} />
                Add Size
              </button>
            </div>

            {errors.sizes && (
              <p className="mb-4 text-xs text-red-500">
                {errors.sizes}
              </p>
            )}

            <div className="space-y-3">
              {sizes.map((size, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 sm:grid-cols-[1fr_160px_120px_auto]"
                >
                  <input
                    type="text"
                    value={size.name}
                    onChange={(event) =>
                      updateSize(index, "name", event.target.value)
                    }
                    placeholder="1 Kg"
                    aria-label={`Size ${index + 1} name`}
                    className={inputClass}
                  />

                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={size.value}
                    onChange={(event) =>
                      updateSize(index, "value", event.target.value)
                    }
                    placeholder="1"
                    aria-label={`Size ${index + 1} value`}
                    className={inputClass}
                  />

                  <select
                    value={size.unit}
                    onChange={(event) =>
                      updateSize(index, "unit", event.target.value)
                    }
                    aria-label={`Size ${index + 1} unit`}
                    className={inputClass}
                  >
                    <option value="kg">Kg</option>
                    <option value="g">Gram</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => removeSize(index)}
                    disabled={sizes.length <= 1}
                    className="flex h-10 items-center justify-center rounded-lg px-3 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Remove size"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* FLAVOURS AND PRICING */}

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Flavours & Pricing
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Set the price for each flavour at the base weight.
                </p>
              </div>

              <button
                type="button"
                onClick={addFlavour}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
              >
                <Plus size={16} />
                Add Flavour
              </button>
            </div>

            {errors.flavours && (
              <p className="mb-4 text-xs text-red-500">
                {errors.flavours}
              </p>
            )}

            {/* BASE WEIGHT */}

            <div className="mb-5 max-w-sm">
              <label className={labelClass}>
                Base Weight <span className="text-red-500">*</span>
              </label>

              <div className="flex">
                <input
                  type="number"
                  name="baseWeight"
                  min="0.1"
                  step="0.1"
                  value={form.baseWeight}
                  onChange={handleChange}
                  className={`min-w-0 flex-1 rounded-l-lg border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#a50f3d] ${
                    errors.baseWeight
                      ? "border-red-400"
                      : "border-gray-200"
                  }`}
                />

                <div className="flex items-center rounded-r-lg border border-l-0 border-gray-200 bg-gray-50 px-4 text-sm font-medium text-gray-500">
                  Kg
                </div>
              </div>

              {errors.baseWeight && (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.baseWeight}
                </p>
              )}

              <p className="mt-1.5 text-xs text-gray-400">
                Example: 0.5 means each flavour price is for 0.5 kg.
              </p>
            </div>

            {/* FLAVOUR ROWS */}

            <div className="space-y-3">
              {flavours.map((flavour, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 sm:grid-cols-[1fr_180px_auto]"
                >
                  <input
                    type="text"
                    value={flavour.name}
                    onChange={(event) =>
                      updateFlavour(index, "name", event.target.value)
                    }
                    placeholder="Chocolate"
                    aria-label={`Flavour ${index + 1} name`}
                    className={inputClass}
                  />

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      ₹
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={flavour.basePrice}
                      onChange={(event) =>
                        updateFlavour(
                          index,
                          "basePrice",
                          event.target.value
                        )
                      }
                      placeholder="250"
                      aria-label={`Flavour ${index + 1} base price`}
                      className={`${inputClass} pl-8`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFlavour(index)}
                    disabled={flavours.length <= 1}
                    className="flex h-10 items-center justify-center rounded-lg px-3 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Remove flavour"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>

            {/* PRICING EXPLANATION */}

            <div className="mt-5 rounded-lg border border-[#f0dce2] bg-[#fff8fa] p-4">
              <p className="text-sm font-semibold text-[#7f1235]">
                Pricing calculation
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                If Chocolate costs ₹250 for 0.5 kg, the proportional
                prices are ₹500 for 1 kg, ₹750 for 1.5 kg, and ₹1,000
                for 2 kg. This is an example; your backend and customer
                product page must implement the same pricing rule.
              </p>
            </div>
          </section>

          {/* PRODUCT SETTINGS */}

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] sm:p-6">
            <div className="mb-5">
              <h2 className="text-base font-bold text-gray-900">
                Product Settings
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Control product visibility and ordering.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Sort Order</label>

                <input
                  type="number"
                  name="sortOrder"
                  min="0"
                  step="1"
                  value={form.sortOrder}
                  onChange={handleChange}
                  className={inputClass}
                />

                {errors.sortOrder && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.sortOrder}
                  </p>
                )}

                <p className="mt-1.5 text-xs text-gray-400">
                  Lower numbers appear first.
                </p>
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    Active Product
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Show this product to customers.
                  </p>
                </div>

                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 accent-[#a50f3d]"
                />
              </label>
            </div>
          </section>

          {/* ACTIONS */}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                isLoadingCategories ||
                categories.length === 0
              }
              className="rounded-lg bg-[#a50f3d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#8d0d35] focus:outline-none focus:ring-2 focus:ring-[#a50f3d]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Creating..."
                : isLoadingCategories
                  ? "Loading Categories..."
                  : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProduct;
