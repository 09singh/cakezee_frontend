import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import EmailOtpVerification from "../../../components/auth/EmailOtpVerification";
import { createSharedOrder, getCategories, getProducts } from "../../../api/auth.api";
import { createCheckoutId } from "../../../utils/checkoutStorage";
import cakezeeLogo from "../../../assets/images/cakezee-logo.png.png";
import { calculateProductPrice } from "../../../utils/productPricing";

const fieldClass =
  "mt-2 w-full rounded-lg border border-[#dfd3c5] bg-white px-4 py-3 text-sm text-[#302723] outline-none transition placeholder:text-[#9a8e84] focus:border-[#9b6849] focus:ring-2 focus:ring-[#9b6849]/15";
const panelClass =
  "rounded-xl border border-[#ebe5de] bg-[#fffdfb] p-5 shadow-[0_5px_18px_rgba(60,42,30,0.04)] sm:p-6";
const itemTypes = ["Cake", "Cupcake", "Brownie", "Cookie", "Tarts", "Dessert jar", "Gift box", "Others"];
const productTypeKeywords = {
  Cake: ["cupcake", "cup cake", "brownie", "cookie", "tart", "dessert jar", "dessert-jar", "jar dessert", "gift box", "gift-box", "hamper"],
  Cupcake: ["cupcake", "cup cake"],
  Brownie: ["brownie"],
  Cookie: ["cookie", "cookies"],
  Tarts: ["tart", "tarts"],
  "Dessert jar": ["dessert jar", "dessert-jar", "jar dessert"],
  "Gift box": ["gift box", "gift-box", "hamper"],
  Others: ["other", "others"],
};

const getBusinessDate = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const addDays = (date, amount) => {
  const nextDate = new Date(`${date}T00:00:00Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + amount);
  return nextDate.toISOString().slice(0, 10);
};

const formatHour = (hour) => {
  const period = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:00 ${period}`;
};

const getDeliverySlots = (date) => {
  if (!date || date < getBusinessDate()) return [];
  const today = getBusinessDate();
  const currentHour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date())
  );
  return Array.from({ length: 10 }, (_, index) => index + 10)
    .filter((hour) => date !== today || hour >= currentHour)
    .map((hour) => `${formatHour(hour)} - ${formatHour(hour + 1)}`);
};

const sizeWeight = (size) => {
  const value = Number(size?.value || 0);
  return String(size?.unit || "kg").toLowerCase() === "g" ? value / 1000 : value;
};

const emptyItem = (product = null, itemType = "Cake") => ({
  itemType,
  productId: product?._id || "",
  size: itemType === "Cake" ? product?.sizes?.[0]?.name || "" : "",
  flavour: "",
  quantity: "1",
  eggless: false,
  theme: "",
  messageOnCake: "",
  designNotes: "",
  hasAllergy: false,
  allergyNotes: "",
});

const productMatchesType = (product, type, categories) => {
  const categoryId = String(product.categoryId?._id || product.categoryId || "");
  const category = categories.find((entry) => String(entry._id) === categoryId);
  const haystack = `${product.name || ""} ${product.slug || ""} ${category?.name || ""} ${category?.slug || ""}`.toLowerCase();
  if (type === "Cake") {
    return !productTypeKeywords.Cake.some((keyword) => haystack.includes(keyword));
  }
  return (productTypeKeywords[type] || []).some((keyword) => haystack.includes(keyword));
};

const fileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });

function SharedOrderForm() {
  const today = getBusinessDate();
  const initialDate = getDeliverySlots(today).length ? today : addDays(today, 1);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([emptyItem()]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [checkoutId] = useState(createCheckoutId);
  const [emailVerification, setEmailVerification] = useState(null);
  const [otpRequested, setOtpRequested] = useState(false);
  const [resendAvailableAt, setResendAvailableAt] = useState(null);
  const [occasion, setOccasion] = useState("Birthday");
  const [otherOccasion, setOtherOccasion] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(initialDate);
  const [deliveryTime, setDeliveryTime] = useState("");
  const [method, setMethod] = useState("pickup");
  const [address, setAddress] = useState("");
  const [referenceFiles, setReferenceFiles] = useState([]);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [placedOrder, setPlacedOrder] = useState(null);

  useEffect(() => {
    let active = true;
    const loadProducts = async () => {
      try {
        const [firstPage, categoryResponse] = await Promise.all([
          getProducts({ limit: 50, page: 1 }),
          getCategories(),
        ]);
        const available = (firstPage?.data || []).filter(
          (product) =>
            product.productType !== "ready_now" &&
            product.inventoryQuantity > 0 &&
            product.sizes?.length &&
            product.flavours?.length
        );
        let hasNext = Boolean(firstPage?.pagination?.hasNext);
        let page = 2;
        while (hasNext) {
          const response = await getProducts({ limit: 50, page });
          available.push(
            ...(response?.data || []).filter(
              (product) =>
                product.productType !== "ready_now" &&
                product.inventoryQuantity > 0 &&
                product.sizes?.length &&
                product.flavours?.length
            )
          );
          hasNext = Boolean(response?.pagination?.hasNext);
          page += 1;
        }
        if (!active) return;
        const availableCategories = categoryResponse?.data || [];
        setProducts(available);
        setCategories(availableCategories);
        const firstCake = available.find((product) =>
          productMatchesType(product, "Cake", availableCategories)
        );
        setItems([emptyItem(firstCake, "Cake")]);
      } catch (error) {
        if (active) {
          setProductError(
            error?.response?.data?.message || "Could not load available catalog items."
          );
        }
      } finally {
        if (active) setLoadingProducts(false);
      }
    };
    loadProducts();
    return () => {
      active = false;
    };
  }, []);

  const slots = getDeliverySlots(deliveryDate);
  const estimatedTotal = useMemo(() => {
    const cakesTotal = items.reduce((total, item) => {
      const product = products.find((entry) => entry._id === item.productId);
      const priceFlavour = product?.flavours?.[0];
      if (!product || !priceFlavour) return total;
      const size = item.itemType === "Cake"
        ? product.sizes?.find((entry) => entry.name === item.size)
        : null;
      if (item.itemType === "Cake" && !size) return total;
      const unitPrice = item.itemType === "Cake"
        ? calculateProductPrice(product, sizeWeight(size), priceFlavour)
        : Number(priceFlavour.basePrice);
      return total + unitPrice * Number(item.quantity || 0);
    }, 0);
    return cakesTotal + (method === "delivery" ? 60 : 0);
  }, [items, method, products]);

  const updateItem = (index, changes) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...changes } : item
      )
    );
  };

  const addItem = () => {
    if (items.length >= 10) return;
    const firstCake = products.find((product) => productMatchesType(product, "Cake", categories));
    setItems((current) => [...current, emptyItem(firstCake, "Cake")]);
  };

  const handleItemTypeChange = (index, itemType) => {
    const matchingProducts = products.filter((product) =>
      productMatchesType(product, itemType, categories)
    );
    updateItem(index, emptyItem(matchingProducts[0], itemType));
  };

  const handleReferenceFiles = (event) => {
    const selected = Array.from(event.target.files || []);
    if (selected.length > 5) {
      setSubmitError("Choose up to five reference photos.");
      event.target.value = "";
      return;
    }
    if (selected.some((file) => !file.type.startsWith("image/"))) {
      setSubmitError("Reference photos must be image files.");
      event.target.value = "";
      return;
    }
    setSubmitError("");
    setReferenceFiles(selected);
  };

  const handleDateChange = (event) => {
    setDeliveryDate(event.target.value);
    setDeliveryTime("");
  };

  const submitOrder = async () => {
    if (submitting) return;
    if (
      !emailVerification?.token ||
      emailVerification.email !== email.trim().toLowerCase() ||
      Number(emailVerification.expiresAt) <= Date.now()
    ) {
      setSubmitError("Verify your email address before placing the order.");
      return;
    }
    if (items.some((item) => !products.some((product) =>
      product._id === item.productId && productMatchesType(product, item.itemType, categories)
    ))) {
      setSubmitError("Choose an available catalog item for every product type before placing the order.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");

    try {
      const referenceImages = await Promise.all(referenceFiles.map(fileAsDataUrl));
      const totalImageCharacters = referenceImages.reduce((sum, image) => sum + image.length, 0);
      if (totalImageCharacters > 700000) {
        throw new Error("Please choose smaller reference photos (700 KB total maximum).");
      }

      const normalizedOccasion = occasion === "Other" ? otherOccasion.trim() : occasion;
      const orderItems = items.map((item, index) => ({
        itemType: item.itemType,
        productId: item.productId,
        ...(item.itemType === "Cake" ? { size: item.size } : {}),
        flavour: item.flavour,
        quantity: Number(item.quantity),
        customisation: {
          eggless: item.eggless,
          theme: item.theme,
          messageOnCake: item.messageOnCake,
          designNotes: item.designNotes,
          hasAllergy: item.hasAllergy,
          allergyNotes: item.hasAllergy ? item.allergyNotes : "",
          referenceImages: index === 0 ? referenceImages : [],
        },
      }));

      const response = await createSharedOrder({
        checkoutId,
        phone,
        customerEmail: emailVerification.email,
        emailVerificationToken: emailVerification.token,
        customerName,
        occasion: normalizedOccasion,
        items: orderItems,
        additionalNotes,
        delivery: {
          method,
          date: deliveryDate,
          time: deliveryTime,
          address: method === "delivery" ? address : "",
          mapLink: "",
          mapLinkText: "",
        },
      });
      const order = response?.data;
      if (!order?.orderId) {
        throw new Error("The order service returned an invalid response.");
      }
      setPlacedOrder(order);
    } catch (error) {
      setSubmitError(
        error?.response?.data?.message || error.message || "Could not place your order."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitOrder();
  };

  if (placedOrder) {
    return (
      <section className="min-h-[70vh] bg-[#f7f3ed] px-4 py-12">
        <div className="mx-auto max-w-xl rounded-xl border border-[#ebe5de] bg-[#fffdfb] p-7 text-center shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#95616E]">Order placed</p>
          <h1 className="mt-2 text-2xl font-bold text-[#65152D]">
            Thank you, {placedOrder.customerName}!
          </h1>
          <p className="mt-3 text-sm text-[#78676A]">Your order reference is</p>
          <p className="mt-1 break-all text-lg font-bold text-[#65152D]">#{placedOrder.orderId}</p>
          <div className="mt-5 space-y-2 text-left text-sm text-[#35262A]">
            {(placedOrder.items || []).map((item, index) => (
              <p key={`${item.productId}-${index}`}>
                {item.itemType || "Cake"} · {item.name}
                {item.itemType === "Cake" ? ` · ${item.weight || item.size} ${item.weight ? "kg" : ""}` : " · per piece"}
                {item.flavour ? ` · ${item.flavour}` : ""} · Qty {item.quantity}
              </p>
            ))}
          </div>
          <p className="mt-4 text-sm font-semibold text-[#35262A]">
            Total: ₹{Number(placedOrder.pricing?.total || 0).toLocaleString("en-IN")} · Payment at {placedOrder.delivery?.method}
          </p>
          <Link to="/" className="mt-6 inline-flex rounded-lg bg-[#65152D] px-5 py-3 text-sm font-semibold text-white hover:bg-[#501023]">
            Back to Cakezee
          </Link>
        </div>
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ed] px-3 pb-12 pt-6 text-[#302723] sm:px-6">
      <div className="mx-auto max-w-[860px]">
        <Link to="/" aria-label="Cakezee home" className="inline-flex rounded-2xl bg-white p-2 shadow-sm">
          <img src={cakezeeLogo} alt="Cakezee" className="h-14 w-14 rounded-xl object-contain" />
        </Link>
        <header className="mx-auto mb-6 mt-3 max-w-2xl text-center">
          <p className="text-sm font-semibold text-[#6f5444]">Cakezee</p>
          <h1 className="mt-2 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Tell us a little about what you&apos;re planning.
          </h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          <section className={panelClass}>
            <h2 className="font-bold">Your Details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Name *
                <input required minLength="2" maxLength="100" autoComplete="name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} className={fieldClass} />
              </label>
              <label className="text-sm font-semibold">
                Mobile number *
                <input required type="tel" autoComplete="tel" placeholder="10 digits or +country code" value={phone} onChange={(event) => setPhone(event.target.value)} className={fieldClass} />
              </label>
            </div>
            <EmailOtpVerification
              className="mt-4"
              email={email}
              checkoutId={checkoutId}
              verification={emailVerification}
              requestPending={otpRequested}
              resendAvailableAt={resendAvailableAt}
              onEmailChange={(value) => {
                setEmail(value);
                setEmailVerification(null);
                setOtpRequested(false);
              }}
              onVerificationInvalidated={() => setEmailVerification(null)}
              onVerified={setEmailVerification}
              onRequestPendingChange={setOtpRequested}
              onResendAvailableAtChange={setResendAvailableAt}
            />
          </section>

          <section className={panelClass}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold">What would you like?</h2>
              <span className="text-sm font-semibold text-[#725e50]">{items.length}/10</span>
            </div>

            {productError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{productError}</p>}
            {loadingProducts ? (
              <p className="mt-4 text-sm text-[#78676A]">Loading products…</p>
            ) : !products.length ? (
              <p className="mt-4 text-sm text-[#78676A]">No catalog items are currently available.</p>
            ) : (
              <div className="mt-4 space-y-6">
                {items.map((item, index) => {
                  const matchingProducts = products.filter((entry) =>
                    productMatchesType(entry, item.itemType, categories)
                  );
                  const product = products.find((entry) => entry._id === item.productId);
                  return (
                    <fieldset key={index} className="border-b border-[#eee7df] pb-5 last:border-0 last:pb-0">
                      <legend className="mb-3 w-full text-sm font-semibold">
                        <span>Product {index + 1}</span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                            className="float-right text-xs font-semibold text-[#95616E] underline"
                          >
                            Remove
                          </button>
                        )}
                      </legend>
                      <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
                        <label className="text-sm font-semibold">
                          Product *
                          <select required value={item.itemType} onChange={(event) => handleItemTypeChange(index, event.target.value)} className={fieldClass}>
                            {itemTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                          </select>
                        </label>
                        <label className="text-sm font-semibold">
                          Quantity * <span className="font-normal">pcs</span>
                          <input required type="number" min="1" max="20" value={item.quantity} onChange={(event) => updateItem(index, { quantity: event.target.value })} className={fieldClass} />
                        </label>
                        {!matchingProducts.length && (
                          <p role="alert" className="text-xs leading-5 text-amber-800 sm:col-span-2">
                            No in-stock catalog item is currently mapped to {item.itemType}. Please contact Cakezee to place this item.
                          </p>
                        )}
                        {item.itemType === "Cake" && (
                          <label className="text-sm font-semibold">
                            Cake Weight (kg) *
                            <select required value={item.size} onChange={(event) => updateItem(index, { size: event.target.value })} className={fieldClass}>
                              {product?.sizes?.map((size) => <option key={size.name} value={size.name}>{sizeWeight(size)} kg</option>)}
                            </select>
                          </label>
                        )}
                        <label className="text-sm font-semibold">
                          Flavour *
                          <input required maxLength="50" placeholder="Type your flavour" value={item.flavour} onChange={(event) => updateItem(index, { flavour: event.target.value })} className={fieldClass} disabled={!product} />
                          <span className="mt-1 block text-xs font-normal text-[#78676A]">Type your flavour; price is based on the selected catalog product.</span>
                        </label>
                        <fieldset className="text-sm font-semibold">
                          <legend>Eggless?</legend>
                          <div className="mt-4 flex gap-5 font-normal">
                            {[["Yes", true], ["No", false]].map(([label, value]) => (
                              <label key={label} className="flex items-center gap-2">
                                <input type="radio" name={`eggless-${index}`} checked={item.eggless === value} onChange={() => updateItem(index, { eggless: value })} />
                                {label}
                              </label>
                            ))}
                          </div>
                        </fieldset>
                        <label className="text-sm font-semibold">
                          Theme or colours
                          <input maxLength="100" placeholder="e.g. Pastel blue and gold" value={item.theme} onChange={(event) => updateItem(index, { theme: event.target.value })} className={fieldClass} />
                        </label>
                        <label className="text-sm font-semibold">
                          Message on product
                          <input maxLength="100" placeholder="e.g. Happy Birthday Arya" value={item.messageOnCake} onChange={(event) => updateItem(index, { messageOnCake: event.target.value })} className={fieldClass} />
                        </label>
                        <label className="text-sm font-semibold sm:col-span-2">
                          Design notes
                          <textarea rows={3} maxLength="500" placeholder="Tell us about the style, finish, or anything important for this product." value={item.designNotes} onChange={(event) => updateItem(index, { designNotes: event.target.value })} className={fieldClass} />
                        </label>
                        <label className="text-sm font-semibold sm:col-span-2">
                          Allergy notes
                          <input maxLength="300" placeholder="Optional" value={item.allergyNotes} onChange={(event) => updateItem(index, { allergyNotes: event.target.value, hasAllergy: Boolean(event.target.value.trim()) })} className={fieldClass} />
                        </label>
                      </div>
                    </fieldset>
                  );
                })}
                <button
                  type="button"
                  disabled={items.length >= 10}
                  onClick={addItem}
                  className="rounded-lg bg-[#f0e7da] px-4 py-3 text-sm font-bold text-[#49372c] transition hover:bg-[#e9dccb] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add another product
                </button>
              </div>
            )}
          </section>

          <section className={panelClass}>
            <h2 className="font-bold">Occasion</h2>
            <fieldset className="mt-4">
              <legend className="text-sm font-semibold">Occasion *</legend>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3">
                {["Birthday", "Kids Birthday", "Anniversary", "Other"].map((value) => (
                  <label key={value} className="flex items-center gap-2 text-sm font-medium">
                    <input type="radio" name="occasion" value={value} checked={occasion === value} onChange={() => setOccasion(value)} />
                    {value}
                  </label>
                ))}
              </div>
              {occasion === "Other" && (
                <input required maxLength="100" placeholder="Tell us the occasion" value={otherOccasion} onChange={(event) => setOtherOccasion(event.target.value)} className={fieldClass} />
              )}
            </fieldset>
          </section>

          <section className={panelClass}>
            <h2 className="font-bold">Pickup / Delivery</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Required date *
                <input required type="date" min={today} value={deliveryDate} onChange={handleDateChange} className={fieldClass} />
              </label>
              <label className="text-sm font-semibold">
                Preferred time *
                <select required value={deliveryTime} onChange={(event) => setDeliveryTime(event.target.value)} className={fieldClass}>
                  <option value="">Select a time</option>
                  {slots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                </select>
              </label>
            </div>
            <fieldset className="mt-4">
              <legend className="text-sm font-semibold">How would you like to receive it? *</legend>
              <div className="mt-3 flex gap-5">
                {[["Pickup", "pickup"], ["Delivery", "delivery"]].map(([label, value]) => (
                  <label key={value} className="flex items-center gap-2 text-sm font-medium">
                    <input type="radio" name="delivery-method" value={value} checked={method === value} onChange={() => setMethod(value)} />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            {method === "delivery" && (
              <label className="mt-4 block text-sm font-semibold">
                Delivery address *
                <textarea required rows={2} maxLength="1000" value={address} onChange={(event) => setAddress(event.target.value)} className={fieldClass} autoComplete="street-address" />
              </label>
            )}
          </section>

          <section className={panelClass}>
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-bold">Reference Photos</h2>
              <span className="text-sm font-semibold text-[#725e50]">{referenceFiles.length}/5</span>
            </div>
            <p className="mt-2 text-sm text-[#78676A]">Add up to five JPG, PNG, WebP, or AVIF images.</p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              onChange={handleReferenceFiles}
              className="mt-3 w-full rounded-lg border border-[#dfd3c5] bg-white p-3 text-sm"
            />
          </section>

          <section className={panelClass}>
            <label className="block text-sm font-bold" htmlFor="shared-order-notes">Anything else?</label>
            <span className="mt-4 block text-sm font-semibold">Anything else you&apos;d like us to know?</span>
            <textarea id="shared-order-notes" rows={4} maxLength="900" value={additionalNotes} onChange={(event) => setAdditionalNotes(event.target.value)} className={fieldClass} />
            <p className="mt-1 text-xs text-[#78676A]">{additionalNotes.length}/900</p>
          </section>

          <section className="rounded-xl bg-[#fffdfb] p-5 shadow-sm">
            <p className="mb-3 text-right text-sm font-bold text-[#49372c]">
              Estimated total: ₹{estimatedTotal.toLocaleString("en-IN")}
            </p>
            {submitError && <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}
            <button
              type="submit"
              disabled={loadingProducts || !products.length || submitting}
              className="w-full rounded-lg bg-[#302723] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#49372c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Placing order…" : "Place Order"}
            </button>
            <p className="mt-3 text-center text-xs text-[#78676A]">
              This places one combined order. Estimated price includes ₹60 delivery where applicable.
            </p>
          </section>
        </form>
      </div>
    </main>
  );
}

export default SharedOrderForm;
