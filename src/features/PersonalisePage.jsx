
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Palette,
  Pencil,
  Cake,
  Plus,
  Check,
  ChevronDown,
  MessageSquare,
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

  // Available add-ons
  const [availableAddons, setAvailableAddons] = useState([]);

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

        setAvailableAddons(
          list.map((addon) => ({
            id: addon._id || addon.id,
            name: addon.name,
            price: addon.price,
            image: addon.image?.url || addon.image || "",
          }))
        );
      })
      .catch((error) => {
        console.error("Failed to load product add-ons:", error);

        if (!cancelled) {
          setAvailableAddons([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [category]);

  // Personalisation state
  const [form, setForm] = useState(() => ({
    nameOnCake: "",
    messageOnCake: "",
    colourChange: "",
    addPhoto: "",
    otherRequest: "",
    ...checkout?.customisation,
  }));

  const [referenceImage, setReferenceImage] = useState(
    checkout?.customisation?.referenceImage || ""
  );

  const [imageError, setImageError] = useState("");

  // Dropdown states
  const [openSections, setOpenSections] = useState({
    colourChange: false,
    designChange: false,
    referenceImage: false,
    otherRequest: false,
  });

  const toggleSection = (section) => {
    setOpenSections((previous) => ({
      ...previous,
      [section]: !previous[section],
    }));
  };

  // Selected add-ons
  const [selectedAddonIds, setSelectedAddonIds] = useState(
    checkout?.addons?.map((item) => item.id) || []
  );

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // Reference image upload
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
      if (typeof reader.result === "string") {
        setReferenceImage(reader.result);
      }
    };

    reader.onerror = () => {
      setImageError(
        "The reference image could not be read. Please try another image."
      );
    };

    reader.readAsDataURL(file);
  };

  // Toggle add-on selection
  const toggleAddon = (addon) => {
    setSelectedAddonIds((current) => {
      if (current.includes(addon.id)) {
        return current.filter((id) => id !== addon.id);
      }

      return [...current, addon.id];
    });
  };

  const selectedAddons = useMemo(() => {
    return availableAddons.filter((addon) =>
      selectedAddonIds.includes(addon.id)
    );
  }, [availableAddons, selectedAddonIds]);

  const addonsTotal = useMemo(() => {
    return selectedAddons.reduce(
      (total, addon) => total + Number(addon.price || 0),
      0
    );
  }, [selectedAddons]);

  // Final price
  const quantity = Number(checkout?.quantity) || 1;
  const cakePrice = Number(checkout?.cakePrice || 0) * quantity;
  const total = cakePrice + addonsTotal * quantity;

  // Checkout safety
  if (!checkout) {
    return (
      <section className="page-container py-16 text-center">
        <h1 className="text-xl font-semibold">
          Your cake selection has expired
        </h1>

        <button
          onClick={() => navigate("/category/all")}
          className="mt-5 rounded-lg bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white"
        >
          Browse Cakes
        </button>
      </section>
    );
  }

  // Save customisation and continue
  const handleContinue = () => {
    updateCheckout({
      customisation: {
        ...form,
        referenceImage,
      },
      addons: selectedAddons,
    });

    navigate("/checkout/delivery");
  };

  // Reusable dropdown header
  const DropdownHeader = ({
    section,
    icon: Icon,
    title,
    subtitle,
  }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      aria-expanded={openSections[section]}
      className="flex w-full items-center justify-between gap-3 p-4 text-left"
    >
      <span className="flex min-w-0 items-center gap-3">
        <Icon
          size={17}
          className="shrink-0 text-[var(--brand)]"
        />

        <span className="min-w-0">
          <span className="block text-sm font-medium">
            {title}
          </span>

          {subtitle && (
            <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
              {subtitle}
            </span>
          )}
        </span>
      </span>

      <ChevronDown
        size={17}
        className={`shrink-0 transition-transform duration-200 ${
          openSections[section] ? "rotate-180" : ""
        }`}
      />
    </button>
  );

  return (
    <section className="page-container px-4 pt-5 pb-36 md:pt-8 md:pb-36">
      <div className="mx-auto max-w-xl">
        {/* Checkout progress */}
        <CheckoutSteps currentStep={2} />

        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--text-muted)]"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Page title */}
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[1.5px] text-[var(--brand)]">
            Small customisations are included ❤️
          </p>

          <h1
            className="mt-2 text-3xl font-semibold"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Make it Yours
          </h1>

          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Tell us how you&apos;d like your cake customised.
          </p>
        </div>

        {/* Cake preview */}
        <div className="mt-5 flex items-center gap-4 rounded-xl border border-[var(--border)] bg-white p-3">
          <img
            src={checkout.productImage}
            alt={checkout.productName}
            loading="lazy"
            decoding="async"
            className="h-16 w-16 shrink-0 rounded-lg object-cover"
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

        {/* Personalisation */}
        <div className="mt-5 overflow-hidden rounded-xl border border-[var(--border)] bg-white">
          {/* Name on cake: always visible */}
          <div className="border-b border-[var(--border)] p-4">
            <label className="flex items-center gap-3 text-sm font-medium">
              <Cake size={17} className="text-[var(--brand)]" />
              Name on cake
              <span className="text-xs font-normal text-[var(--text-muted)]">
                (Optional)
              </span>
            </label>

            <input
              value={form.nameOnCake || ""}
              onChange={(event) =>
                updateField("nameOnCake", event.target.value)
              }
              placeholder="e.g. Aarav"
              maxLength={30}
              className="mt-3 w-full rounded-lg border border-[var(--border)] px-3 py-3 text-sm outline-none focus:border-[var(--brand)]"
            />

            <p className="mt-1 text-right text-xs text-[var(--text-muted)]">
              {(form.nameOnCake || "").length}/30
            </p>
          </div>

          {/* Message on cake: always visible */}
          <div className="border-b border-[var(--border)] p-4">
            <label className="flex items-center gap-3 text-sm font-medium">
              <MessageSquare
                size={17}
                className="text-[var(--brand)]"
              />
              Message on cake
              <span className="text-xs font-normal text-[var(--text-muted)]">
                (Optional)
              </span>
            </label>

            <textarea
              value={form.messageOnCake || ""}
              onChange={(event) =>
                updateField("messageOnCake", event.target.value)
              }
              maxLength={100}
              rows={2}
              placeholder="e.g. Happy Birthday!"
              className="mt-3 w-full resize-none rounded-lg border border-[var(--border)] px-3 py-3 text-sm outline-none focus:border-[var(--brand)]"
            />

            <p className="mt-1 text-right text-xs text-[var(--text-muted)]">
              {(form.messageOnCake || "").length}/100
            </p>
          </div>

          {/* Colour change dropdown */}
          <div className="border-b border-[var(--border)]">
            <DropdownHeader
              section="colourChange"
              icon={Palette}
              title="Change colour"
              subtitle="Choose your preferred colour"
            />

            {openSections.colourChange && (
              <div className="px-4 pb-4">
                <input
                  value={form.colourChange || ""}
                  onChange={(event) =>
                    updateField("colourChange", event.target.value)
                  }
                  placeholder="e.g. Make it blue"
                  maxLength={50}
                  className="w-full rounded-lg border border-[var(--border)] px-3 py-3 text-sm outline-none focus:border-[var(--brand)]"
                />
              </div>
            )}
          </div>

          {/* Small design change dropdown */}
          <div className="border-b border-[var(--border)]">
            <DropdownHeader
              section="designChange"
              icon={Pencil}
              title="Small design changes"
              subtitle="Describe a small change"
            />

            {openSections.designChange && (
              <div className="px-4 pb-4">
                <textarea
                  value={form.addPhoto || ""}
                  onChange={(event) =>
                    updateField("addPhoto", event.target.value)
                  }
                  placeholder="Describe the small change"
                  maxLength={100}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-[var(--border)] px-3 py-3 text-sm outline-none focus:border-[var(--brand)]"
                />

                <p className="mt-1 text-right text-xs text-[var(--text-muted)]">
                  {(form.addPhoto || "").length}/100
                </p>
              </div>
            )}
          </div>

          {/* Reference image dropdown */}
          <div className="border-b border-[var(--border)]">
            <DropdownHeader
              section="referenceImage"
              icon={ImagePlus}
              title="Upload reference image"
              subtitle="Share an image for inspiration"
            />

            {openSections.referenceImage && (
              <div className="px-4 pb-4">
                {imageError && (
                  <p role="alert" className="mb-2 text-xs text-red-600">
                    {imageError}
                  </p>
                )}

                {referenceImage ? (
                  <div className="overflow-hidden rounded-xl border border-[var(--brand)]">
                    <img
                      src={referenceImage}
                      alt="Cake reference"
                      className="max-h-64 w-full object-contain"
                    />

                    <div className="flex items-center justify-between gap-3 p-3">
                      <p className="text-xs font-medium text-[var(--brand)]">
                        Reference image added
                      </p>

                      <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--cream-dark)] px-3 py-2 text-xs font-semibold">
                        <ImagePlus size={14} />
                        Change image

                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setReferenceImage("");
                        setImageError("");
                      }}
                      className="px-3 pb-3 text-xs text-red-600"
                    >
                      Remove image
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--cream-dark)] px-4 py-6 text-center">
                    <ImagePlus
                      size={25}
                      className="text-[var(--brand)]"
                    />

                    <span className="mt-2 text-sm font-semibold">
                      Choose reference image
                    </span>

                    <span className="mt-1 text-xs text-[var(--text-muted)]">
                      Image file up to 350 KB
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Other request dropdown */}
          <div>
            <DropdownHeader
              section="otherRequest"
              icon={Plus}
              title="Any other request"
              subtitle="Anything else we should know?"
            />

            {openSections.otherRequest && (
              <div className="px-4 pb-4">
                <textarea
                  value={form.otherRequest || ""}
                  onChange={(event) =>
                    updateField("otherRequest", event.target.value)
                  }
                  maxLength={200}
                  rows={3}
                  placeholder="e.g. Make the decoration slightly darker..."
                  className="w-full resize-none rounded-lg border border-[var(--border)] px-3 py-3 text-sm outline-none focus:border-[var(--brand)]"
                />

                <p className="mt-1 text-right text-xs text-[var(--text-muted)]">
                  {(form.otherRequest || "").length}/200
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Add-ons: horizontal swipe remains unchanged */}
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
            <div
              className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {availableAddons.map((addon) => {
                const isSelected = selectedAddonIds.includes(addon.id);

                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => toggleAddon(addon)}
                    aria-pressed={isSelected}
                    className={`relative min-w-[145px] max-w-[145px] shrink-0 overflow-hidden rounded-xl border bg-white text-left transition active:scale-[0.98] ${
                      isSelected
                        ? "border-[var(--brand)] ring-2 ring-[var(--brand-light)]"
                        : "border-[var(--border)]"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand)] text-white">
                        <Check size={14} />
                      </div>
                    )}

                    <div className="aspect-square w-full overflow-hidden bg-gray-100">
                      <img
                        src={addon.image}
                        alt={addon.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition duration-300 hover:scale-105"
                      />
                    </div>

                    <div className="p-3">
                      <p className="truncate text-sm font-semibold">
                        {addon.name}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[var(--brand)]">
                          ₹{addon.price}
                        </span>

                        <span
                          className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                            isSelected
                              ? "bg-[var(--brand)] text-white"
                              : "bg-[var(--cream-dark)]"
                          }`}
                        >
                          {isSelected ? "Added" : "Add"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-[var(--border)] bg-white p-4">
              <p className="text-sm text-[var(--text-muted)]">
                No add-ons available for this cake.
              </p>
            </div>
          )}

          {selectedAddons.length > 0 && (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-[var(--cream-dark)] px-4 py-3">
              <span className="text-sm">Add-ons</span>

              <span className="font-semibold text-[var(--brand)]">
                + ₹{addonsTotal * quantity}
              </span>
            </div>
          )}
        </div>
      </div>
{/* Sticky Continue Button */}
<div
  className="
    fixed
    inset-x-0
    bottom-[60px]
    z-40
    border-t
    border-[var(--border)]
    bg-white/95
    px-4
    pt-3
    pb-3
    shadow-[0_-4px_15px_rgba(0,0,0,0.06)]
    backdrop-blur-md
  "
>
  <div className="mx-auto max-w-xl">
    <button
      type="button"
      onClick={handleContinue}
      className="
        flex
        min-h-[50px]
        w-full
        items-center
        justify-center
        gap-2
        rounded-xl
        bg-[var(--brand)]
        px-5
        py-3
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
</div>
    </section>
  );
}

export default PersonalisePage;
