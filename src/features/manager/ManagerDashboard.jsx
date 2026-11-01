import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, CircleAlert, ImagePlus, PackagePlus, RefreshCw, ShoppingCart, Store } from "lucide-react";
import api from "../../api/axios";

const tabs = ["POS Billing", "Ready Now Stock", "Delivery", "POS Sales"];
const categories = ["cake", "benetto", "dessert", "pastries", "combos", "mini_delight", "surprise_hampers"];
const categoryLabels = {
  cake: "Cake",
  benetto: "Benetto",
  dessert: "Dessert",
  pastries: "Pastries",
  combos: "Combos",
  mini_delight: "Mini Delight",
  surprise_hampers: "Surprise Cake & Hampers",
};
const blankProduct = { name: "", slug: "", description: "", readyNowCategory: "cake", price: "", inventoryQuantity: "1" };
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const inputStyle = "w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8f1638]";

export default function ManagerDashboard() {
  const [tab, setTab] = useState(tabs[0]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [cart, setCart] = useState({});
  const [customer, setCustomer] = useState({ customerName: "", phone: "", paymentMethod: "cash" });
  const [newProduct, setNewProduct] = useState(blankProduct);
  const [productImage, setProductImage] = useState(null);
  const [stockValues, setStockValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadProducts = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const [productResponse, salesResponse, pickupResponse] = await Promise.all([api.get("/pos/products"), api.get("/pos/sales"), api.get("/orders/manager/pickups")]);
      const nextProducts = productResponse.data?.data || [];
      setProducts(nextProducts);
      setStockValues(Object.fromEntries(nextProducts.map((product) => [product._id, product.inventoryQuantity])));
      setSales(salesResponse.data?.data || []);
      setPickups(pickupResponse.data?.data || []);
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Could not load store products and POS sales.");
    } finally { if (!quiet) setLoading(false); }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(loadProducts, 0);
    const refresh = () => {
      if (document.visibilityState === "visible") loadProducts({ quiet: true });
    };
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadProducts]);
  const availableProducts = products.filter((product) => product.isActive && product.inventoryQuantity > 0);
  const total = useMemo(() => Object.entries(cart).reduce((sum, [id, quantity]) => {
    const product = products.find((entry) => entry._id === id);
    return sum + (product ? Number(product.flavours?.[0]?.basePrice || 0) * quantity : 0);
  }, 0), [cart, products]);

  const addToCart = (product, amount) => setCart((current) => {
    const nextQuantity = Math.max(0, Math.min(product.inventoryQuantity, (current[product._id] || 0) + amount));
    const next = { ...current };
    if (nextQuantity) next[product._id] = nextQuantity;
    else delete next[product._id];
    return next;
  });

  const sell = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const response = await api.post("/pos/sales", {
        ...customer,
        items: Object.entries(cart).map(([productId, quantity]) => ({ productId, quantity })),
      });
      setMessage(`Sale ${response.data.data.saleId} completed. Total ${money(response.data.data.total)}.`);
      setCart({}); setCustomer({ customerName: "", phone: "", paymentMethod: "cash" });
      await loadProducts();
      setTab("POS Billing");
    } catch (sellError) { setError(sellError.response?.data?.message || "Could not complete this sale."); }
    finally { setSaving(false); }
  };

  const addProduct = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    const formElement = event.currentTarget;
    try {
      const formData = new FormData();
      formData.append("product", JSON.stringify({ ...newProduct, price: Number(newProduct.price), inventoryQuantity: Number(newProduct.inventoryQuantity), isActive: true, sortOrder: 0 }));
      formData.append("images", productImage);
      const response = await api.post("/pos/products", formData);
      setMessage(`${response.data.data.name} was added to ${categoryLabels[response.data.data.readyNowCategory] || "Ready Now"}.`);
      setNewProduct(blankProduct); setProductImage(null); formElement.reset(); await loadProducts();
    } catch (saveError) { setError(saveError.response?.data?.message || saveError.response?.data?.errors?.join(" ") || "Could not add the product."); }
    finally { setSaving(false); }
  };

  const updateProduct = async (product, changes) => {
    setSaving(true); setError(""); setMessage("");
    try {
      await api.patch(`/pos/products/${product._id}`, changes);
      setMessage(`${product.name} updated.`); await loadProducts();
    } catch (saveError) { setError(saveError.response?.data?.message || "Could not update this Ready Now product."); }
    finally { setSaving(false); }
  };

  const completePickup = async (order) => {
    setSaving(true); setError(""); setMessage("");
    try {
      await api.patch(`/orders/${encodeURIComponent(order.orderId)}/pickup/complete`);
      setMessage(`${order.orderId} marked as delivered. The admin Orders dashboard will show the updated status.`);
      await loadProducts();
    } catch (pickupError) { setError(pickupError.response?.data?.message || "Could not complete this store pickup."); }
    finally { setSaving(false); }
  };

  const setProductName = (name) => setNewProduct((current) => ({ ...current, name, slug: name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s-]+/g, "-").replace(/^-|-$/g, "") }));

  return <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#95616E]">Store operations</p><h1 className="mt-1 text-3xl font-bold text-[#351d24]">Manager POS</h1><p className="mt-1 text-sm text-stone-500">Bill counter sales, manage Ready Now, Mini Delight, and Surprise Cake & Hampers stock, and review POS sales.</p></div><button type="button" onClick={loadProducts} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold"><RefreshCw size={16} className={loading ? "animate-spin" : ""}/> Refresh</button></header>
    <nav className="flex flex-wrap gap-2 rounded-2xl border bg-white p-2">{tabs.map((item) => <button key={item} type="button" onClick={() => { setTab(item); setError(""); }} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${tab === item ? "bg-[#65152D] text-white" : "text-stone-600 hover:bg-stone-100"}`}>{item}</button>)}</nav>
    {error && <p role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><CircleAlert size={16}/>{error}</p>}
    {message && <p role="status" className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800"><Check size={16}/>{message}</p>}

    {tab === "POS Billing" && <form onSubmit={sell} className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <section className="rounded-2xl border bg-white p-4 sm:p-6"><div className="mb-4 flex items-center gap-2"><Store size={19} className="text-[#8f1638]"/><h2 className="text-lg font-bold">Ready Now products</h2></div>
        {loading ? <p className="py-10 text-center text-sm text-stone-500">Loading products…</p> : availableProducts.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{availableProducts.map((product) => { const count = cart[product._id] || 0; return <article key={product._id} className={`rounded-xl border p-4 ${count ? "border-[#8f1638] bg-[#fff8fa]" : ""}`}><div className="flex items-start justify-between gap-2"><div><p className="font-semibold text-stone-900">{product.name}</p><p className="mt-1 text-xs capitalize text-stone-500">{product.readyNowCategory} · {product.inventoryQuantity} in stock</p></div><span className="whitespace-nowrap text-sm font-bold text-[#65152D]">{money(product.flavours?.[0]?.basePrice)}</span></div><div className="mt-4 flex items-center justify-between"><button type="button" onClick={() => addToCart(product, -1)} className="h-9 w-9 rounded-lg border text-lg" aria-label={`Remove one ${product.name}`}>−</button><span className="min-w-8 text-center font-semibold">{count}</span><button type="button" onClick={() => addToCart(product, 1)} disabled={count >= product.inventoryQuantity} className="h-9 w-9 rounded-lg bg-[#65152D] text-lg text-white disabled:opacity-40" aria-label={`Add one ${product.name}`}>+</button></div></article>; })}</div> : <p className="py-10 text-center text-sm text-stone-500">No in-stock Ready Now products. Add products or update store stock below.</p>}
      </section>
      <section className="h-fit rounded-2xl border bg-white p-5"><h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><ShoppingCart size={19}/> Current bill</h2><div className="space-y-3">{Object.entries(cart).map(([id, quantity]) => { const product = products.find((entry) => entry._id === id); return product && <div key={id} className="flex justify-between gap-3 text-sm"><span>{product.name} × {quantity}</span><span className="font-semibold">{money(product.flavours?.[0]?.basePrice * quantity)}</span></div>; })}{!Object.keys(cart).length && <p className="py-4 text-sm text-stone-500">Choose products to start a bill.</p>}</div><div className="my-4 border-t"/><div className="mb-4 flex justify-between text-lg font-bold"><span>Total</span><span>{money(total)}</span></div>
        <div className="space-y-3"><label className="block text-sm font-medium">Customer name<input required minLength="2" maxLength="100" value={customer.customerName} onChange={(event) => setCustomer({ ...customer, customerName: event.target.value })} className={`${inputStyle} mt-1.5`} placeholder="Name"/></label><label className="block text-sm font-medium">Phone number<input required type="tel" value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} className={`${inputStyle} mt-1.5`} placeholder="Customer phone"/></label><label className="block text-sm font-medium">Payment method<select value={customer.paymentMethod} onChange={(event) => setCustomer({ ...customer, paymentMethod: event.target.value })} className={`${inputStyle} mt-1.5`}><option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option></select></label><button disabled={saving || !Object.keys(cart).length} className="w-full rounded-xl bg-[#65152D] px-4 py-3 font-semibold text-white disabled:opacity-50">{saving ? "Completing sale…" : "Complete sale"}</button></div></section>
    </form>}

    {tab === "Ready Now Stock" && <div className="grid gap-5 xl:grid-cols-[350px_1fr]"><form onSubmit={addProduct} className="h-fit space-y-3 rounded-2xl border bg-white p-5"><h2 className="flex items-center gap-2 text-lg font-bold"><PackagePlus size={19}/> Add Ready Now product</h2><label className="block text-sm font-medium">Product name<input required minLength="2" value={newProduct.name} onChange={(event) => setProductName(event.target.value)} className={`${inputStyle} mt-1.5`}/></label><label className="block text-sm font-medium">URL slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={newProduct.slug} onChange={(event) => setNewProduct({ ...newProduct, slug: event.target.value })} className={`${inputStyle} mt-1.5`}/></label><label className="block text-sm font-medium">Category<select value={newProduct.readyNowCategory} onChange={(event) => setNewProduct({ ...newProduct, readyNowCategory: event.target.value })} className={`${inputStyle} mt-1.5`}>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label><label className="block text-sm font-medium">Price<input required type="number" min="1" step="0.01" value={newProduct.price} onChange={(event) => setNewProduct({ ...newProduct, price: event.target.value })} className={`${inputStyle} mt-1.5`}/></label><label className="block text-sm font-medium">Store stock<input required type="number" min="0" step="1" value={newProduct.inventoryQuantity} onChange={(event) => setNewProduct({ ...newProduct, inventoryQuantity: event.target.value })} className={`${inputStyle} mt-1.5`}/></label><label className="block text-sm font-medium">Product image<input required type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setProductImage(event.target.files?.[0] || null)} className={`${inputStyle} mt-1.5`}/><span className="mt-1 flex items-center gap-1 text-xs text-stone-500"><ImagePlus size={13}/> JPG, PNG or WebP, up to 5 MB</span></label><label className="block text-sm font-medium">Description<textarea rows="2" maxLength="2000" value={newProduct.description} onChange={(event) => setNewProduct({ ...newProduct, description: event.target.value })} className={`${inputStyle} mt-1.5`}/></label><button disabled={saving} className="w-full rounded-xl bg-[#65152D] px-4 py-3 font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Add to Ready Now"}</button><p className="text-xs text-stone-500">New items are available in Ready Now on the e-commerce site too.</p></form>
      <section className="rounded-2xl border bg-white p-4 sm:p-6"><h2 className="mb-4 text-lg font-bold">Ready Now store stock</h2>{products.length ? <div className="divide-y">{products.map((product) => <article key={product._id} className="flex flex-wrap items-center gap-3 py-4"><img src={product.images?.[0]?.url || "/images/placeholder.webp"} alt="" className="h-14 w-14 rounded-lg bg-stone-100 object-cover"/><div className="min-w-40 flex-1"><p className="font-semibold">{product.name}</p><p className="text-xs capitalize text-stone-500">{product.readyNowCategory} · {money(product.flavours?.[0]?.basePrice)}</p></div><label className="text-xs text-stone-500">Qty<input aria-label={`Stock quantity for ${product.name}`} type="number" min="0" value={stockValues[product._id] ?? 0} onChange={(event) => setStockValues({ ...stockValues, [product._id]: event.target.value })} className="mt-1 w-24 rounded-lg border px-2 py-2 text-sm text-stone-900"/></label><button type="button" disabled={saving || Number(stockValues[product._id]) === product.inventoryQuantity} onClick={() => updateProduct(product, { inventoryQuantity: Number(stockValues[product._id]) })} className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-40">Save stock</button><button type="button" disabled={saving} onClick={() => updateProduct(product, { isActive: !product.isActive })} className={`rounded-lg px-3 py-2 text-sm font-semibold ${product.isActive ? "bg-amber-50 text-amber-800" : "bg-green-50 text-green-800"}`}>{product.isActive ? "Remove from Ready Now" : "Add to Ready Now"}</button></article>)}</div> : <p className="py-10 text-center text-sm text-stone-500">No Ready Now products yet.</p>}</section></div>}

    {tab === "Delivery" && <section className="rounded-2xl border bg-white p-4 sm:p-6"><div className="mb-4"><h2 className="text-lg font-bold">Store pickup delivery</h2><p className="text-sm text-stone-500">E-commerce orders for customers collecting from the store.</p></div>{pickups.length ? <div className="divide-y">{pickups.map((order) => <article key={order._id} className="flex flex-wrap items-center gap-4 py-4"><img src={order.productImage || order.product?.images?.[0]?.url || "/favicon.svg"} alt={order.productName || "Ordered product"} className="h-20 w-20 shrink-0 rounded-xl border border-stone-200 bg-stone-100 object-cover" loading="lazy"/><div className="min-w-48 flex-1"><p className="font-bold">{order.orderId} · {order.customerName || "Customer"}</p><p className="mt-1 text-sm text-stone-600">{order.productName}</p><p className="mt-1 text-xs text-stone-500">{order.phone} · Pickup {order.delivery?.date} {order.delivery?.time}</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">{order.status}</span><span className="font-bold">{money(order.pricing?.total)}</span><button type="button" disabled={saving} onClick={() => completePickup(order)} className="rounded-lg bg-[#65152D] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Updating…" : "Mark delivered"}</button></article>)}</div> : <div className="py-12 text-center text-sm text-stone-500">{loading ? "Loading store pickups…" : "No store pickup orders waiting."}</div>}</section>}

    {tab === "POS Sales" && <section className="overflow-hidden rounded-2xl border bg-white"><div className="border-b p-5"><h2 className="text-lg font-bold">POS sales</h2><p className="text-sm text-stone-500">Counter sales recorded by the manager.</p></div>{sales.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-stone-50 text-xs uppercase text-stone-500"><tr><th className="px-5 py-3">Sale / time</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Items</th><th className="px-5 py-3">Payment</th><th className="px-5 py-3 text-right">Total</th></tr></thead><tbody className="divide-y">{sales.map((sale) => <tr key={sale._id}><td className="px-5 py-4"><p className="font-semibold">{sale.saleId}</p><p className="text-xs text-stone-500">{new Date(sale.createdAt).toLocaleString("en-IN")}</p></td><td className="px-5 py-4"><p className="font-medium">{sale.customerName}</p><p className="text-xs text-stone-500">{sale.phone}</p></td><td className="px-5 py-4">{sale.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</td><td className="px-5 py-4 capitalize">{sale.paymentMethod}</td><td className="px-5 py-4 text-right font-bold">{money(sale.total)}</td></tr>)}</tbody></table></div> : <div className="py-16 text-center text-sm text-stone-500">{loading ? "Loading POS sales…" : "No POS sales have been recorded yet."}</div>}</section>}
  </main>;
}
