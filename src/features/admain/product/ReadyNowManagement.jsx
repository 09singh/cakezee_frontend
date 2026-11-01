import { useEffect, useState } from "react";
import { ImagePlus, Power, RefreshCw, Trash2, Zap } from "lucide-react";
import {
  activateProduct,
  createAdminReadyNowProduct,
  deactivateProduct,
  getAdminReadyNowProducts,
  removeProduct as deleteProduct,
} from "../../../api/auth.api";

const categories = [
  { value: "cake", label: "Cake" },
  { value: "benetto", label: "Benetto" },
  { value: "dessert", label: "Dessert" },
  { value: "pastries", label: "Pastries" },
];

const groups = [
  { value: "ready_now", label: "Ready Now", categories: categories.map((category) => category.value) },
  { value: "mini_delight", label: "Mini Delight", categories: ["mini_delight"] },
  { value: "surprise_hampers", label: "Surprise Cake & Hampers", categories: ["surprise_hampers"] },
];

const emptyForm = { name: "", slug: "", description: "", readyNowCategory: "cake", price: "", inventoryQuantity: "1" };
const inputClass = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#65152D]";

function makeSlug(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s-]+/g, "-").replace(/^-|-$/g, "");
}

function ReadyNowManagement() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [activeGroup, setActiveGroup] = useState("ready_now");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getAdminReadyNowProducts();
      setProducts(Array.isArray(response?.data) ? response.data : []);
    } catch (loadError) {
      setError(loadError?.response?.data?.message || "Could not load Ready Now products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    getAdminReadyNowProducts()
      .then((response) => { if (active) setProducts(Array.isArray(response?.data) ? response.data : []); })
      .catch((loadError) => { if (active) setError(loadError?.response?.data?.message || "Could not load Ready Now products."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const updateName = (name) => setForm((current) => ({ ...current, name, slug: makeSlug(name) }));
  const selectedGroup = groups.find((group) => group.value === activeGroup) || groups[0];
  const groupProducts = products.filter((product) => selectedGroup.categories.includes(product.readyNowCategory));

  const changeGroup = (group) => {
    setActiveGroup(group.value);
    setForm((current) => ({
      ...current,
      readyNowCategory: group.value === "ready_now" ? "cake" : group.value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    const formElement = event.currentTarget;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const formData = new FormData();
      formData.append("product", JSON.stringify({
        ...form,
        price: Number(form.price),
        inventoryQuantity: Number(form.inventoryQuantity),
        isActive: true,
        sortOrder: 0,
      }));
      if (image) formData.append("images", image);
      const response = await createAdminReadyNowProduct(formData);
      if (!response?.data?._id) throw new Error("The product was not saved. Please retry.");
      setProducts((current) => [response.data, ...current]);
      setForm({
        ...emptyForm,
        readyNowCategory: activeGroup === "ready_now" ? "cake" : activeGroup,
      });
      setImage(null);
      formElement.reset();
      setNotice(`${response.data.name} added to ${selectedGroup.label}.`);
    } catch (submitError) {
      const details = submitError?.response?.data?.errors;
      setError(Array.isArray(details) ? details.join(" ") : submitError?.response?.data?.message || submitError.message || "Could not save this product.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (product) => {
    setBusyId(product._id);
    setError("");
    try {
      if (product.isActive) await deactivateProduct(product._id);
      else await activateProduct(product._id);
      setProducts((items) => items.map((item) => item._id === product._id ? { ...item, isActive: !product.isActive } : item));
    } catch (toggleError) {
      setError(toggleError?.response?.data?.message || "Could not update product status.");
    } finally {
      setBusyId("");
    }
  };

  const removeReadyNowProduct = async (product) => {
    if (!window.confirm(`Permanently remove "${product.name}" from the catalog?`)) return;

    setBusyId(product._id);
    setError("");
    setNotice("");
    try {
      await deleteProduct(product._id);
      setProducts((items) => items.filter((item) => item._id !== product._id));
      setNotice(`${product.name} was removed from the catalog.`);
    } catch (removeError) {
      setError(removeError?.response?.data?.message || "Could not remove this product.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#95616E]">Product management</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-[#351d24]"><Zap size={22} /> Ready Now product sections</h1>
          <p className="mt-1 text-sm text-gray-500">Manage Ready Now, Mini Delight, and Surprise Cake & Hampers as separate product lists.</p>
        </div>
        <button type="button" onClick={loadProducts} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh</button>
      </header>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}

      <nav className="flex flex-wrap gap-2 rounded-2xl border bg-white p-2" aria-label="Product section">
        {groups.map((group) => (
          <button key={group.value} type="button" onClick={() => changeGroup(group)} aria-pressed={activeGroup === group.value} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${activeGroup === group.value ? "bg-[#65152D] text-white" : "text-gray-600 hover:bg-gray-100"}`}>
            {group.label}
          </button>
        ))}
      </nav>

      <form onSubmit={submit} className="grid gap-4 rounded-2xl border bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-6">
        <h2 className="text-lg font-bold text-[#351d24] sm:col-span-2">Add a {selectedGroup.label} product</h2>
        <label className="text-sm font-medium">Product name *<input required minLength={2} maxLength={150} value={form.name} onChange={(event) => updateName(event.target.value)} className={`${inputClass} mt-1.5`} /></label>
        {activeGroup === "ready_now" ? (
          <label className="text-sm font-medium">Fixed category *<select value={form.readyNowCategory} onChange={(event) => setForm((current) => ({ ...current, readyNowCategory: event.target.value }))} className={`${inputClass} mt-1.5`}>{categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select></label>
        ) : (
          <div className="text-sm font-medium">Product section<div className={`${inputClass} mt-1.5`}>{selectedGroup.label}</div></div>
        )}
        <label className="text-sm font-medium">Product URL slug *<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} className={`${inputClass} mt-1.5`} /></label>
        <label className="text-sm font-medium">Price (₹) *<input required type="number" min="1" max="1000000" step="0.01" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} className={`${inputClass} mt-1.5`} /></label>
        <label className="text-sm font-medium">Available quantity *<input required type="number" min="0" max="1000000" step="1" value={form.inventoryQuantity} onChange={(event) => setForm((current) => ({ ...current, inventoryQuantity: event.target.value }))} className={`${inputClass} mt-1.5`} /><span className="mt-1 block text-xs text-gray-500">Orders will reserve stock using the regular order flow.</span></label>
        <label className="text-sm font-medium">Product image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0] || null)} className={`${inputClass} mt-1.5`} /><span className="mt-1 flex items-center gap-1 text-xs text-gray-500"><ImagePlus size={13} /> JPG, PNG or WebP, up to 5 MB</span></label>
        <label className="text-sm font-medium sm:col-span-2">Description<textarea rows={3} maxLength={2000} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className={`${inputClass} mt-1.5`} /></label>
        <button disabled={saving} className="rounded-lg bg-[#65152D] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2">{saving ? "Saving product…" : `Add to ${selectedGroup.label}`}</button>
      </form>

      <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-[#351d24]">{selectedGroup.label} products</h2>
        {loading ? <p className="py-8 text-center text-sm text-gray-500">Loading products…</p> : groupProducts.length ? (
          <div className="mt-4 divide-y">
            {groupProducts.map((product) => (
              <article key={product._id} className="flex flex-wrap items-center gap-3 py-3">
                <img src={product.images?.[0]?.url || "/images/placeholder.webp"} alt="" className="h-14 w-14 rounded-lg bg-gray-100 object-cover" />
                <div className="min-w-0 flex-1"><p className="truncate font-semibold">{product.name}</p><p className="text-xs capitalize text-gray-500">{product.readyNowCategory} · ₹{Number(product.flavours?.[0]?.basePrice || 0).toLocaleString("en-IN")} · Stock {product.inventoryQuantity}</p></div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${product.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>{product.isActive ? "Active" : "Hidden"}</span>
                <button type="button" onClick={() => toggleActive(product)} disabled={busyId === product._id} aria-label={product.isActive ? "Hide product" : "Show product"} className="rounded-lg border p-2 text-gray-600 disabled:opacity-50"><Power size={16} /></button>
                <button type="button" onClick={() => removeReadyNowProduct(product)} disabled={busyId === product._id} aria-label={`Remove ${product.name}`} title="Permanently remove product" className="rounded-lg border border-red-200 p-2 text-red-700 disabled:opacity-50"><Trash2 size={16} /></button>
              </article>
            ))}
          </div>
        ) : <p className="py-8 text-center text-sm text-gray-500">No {selectedGroup.label} products yet.</p>}
      </section>
    </main>
  );
}

export default ReadyNowManagement;
