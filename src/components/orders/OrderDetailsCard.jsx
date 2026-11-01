import { useState } from "react";
import { X } from "lucide-react";

import {
  updateAdminOrderDetails,
  updateCustomerOrderDetails,
} from "../../api/orders.api";

const deliverySlots = Array.from({ length: 10 }, (_, index) => {
  const hour = index + 10;
  const nextHour = hour + 1;
  const formatHour = (value) => {
    const period = value >= 12 ? "PM" : "AM";
    return `${value % 12 || 12}:00 ${period}`;
  };
  return `${formatHour(hour)} - ${formatHour(nextHour)}`;
});

const createForm = (order) => ({
  customerName: order.customerName || "",
  occasion: order.occasion || "",
  occasionDate: order.occasionDate || "",
  customisation: {
    nameOnCake: order.customisation?.nameOnCake || "",
    eggless: Boolean(order.customisation?.eggless),
    messageOnCake: order.customisation?.messageOnCake || "",
    colourChange: order.customisation?.colourChange || "",
    otherRequest: order.customisation?.otherRequest || "",
    theme: order.customisation?.theme || "",
    designNotes: order.customisation?.designNotes || "",
    tiers: order.customisation?.tiers ? String(order.customisation.tiers) : "",
    hasAllergy: Boolean(order.customisation?.hasAllergy),
    allergyNotes: order.customisation?.allergyNotes || "",
  },
  delivery: {
    date: order.delivery?.date || "",
    time: order.delivery?.time || "",
    address: order.delivery?.address || "",
    mapLink: order.delivery?.mapLink || "",
    mapLinkText: order.delivery?.mapLinkText || "",
  },
});

const fieldClass =
  "mt-1 w-full rounded-lg border border-[#E8D9D5] bg-white px-3 py-2.5 text-sm text-[#35262A] outline-none focus:border-[#65152D] focus:ring-2 focus:ring-[#65152D]/10";

function OrderDetailsCard({ order, mode = "customer", startInEditMode = false, onClose, onSaved }) {
  const [editing, setEditing] = useState(startInEditMode);
  const [form, setForm] = useState(() => createForm(order));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const isAdmin = mode === "admin";
  const hasCurrentTime = deliverySlots.includes(form.delivery.time);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateCustomisation = (field, value) => {
    setForm((current) => ({
      ...current,
      customisation: { ...current.customisation, [field]: value },
    }));
  };

  const updateDelivery = (field, value) => {
    setForm((current) => ({
      ...current,
      delivery: { ...current.delivery, [field]: value },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
        version: Number.isInteger(order.lifecycleVersion) ? order.lifecycleVersion : 0,
      ...form,
      customisation: {
        ...form.customisation,
        tiers: form.customisation.tiers ? Number(form.customisation.tiers) : null,
      },
    };

    try {
      const updated = isAdmin
        ? await updateAdminOrderDetails(order.orderId, payload)
        : await updateCustomerOrderDetails(order.orderId, {
            ...payload,
            phone: order.phone,
          });
      onSaved(updated);
      setForm(createForm(updated));
      setEditing(false);
      setNotice("Order details saved.");
    } catch (saveError) {
      setError(
        saveError?.response?.data?.message ||
          "Could not save order details. Refresh and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/50 p-3 pt-6 sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-details-title"
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-[#FFFDFC] shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#E8D9D5] bg-[#F8EBDD] px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#95616E]">
              {isAdmin ? "Admin order card" : "Your order"}
            </p>
            <h2 id="order-details-title" className="mt-1 break-all text-lg font-bold text-[#65152D]">
              Order #{order.orderId}
            </h2>
            <p className="mt-1 text-xs text-[#78676A]">
              {order.status} · {order.productName} · {order.delivery?.date} {order.delivery?.time}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close order details"
            className="rounded-lg p-2 text-[#65152D] transition hover:bg-white"
          >
            <X size={18} />
          </button>
        </header>

        {!editing ? (
          <div className="space-y-5 p-5">
            {notice && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-[#95616E]">Customer</h3>
                <p className="mt-1 text-sm font-semibold text-[#35262A]">{order.customerName || "Name not provided"}</p>
                <p className="mt-1 text-sm text-[#78676A]">{order.phone}</p>
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-[#95616E]">Products</h3>
                {(order.items?.length ? order.items : [{
                  name: order.productName,
                  itemType: "Cake",
                  size: order.size,
                  flavour: order.flavour,
                  quantity: order.quantity,
                }]).map((item, index) => (
                  <p key={`${item.name}-${index}`} className="mt-1 text-sm text-[#35262A]">
                    <span className="font-semibold">{item.name}</span>
                    <span className="mt-0.5 block text-[#78676A]">
                      {[
                        item.itemType || "Cake",
                        item.itemType === "Cake" ? item.weight ? `${item.weight} kg` : item.size : "per piece",
                        item.flavour,
                        `Qty ${item.quantity}`,
                      ].filter(Boolean).join(" · ")}
                    </span>
                  </p>
                ))}
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-[#95616E]">Delivery / pickup</h3>
                <p className="mt-1 text-sm font-semibold text-[#35262A]">{order.delivery?.date} · {order.delivery?.time}</p>
                <p className="mt-1 text-sm text-[#78676A]">{order.delivery?.address || "Store pickup"}</p>
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-[#95616E]">Order total</h3>
                <p className="mt-1 text-sm font-semibold text-[#35262A]">₹{Number(order.pricing?.total || 0).toLocaleString("en-IN")}</p>
                <p className="mt-1 text-sm text-[#78676A]">{order.payment?.method || "Payment"} · {order.payment?.status || "pending"}</p>
              </div>
            </div>
            <div className="rounded-xl border border-[#E8D9D5] bg-white p-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-[#95616E]">Customisation and notes</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#35262A]">
                {[
                  order.customisation?.nameOnCake ? `Name on cake: ${order.customisation.nameOnCake}` : "",
                  order.customisation?.messageOnCake ? `Message: ${order.customisation.messageOnCake}` : "",
                  order.customisation?.theme,
                  order.customisation?.designNotes,
                  order.customisation?.otherRequest,
                  order.customisation?.hasAllergy ? `Allergy: ${order.customisation.allergyNotes || "not specified"}` : "",
                  order.occasion ? `Occasion: ${order.occasion}` : "",
                ].filter(Boolean).join("\n") || "No special instructions"}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={onClose} className="rounded-lg border border-[#E8D9D5] px-4 py-2.5 text-sm font-semibold text-[#65152D]">Close</button>
              {!["Delivered", "Cancelled", "Rejected", "Returned to Bakery"].includes(order.status) && (
                <button type="button" onClick={() => { setEditing(true); setNotice(""); }} className="rounded-lg bg-[#65152D] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#501023]">
                  Edit order details
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 p-5">
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
              {isAdmin
                ? "Admin edits are allowed at any time before an order is completed. Product, quantity, and pricing are unchanged."
                : "You can change these details until one hour before the scheduled delivery. Product, quantity, and pricing are unchanged."}
            </p>
            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-[#78676A]">
                Customer name
                <input value={form.customerName} maxLength={100} onChange={(event) => update("customerName", event.target.value)} className={fieldClass} />
              </label>
              <label className="text-xs font-semibold text-[#78676A]">
                Occasion
                <input value={form.occasion} maxLength={100} onChange={(event) => update("occasion", event.target.value)} className={fieldClass} />
              </label>
              <label className="text-xs font-semibold text-[#78676A]">
                Occasion date
                <input type="date" value={form.occasionDate} onChange={(event) => update("occasionDate", event.target.value)} className={fieldClass} />
              </label>
              <label className="text-xs font-semibold text-[#78676A]">
                Delivery date
                <input type="date" required value={form.delivery.date} onChange={(event) => updateDelivery("date", event.target.value)} className={fieldClass} />
              </label>
              <label className="text-xs font-semibold text-[#78676A] sm:col-span-2">
                Delivery time slot
                <select required value={form.delivery.time} onChange={(event) => updateDelivery("time", event.target.value)} className={fieldClass}>
                  {!hasCurrentTime && form.delivery.time && <option value={form.delivery.time}>{form.delivery.time}</option>}
                  {deliverySlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-[#78676A] sm:col-span-2">
                {order.delivery?.method === "pickup" ? "Pickup note" : "Delivery address"}
                <textarea
                  rows={2}
                  maxLength={1000}
                  required={order.delivery?.method !== "pickup"}
                  value={form.delivery.address}
                  onChange={(event) => updateDelivery("address", event.target.value)}
                  className={fieldClass}
                />
              </label>
              <label className="text-xs font-semibold text-[#78676A]">
                Map link
                <input type="url" value={form.delivery.mapLink} maxLength={2000} onChange={(event) => updateDelivery("mapLink", event.target.value)} className={fieldClass} />
              </label>
              <label className="text-xs font-semibold text-[#78676A]">
                Map link label
                <input value={form.delivery.mapLinkText} maxLength={200} onChange={(event) => updateDelivery("mapLinkText", event.target.value)} className={fieldClass} />
              </label>
              <label className="text-xs font-semibold text-[#78676A]">
                Name on cake
                <input value={form.customisation.nameOnCake} maxLength={30} onChange={(event) => updateCustomisation("nameOnCake", event.target.value)} className={fieldClass} />
              </label>
              <label className="text-xs font-semibold text-[#78676A]">
                Theme
                <input value={form.customisation.theme} maxLength={100} onChange={(event) => updateCustomisation("theme", event.target.value)} className={fieldClass} />
              </label>
              <label className="text-xs font-semibold text-[#78676A] sm:col-span-2">
                Message on cake
                <textarea rows={2} maxLength={100} value={form.customisation.messageOnCake} onChange={(event) => updateCustomisation("messageOnCake", event.target.value)} className={fieldClass} />
              </label>
              <label className="text-xs font-semibold text-[#78676A] sm:col-span-2">
                Design notes
                <textarea rows={2} maxLength={500} value={form.customisation.designNotes} onChange={(event) => updateCustomisation("designNotes", event.target.value)} className={fieldClass} />
              </label>
              <label className="text-xs font-semibold text-[#78676A] sm:col-span-2">
                Other request
                <textarea rows={2} maxLength={200} value={form.customisation.otherRequest} onChange={(event) => updateCustomisation("otherRequest", event.target.value)} className={fieldClass} />
              </label>
              <label className="text-xs font-semibold text-[#78676A]">
                Tiers
                <select value={form.customisation.tiers} onChange={(event) => updateCustomisation("tiers", event.target.value)} className={fieldClass}>
                  <option value="">Not specified</option>
                  {[1, 2, 3, 4, 5, 6].map((tiers) => <option key={tiers} value={tiers}>{tiers}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-[#78676A]">
                Colour change
                <input value={form.customisation.colourChange} maxLength={50} onChange={(event) => updateCustomisation("colourChange", event.target.value)} className={fieldClass} />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-[#35262A]">
                <input type="checkbox" checked={form.customisation.eggless} onChange={(event) => updateCustomisation("eggless", event.target.checked)} />
                Eggless
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-[#35262A]">
                <input type="checkbox" checked={form.customisation.hasAllergy} onChange={(event) => updateCustomisation("hasAllergy", event.target.checked)} />
                Has allergy information
              </label>
              {form.customisation.hasAllergy && (
                <label className="text-xs font-semibold text-[#78676A] sm:col-span-2">
                  Allergy notes
                  <textarea rows={2} maxLength={300} value={form.customisation.allergyNotes} onChange={(event) => updateCustomisation("allergyNotes", event.target.value)} className={fieldClass} />
                </label>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-[#E8D9D5] pt-4">
              <button type="button" onClick={() => { setEditing(false); setError(""); }} disabled={saving} className="rounded-lg border border-[#E8D9D5] px-4 py-2.5 text-sm font-semibold text-[#65152D] disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-[#65152D] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

export default OrderDetailsCard;
