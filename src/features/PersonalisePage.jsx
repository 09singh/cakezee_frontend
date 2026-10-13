
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Palette,
  Pencil,
  Cake,
  Plus,
  Check,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import CheckoutSteps from "../components/CheckoutSteps";

import {
  getCheckout,
  updateCheckout,
} from "../utils/checkoutStorage";

import { getCategoryAddons } from "../api/auth.api";

function PersonalisePage() {
  const navigate = useNavigate();

  const checkout = getCheckout();

  const category = checkout?.category;

  /*
   * ------------------------------------------------
   * AVAILABLE ADDONS
   * ------------------------------------------------
   */

  const [availableAddons, setAvailableAddons] = useState(
    []
  );

  useEffect(() => {
    if (!category) return;
    let cancelled = false;
    getCategoryAddons(category)
      .then((response) => {
        const list = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : [];
        if (cancelled) return;
        setAvailableAddons(list.map((addon) => ({
          id: addon._id || addon.id,
          name: addon.name,
          price: addon.price,
          image: addon.image?.url || addon.image || "",
        })));
      })
      .catch((error) => {
        console.error("Failed to load product add-ons:", error);
        if (!cancelled) setAvailableAddons([]);
      });
    return () => { cancelled = true; };
  }, [category]);

  /*
   * ------------------------------------------------
   * PERSONALISATION STATE
   * ------------------------------------------------
   */

  const [form, setForm] = useState(() => ({
    nameOnCake: "",
    colourChange: "",
    addPhoto: "",
    otherRequest: "",
    ...checkout?.customisation,
  }));

  const [referenceImage, setReferenceImage] = useState(
    checkout?.customisation?.referenceImage || ""
  );
  const [imageError, setImageError] = useState("");

  /*
   * ------------------------------------------------
   * SELECTED ADDONS
   * ------------------------------------------------
   */

  const [selectedAddonIds, setSelectedAddonIds] = useState(
    checkout?.addons?.map((item) => item.id) || []
  );

  /*
   * ------------------------------------------------
   * UPDATE PERSONALISATION FIELD
   * ------------------------------------------------
   */

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /*
   * ------------------------------------------------
   * IMAGE UPLOAD
   * ------------------------------------------------
   */

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;
    setImageError("");
    if (!file.type.startsWith("image/")) {
      setImageError("Choose a valid image file.");
      event.target.value = "";
      return;
    }
    if (file.size > 350 * 1024) {
      setImageError("Reference images must be 350 KB or smaller.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === "string") setReferenceImage(reader.result);
    };
    reader.onerror = () => setImageError("The reference image could not be read. Please try another image.");

    reader.readAsDataURL(file);
  };

  /*
   * ------------------------------------------------
   * ADDON TOGGLE
   * ------------------------------------------------
   */

  const toggleAddon = (addon) => {
    setSelectedAddonIds((current) => {
      if (current.includes(addon.id)) {
        return current.filter((id) => id !== addon.id);
      }

      return [...current, addon.id];
    });
  };

  /*
   * ------------------------------------------------
   * SELECTED ADDONS
   * ------------------------------------------------
   */

  const selectedAddons = useMemo(() => {
    return availableAddons.filter((addon) =>
      selectedAddonIds.includes(addon.id)
    );
  }, [availableAddons, selectedAddonIds]);

  /*
   * ------------------------------------------------
   * ADDON TOTAL
   * ------------------------------------------------
   */

  const addonsTotal = useMemo(() => {
    return selectedAddons.reduce(
      (total, addon) =>
        total + Number(addon.price || 0),
      0
    );
  }, [selectedAddons]);

  /*
   * ------------------------------------------------
   * FINAL TOTAL
   * ------------------------------------------------
   */

  const quantity = Number(checkout?.quantity) || 1;
  const cakePrice = Number(checkout?.cakePrice || 0) * quantity;

  const total = cakePrice + addonsTotal * quantity;

  /*
   * ------------------------------------------------
   * CHECKOUT SAFETY
   * ------------------------------------------------
   */

  if (!checkout) {
    return (
      <section className="page-container py-16 text-center">
        <h1 className="text-xl font-semibold">
          Your cake selection has expired
        </h1>

        <button
          onClick={() => navigate("/category/all")}
          className="
            mt-5
            rounded-lg
            bg-[var(--brand)]
            px-5
            py-3
            text-sm
            font-semibold
            text-white
          "
        >
          Browse Cakes
        </button>
      </section>
    );
  }

  /*
   * ------------------------------------------------
   * CONTINUE
   * ------------------------------------------------
   */

  const handleContinue = () => {
    updateCheckout({
      customisation: {
        ...form,
        referenceImage,
      },

      addons: selectedAddons,
    });

    /*
     * No separate addons page anymore.
     * Go directly to delivery.
     */

    navigate("/checkout/delivery");
  };

  /*
   * ------------------------------------------------
   * UI
   * ------------------------------------------------
   */

  return (
    <section className="page-container py-6 md:py-10">
      <div className="mx-auto max-w-xl">

        {/* Checkout Progress */}
        <CheckoutSteps currentStep={2} />

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="
            mt-4
            inline-flex
            items-center
            gap-2
            text-sm
            text-[var(--text-muted)]
          "
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Title */}
        <div className="mt-6">

          <p className="text-xs font-semibold uppercase tracking-[2px] text-[var(--brand)]">
            Small customisations are included ❤️
          </p>

          <h1
            className="mt-2 text-3xl font-semibold"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Make it Yours
          </h1>

          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Tell us how you'd like your cake customised.
          </p>

        </div>

        {/* Cake Preview */}
        <div
          className="
            mt-6
            flex
            items-center
            gap-4
            rounded-xl
            border
            border-[var(--border)]
            bg-white
            p-3
          "
        >

          <img
            src={checkout.productImage}
            alt={checkout.productName}
            loading="lazy"
            decoding="async"
            className="h-16 w-16 rounded-lg object-cover"
          />

          <div className="min-w-0">

            <h2 className="truncate text-sm font-semibold">
              {checkout.productName}
            </h2>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {checkout.size} · {checkout.flavour}
            </p>

            <p className="mt-1 text-sm font-semibold text-[var(--brand)]">
              ₹{checkout.cakePrice}
            </p>

          </div>

        </div>

        {/* =========================================
            PERSONALISATION
        ========================================== */}

        <div
          className="
            mt-6
            overflow-hidden
            rounded-xl
            border
            border-[var(--border)]
            bg-white
          "
        >

          {/* Name on Cake */}
          <div className="border-b border-[var(--border)] p-4">

            <label className="flex items-center gap-3 text-sm font-medium">

              <Cake
                size={17}
                className="text-[var(--brand)]"
              />

              Name on cake

            </label>

            <input
              value={form.nameOnCake}
              onChange={(e) =>
                updateField(
                  "nameOnCake",
                  e.target.value
                )
              }
              placeholder="e.g. Aarav"
              maxLength={30}
              className="
                mt-3
                w-full
                rounded-lg
                border
                border-[var(--border)]
                px-3
                py-3
                text-sm
                outline-none
                focus:border-[var(--brand)]
              "
            />

          </div>

          {/* Colour */}
          <div className="border-b border-[var(--border)] p-4">

            <label className="flex items-center gap-3 text-sm font-medium">

              <Palette
                size={17}
                className="text-[var(--brand)]"
              />

              Colour change

            </label>

            <input
              value={form.colourChange}
              onChange={(e) =>
                updateField(
                  "colourChange",
                  e.target.value
                )
              }
              placeholder="e.g. Make it blue"
              maxLength={50}
              className="
                mt-3
                w-full
                rounded-lg
                border
                border-[var(--border)]
                px-3
                py-3
                text-sm
                outline-none
                focus:border-[var(--brand)]
              "
            />

          </div>

          {/* Small Design */}
          <div className="border-b border-[var(--border)] p-4">

            <label className="flex items-center gap-3 text-sm font-medium">

              <Pencil
                size={17}
                className="text-[var(--brand)]"
              />

              Small design change

            </label>

            <input
              value={form.addPhoto}
              onChange={(e) =>
                updateField(
                  "addPhoto",
                  e.target.value
                )
              }
              placeholder="Describe the small change"
              maxLength={100}
              className="
                mt-3
                w-full
                rounded-lg
                border
                border-[var(--border)]
                px-3
                py-3
                text-sm
                outline-none
                focus:border-[var(--brand)]
              "
            />

          </div>

          {/* Other Request */}
          <div className="p-4">

            <label className="flex items-center gap-3 text-sm font-medium">

              <Plus
                size={17}
                className="text-[var(--brand)]"
              />

              Other request

            </label>

            <textarea
              value={form.otherRequest}
              onChange={(e) =>
                updateField(
                  "otherRequest",
                  e.target.value
                )
              }
              maxLength={200}
              rows={4}
              placeholder="e.g. Make the decoration slightly darker..."
              className="
                mt-3
                w-full
                resize-none
                rounded-lg
                border
                border-[var(--border)]
                px-3
                py-3
                text-sm
                outline-none
                focus:border-[var(--brand)]
              "
            />

            <p className="mt-1 text-right text-xs text-[var(--text-muted)]">
              {form.otherRequest.length}/200
            </p>

          </div>

        </div>

        {/* =========================================
            REFERENCE IMAGE
        ========================================== */}

        <div className="mt-4">
          {imageError && (
            <p role="alert" className="mb-2 text-xs text-red-600">
              {imageError}
            </p>
          )}

          {referenceImage ? (

            <div
              className="
                overflow-hidden
                rounded-xl
                border
                border-[var(--brand)]
                bg-white
              "
            >

              <div className="relative">

                <img
                  src={referenceImage}
                  alt="Cake reference"
                  className="h-56 w-full object-cover"
                />

                <label
                  className="
                    absolute
                    bottom-3
                    right-3
                    flex
                    cursor-pointer
                    items-center
                    gap-2
                    rounded-lg
                    bg-white
                    px-3
                    py-2
                    text-xs
                    font-semibold
                    text-[var(--brand)]
                    shadow-md
                  "
                >

                  <ImagePlus size={15} />

                  Change

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />

                </label>

              </div>

              <div className="px-3 py-2">

                <p className="text-xs font-medium text-[var(--brand)]">
                  ✓ Reference image added
                </p>

              </div>

            </div>

          ) : (

            <label
              className="
                flex
                cursor-pointer
                items-center
                justify-center
                gap-2
                rounded-lg
                border
                border-[var(--brand)]
                bg-white
                px-4
                py-3
                text-sm
                font-semibold
                text-[var(--brand)]
              "
            >

              <ImagePlus size={17} />

              Upload Reference Image

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />

            </label>

          )}

        </div>

        {/* =========================================
            ADD-ONS
        ========================================== */}

        <div className="mt-7">

          <div className="flex items-end justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[1.5px] text-[var(--brand)]">
                Make it extra special
              </p>

              <h2
                className="mt-1 text-xl font-semibold"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Add-ons
              </h2>

            </div>

            {availableAddons.length > 0 && (
              <p className="text-xs text-[var(--text-muted)]">
                Swipe →
              </p>
            )}

          </div>

          {availableAddons.length > 0 ? (

            /*
             * Horizontal scroll
             *
             * Mobile:
             * Swipe left/right
             *
             * Desktop:
             * Horizontal scroll
             */

            <div
              className="
                mt-4
                flex
                gap-3
                overflow-x-auto
                pb-2
                scrollbar-hide
              "
              style={{
                WebkitOverflowScrolling: "touch",
              }}
            >

              {availableAddons.map((addon) => {

                const isSelected =
                  selectedAddonIds.includes(addon.id);

                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() =>
                      toggleAddon(addon)
                    }
                    className={`
                      relative
                      min-w-[145px]
                      max-w-[145px]
                      shrink-0
                      overflow-hidden
                      rounded-xl
                      border
                      bg-white
                      text-left
                      transition
                      active:scale-[0.98]

                      ${
                        isSelected
                          ? "border-[var(--brand)] ring-2 ring-[var(--brand-light)]"
                          : "border-[var(--border)]"
                      }
                    `}
                  >

                    {/* Selected check */}
                    {isSelected && (
                      <div
                        className="
                          absolute
                          right-2
                          top-2
                          z-10
                          flex
                          h-6
                          w-6
                          items-center
                          justify-center
                          rounded-full
                          bg-[var(--brand)]
                          text-white
                        "
                      >
                        <Check size={14} />
                      </div>
                    )}

                    {/* Image */}
                    <div className="aspect-square w-full overflow-hidden bg-gray-100">

                      <img
                        src={addon.image}
                        alt={addon.name}
                        loading="lazy"
                        decoding="async"
                        className="
                          h-full
                          w-full
                          object-cover
                          transition
                          duration-300
                          hover:scale-105
                        "
                      />

                    </div>

                    {/* Content */}
                    <div className="p-3">

                      <p className="truncate text-sm font-semibold">
                        {addon.name}
                      </p>

                      <div className="mt-2 flex items-center justify-between">

                        <span className="text-sm font-semibold text-[var(--brand)]">
                          ₹{addon.price}
                        </span>

                        <span
                          className={`
                            rounded-md
                            px-2
                            py-1
                            text-[11px]
                            font-semibold

                            ${
                              isSelected
                                ? "bg-[var(--brand)] text-white"
                                : "bg-[var(--cream-dark)]"
                            }
                          `}
                        >
                          {isSelected
                            ? "Added"
                            : "Add"}
                        </span>

                      </div>

                    </div>

                  </button>
                );
              })}

            </div>

          ) : (

            <div
              className="
                mt-4
                rounded-xl
                border
                border-[var(--border)]
                bg-white
                p-4
              "
            >
              <p className="text-sm text-[var(--text-muted)]">
                No add-ons available for this cake.
              </p>
            </div>

          )}

          {/* Addon Total */}
          {selectedAddons.length > 0 && (
            <div
              className="
                mt-3
                flex
                items-center
                justify-between
                rounded-lg
                bg-[var(--cream-dark)]
                px-4
                py-3
              "
            >

              <span className="text-sm">
                Add-ons
              </span>

              <span className="font-semibold text-[var(--brand)]">
                + ₹{addonsTotal * quantity}
              </span>

            </div>
          )}

        </div>

        {/* =========================================
            CONTINUE
        ========================================== */}

        <button
          onClick={handleContinue}
          className="
            mt-6
            flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-lg
            bg-[var(--brand)]
            px-5
            py-3.5
            text-sm
            font-semibold
            text-white
            hover:bg-[var(--brand-dark)]
          "
        >

          Continue · ₹{total}

          <ArrowRight size={17} />

        </button>

      </div>
    </section>
  );
}

export default PersonalisePage;
