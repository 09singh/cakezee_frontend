
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  FileUp,
  LoaderCircle,
  Plus,
  Search,
  UserRound,
  X,
  Users,
  ShoppingBag,
  IndianRupee,
  CalendarDays,
  Mail,
  Phone,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

import {
  createAdminCustomer,
  getAdminCustomerOrders,
  getAdminCustomers,
  importAdminCustomers,
} from "../../../api/auth.api";

/* ================= CONSTANTS ================= */

const BRAND = "#9c173d";

const filters = ["All", "VIP", "Loyal", "Warm", "At Risk", "Lost"];

const formatMoney = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const customerName = (customer) =>
  customer.name?.trim() || `Customer ${customer.phone || ""}`;

const normalizePhone = (phone) => String(phone || "").replace(/\D/g, "");

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const classifyCustomer = (customer) => {
  const count = Number(customer.orderCount || 0);
  const spent = Number(customer.totalSpent || 0);

  if (spent >= 10000 || count >= 10) return "VIP";
  if (count >= 5) return "Loyal";
  if (!customer.lastOrderAt) return "Lost";

  const lastOrderDate = new Date(customer.lastOrderAt);

  if (Number.isNaN(lastOrderDate.getTime())) return "Lost";

  const days =
    (Date.now() - lastOrderDate.getTime()) / 86400000;

  if (days > 180) return "Lost";
  if (days > 90) return "At Risk";

  return "Warm";
};

const statusClass = {
  VIP: "bg-purple-50 text-purple-700 border-purple-100",
  Loyal: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Warm: "bg-amber-50 text-amber-700 border-amber-100",
  "At Risk": "bg-orange-50 text-orange-700 border-orange-100",
  Lost: "bg-gray-100 text-gray-600 border-gray-200",
};

/* ================= REUSABLE BUTTON ================= */

function PrimaryButton({
  children,
  onClick,
  disabled = false,
  type = "button",
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-[#9c173d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#861334] focus:outline-none focus:ring-2 focus:ring-[#9c173d]/30 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

/* ================= CUSTOMER FORM ================= */

function CustomerForm({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    const phone = normalizePhone(form.phone);

    if (phone.length < 10 || phone.length > 15) {
      setError("Please enter a valid phone number.");
      return;
    }

    setSaving(true);

    try {
      await onSave({
        ...form,
        name: form.name.trim(),
        phone,
        email: form.email.trim(),
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Could not save customer."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-lg space-y-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl sm:p-7"
      >
        <header className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[2px] text-[#9c173d]">
              Customer Management
            </p>

            <h2
              className="mt-1 text-2xl font-semibold text-gray-900"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Add Customer
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </header>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <label className="block text-sm font-medium text-gray-700">
          Customer name

          <input
            required
            maxLength={100}
            value={form.name}
            onChange={(event) =>
              setForm({ ...form, name: event.target.value })
            }
            className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 font-normal outline-none transition placeholder:text-gray-400 focus:border-[#9c173d] focus:ring-2 focus:ring-[#9c173d]/10"
            placeholder="Enter customer name"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Phone number

          <input
            required
            type="tel"
            minLength={10}
            maxLength={16}
            value={form.phone}
            onChange={(event) =>
              setForm({ ...form, phone: event.target.value })
            }
            className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 font-normal outline-none transition placeholder:text-gray-400 focus:border-[#9c173d] focus:ring-2 focus:ring-[#9c173d]/10"
            placeholder="Enter phone number"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Email <span className="font-normal text-gray-400">(optional)</span>

          <input
            type="email"
            maxLength={254}
            value={form.email}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
            className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 font-normal outline-none transition placeholder:text-gray-400 focus:border-[#9c173d] focus:ring-2 focus:ring-[#9c173d]/10"
            placeholder="customer@example.com"
          />
        </label>

        <footer className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <PrimaryButton type="submit" disabled={saving}>
            {saving ? (
              <>
                <LoaderCircle size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus size={17} />
                Save Customer
              </>
            )}
          </PrimaryButton>
        </footer>
      </form>
    </div>
  );
}

/* ================= CUSTOMER DETAILS ================= */

function CustomerDetails({ customer, onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");

    getAdminCustomerOrders(customer.phone)
      .then((response) => {
        if (active) {
          setOrders(Array.isArray(response.data) ? response.data : []);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err?.response?.data?.message ||
              "Could not load customer orders."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [customer.phone]);

  const customerStatus = classifyCustomer(customer);

  return (
    <section className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-[#9c173d] transition hover:text-[#861334]"
      >
        <ArrowLeft size={17} />
        Back to customers
      </button>

      {/* CUSTOMER PROFILE */}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#fff1f3] text-xl font-bold text-[#9c173d]">
              {customerName(customer).charAt(0).toUpperCase() || (
                <UserRound size={22} />
              )}
            </span>

            <div className="min-w-0">
              <h2
                className="break-words text-2xl font-semibold text-gray-900"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {customerName(customer)}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={14} />
                  {customer.phone}
                </span>

                {customer.email && (
                  <span className="inline-flex items-center gap-1.5 break-all">
                    <Mail size={14} />
                    {customer.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          <span
            className={`rounded-full border px-3 py-1.5 text-xs font-bold ${statusClass[customerStatus]}`}
          >
            {customerStatus}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric
            label="Total orders"
            value={customer.orderCount || 0}
            icon={<ShoppingBag size={17} />}
          />

          <Metric
            label="Total spent"
            value={formatMoney(customer.totalSpent)}
            icon={<IndianRupee size={17} />}
          />

          <Metric
            label="Last order"
            value={
              customer.lastOrderAt
                ? formatDate(customer.lastOrderAt)
                : "No orders"
            }
            icon={<CalendarDays size={17} />}
          />

          <Metric
            label="Customer since"
            value={formatDate(customer.createdAt)}
            icon={<Users size={17} />}
          />
        </div>
      </div>

      {/* ORDER HISTORY */}

      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3
              className="text-xl font-semibold text-gray-900"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Order History
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Previous orders placed by this customer.
            </p>
          </div>

          {!loading && (
            <span className="rounded-full bg-[#fff1f3] px-3 py-1.5 text-xs font-bold text-[#9c173d]">
              {orders.length} orders
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-10 text-sm text-gray-500">
            <LoaderCircle size={18} className="animate-spin text-[#9c173d]" />
            Loading orders...
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fff1f3] text-[#9c173d]">
              <ShoppingBag size={22} />
            </span>

            <p className="mt-3 font-semibold text-gray-800">
              No orders yet
            </p>

            <p className="mt-1 text-sm text-gray-500">
              This customer's order history will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <article
                key={order._id || order.orderId}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-[#9c173d]/20"
              >
                <div className="min-w-0">
                  <p className="break-words font-semibold text-gray-900">
                    {order.productName || "Order"}

                    {order.orderId && (
                      <span className="ml-2 text-xs font-normal text-gray-400">
                        {order.orderId}
                      </span>
                    )}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {order.delivery?.date
                      ? formatDate(order.delivery.date)
                      : formatDate(order.createdAt)}

                    {order.delivery?.time &&
                      ` · ${order.delivery.time}`}

                    {order.flavour && ` · ${order.flavour}`}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-[#9c173d]">
                    {formatMoney(order.pricing?.total)}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {order.status || "Status unavailable"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ================= METRIC CARD ================= */

function Metric({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-[#faf8f6] p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-gray-500">{label}</p>

        <span className="text-[#9c173d]">{icon}</span>
      </div>

      <p className="mt-2 break-words text-base font-bold text-gray-900 sm:text-lg">
        {value}
      </p>
    </div>
  );
}

/* ================= CUSTOMERS DASHBOARD ================= */

function CustomersDashboard() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState("");

  const fileRef = useRef(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getAdminCustomers();

      setCustomers(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Could not load customers."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    getAdminCustomers()
      .then((response) => {
        if (active) {
          setCustomers(
            Array.isArray(response.data) ? response.data : []
          );
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err?.response?.data?.message ||
              "Could not load customers."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const visibleCustomers = useMemo(() => {
    const searchText = query.trim().toLowerCase();

    return customers.filter((customer) => {
      const text = [
        customer.name || "",
        customer.phone || "",
        customer.email || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        !searchText || text.includes(searchText);

      const matchesFilter =
        filter === "All" ||
        classifyCustomer(customer) === filter;

      return matchesQuery && matchesFilter;
    });
  }, [customers, filter, query]);

  const summary = useMemo(() => {
    return {
      total: customers.length,
      vip: customers.filter(
        (customer) => classifyCustomer(customer) === "VIP"
      ).length,
      orders: customers.reduce(
        (total, customer) => total + Number(customer.orderCount || 0),
        0
      ),
      revenue: customers.reduce(
        (total, customer) => total + Number(customer.totalSpent || 0),
        0
      ),
    };
  }, [customers]);

  const saveCustomer = async (form) => {
    await createAdminCustomer(form);

    setShowForm(false);
    setNotice("Customer saved successfully.");
    setError("");

    await loadCustomers();
  };

  const importFile = async (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    setError("");
    setNotice("");
    setImporting(true);

    try {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        throw new Error("Please select a CSV file.");
      }

      const content = await file.text();

      const rows = content
        .split(/\r?\n/)
        .filter((line) => line.trim());

      if (rows.length < 2) {
        throw new Error("The CSV file has no customer rows.");
      }

      const parseRow = (line) => {
        const values = [];
        let value = "";
        let quoted = false;

        for (let index = 0; index < line.length; index += 1) {
          const char = line[index];

          if (
            char === '"' &&
            line[index + 1] === '"' &&
            quoted
          ) {
            value += '"';
            index += 1;
          } else if (char === '"') {
            quoted = !quoted;
          } else if (char === "," && !quoted) {
            values.push(value.trim());
            value = "";
          } else {
            value += char;
          }
        }

        values.push(value.trim());

        return values;
      };

      const headers = parseRow(rows.shift() || "").map(
        (header) =>
          header.toLowerCase().replace(/[^a-z]/g, "")
      );

      const nameIndex = headers.findIndex((header) =>
        ["name", "customer", "customername"].includes(header)
      );

      const phoneIndex = headers.findIndex((header) =>
        [
          "phone",
          "mobile",
          "mobilenumber",
          "phonenumber",
        ].includes(header)
      );

      const emailIndex = headers.findIndex(
        (header) => header === "email"
      );

      if (nameIndex < 0 || phoneIndex < 0) {
        throw new Error(
          "CSV needs name and phone columns. Example: name,phone,email"
        );
      }

      const data = rows
        .map(parseRow)
        .map((row) => ({
          name: row[nameIndex]?.trim() || "",
          phone: normalizePhone(row[phoneIndex]),
          email:
            emailIndex >= 0 ? row[emailIndex]?.trim() || "" : "",
        }))
        .filter(
          (row) =>
            row.name &&
            row.phone.length >= 10 &&
            row.phone.length <= 15
        );

      if (!data.length) {
        throw new Error(
          "No valid customer rows found. Check customer names and phone numbers."
        );
      }

      if (data.length > 500) {
        throw new Error(
          "Import up to 500 customers at a time."
        );
      }

      const response = await importAdminCustomers(data);
      const result = response.data || {};

      setNotice(
        `Import complete: ${result.created ?? 0} added, ${
          result.updated ?? 0
        } updated, ${result.skipped ?? 0} skipped.`
      );

      await loadCustomers();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Could not import CSV."
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f5f2] px-4 py-6 sm:px-6 lg:px-8">
      {selected ? (
        <CustomerDetails
          customer={selected}
          onBack={() => setSelected(null)}
        />
      ) : (
        <>
          {/* PAGE HEADER */}

          <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[2px] text-[#9c173d]">
                Customer Management
              </p>

              <h1
                className="mt-1 text-3xl font-semibold text-gray-900"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Customers
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Manage customer profiles, loyalty and order history.
              </p>

              <p className="mt-2 text-sm font-medium text-gray-600">
                {customers.length} total customers
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={importing}
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-[#9c173d]/30 hover:bg-[#fff7f8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {importing ? (
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <FileUp size={17} />
                )}

                {importing ? "Importing..." : "Bulk Import"}
              </button>

              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={importFile}
              />

              <PrimaryButton onClick={() => setShowForm(true)}>
                <Plus size={18} />
                Add Customer
              </PrimaryButton>
            </div>
          </header>

          {/* SUMMARY CARDS */}

          <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryCard
              title="Total Customers"
              value={summary.total.toLocaleString("en-IN")}
              icon={<Users size={19} />}
            />

            <SummaryCard
              title="VIP Customers"
              value={summary.vip.toLocaleString("en-IN")}
              icon={<UserRound size={19} />}
            />

            <SummaryCard
              title="Total Orders"
              value={summary.orders.toLocaleString("en-IN")}
              icon={<ShoppingBag size={19} />}
            />

            <SummaryCard
              title="Total Customer Spend"
              value={formatMoney(summary.revenue)}
              icon={<IndianRupee size={19} />}
            />
          </section>

          {/* FEEDBACK */}

          {(error || notice) && (
            <div
              role={error ? "alert" : "status"}
              className={`mb-4 flex items-start justify-between gap-3 rounded-xl border p-3 text-sm ${
                error
                  ? "border-red-100 bg-red-50 text-red-700"
                  : "border-emerald-100 bg-emerald-50 text-emerald-800"
              }`}
            >
              <span>{error || notice}</span>

              {error && (
                <button
                  type="button"
                  onClick={loadCustomers}
                  className="shrink-0 font-semibold underline"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {/* CUSTOMER LIST PANEL */}

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* SEARCH */}

            <div className="border-b border-gray-100 p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2
                    className="text-lg font-semibold text-gray-900"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    Customer Directory
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Select a customer to view their order history.
                  </p>
                </div>

                <div className="relative w-full lg:max-w-sm">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    value={query}
                    onChange={(event) =>
                      setQuery(event.target.value)
                    }
                    aria-label="Search customers"
                    className="h-11 w-full rounded-lg border border-gray-200 bg-[#fdfcfb] pl-10 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#9c173d] focus:bg-white focus:ring-2 focus:ring-[#9c173d]/10"
                    placeholder="Search by name, phone or email..."
                  />
                </div>
              </div>

              {/* FILTERS */}

              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {filters.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setFilter(item)}
                    aria-pressed={filter === item}
                    className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                      filter === item
                        ? "border-[#9c173d] bg-[#9c173d] text-white"
                        : "border-gray-200 bg-white text-gray-600 hover:border-[#9c173d]/30 hover:bg-[#fff7f8] hover:text-[#9c173d]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* RESULTS */}

            <div className="p-3 sm:p-4">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
                  <LoaderCircle
                    size={19}
                    className="animate-spin text-[#9c173d]"
                  />
                  Loading customers...
                </div>
              ) : visibleCustomers.length === 0 ? (
                <div className="py-14 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff1f3] text-[#9c173d]">
                    {query || filter !== "All" ? (
                      <Search size={23} />
                    ) : (
                      <Users size={23} />
                    )}
                  </span>

                  <h3
                    className="mt-4 text-lg font-semibold text-gray-900"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {query || filter !== "All"
                      ? "No matching customers"
                      : "No customers yet"}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {query || filter !== "All"
                      ? "Try changing your search or filter."
                      : "Add a customer or import a CSV file to get started."}
                  </p>

                  {(query || filter !== "All") && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setFilter("All");
                      }}
                      className="mt-4 text-sm font-semibold text-[#9c173d] hover:underline"
                    >
                      Clear search and filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="px-1 pb-1 text-xs text-gray-500">
                    Showing {visibleCustomers.length} of{" "}
                    {customers.length} customers
                  </div>

                  {visibleCustomers.map((customer) => {
                    const name = customerName(customer);
                    const status = classifyCustomer(customer);

                    return (
                      <button
                        type="button"
                        key={customer.id || customer.phone}
                        onClick={() => setSelected(customer)}
                        className="group flex w-full items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-3 text-left transition hover:border-[#9c173d]/25 hover:bg-[#fdfaf8] hover:shadow-sm sm:gap-4 sm:p-4"
                      >
                        {/* CUSTOMER IDENTITY */}

                        <span className="flex min-w-0 flex-1 items-center gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff1f3] text-base font-bold text-[#9c173d] transition group-hover:bg-[#9c173d] group-hover:text-white">
                            {name.charAt(0).toUpperCase() || (
                              <UserRound size={19} />
                            )}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-gray-900">
                              {name}
                            </span>

                            <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                              <span className="inline-flex items-center gap-1">
                                <Phone size={12} />
                                {customer.phone || "No phone"}
                              </span>

                              {customer.email && (
                                <span className="hidden items-center gap-1 truncate sm:inline-flex">
                                  <Mail size={12} />
                                  {customer.email}
                                </span>
                              )}
                            </span>
                          </span>
                        </span>

                        {/* CUSTOMER METRICS */}

                        <span className="flex shrink-0 items-center gap-2 sm:gap-4">
                          <span className="hidden text-right sm:block">
                            <span className="block text-sm font-bold text-gray-900">
                              {formatMoney(customer.totalSpent)}
                            </span>

                            <span className="mt-1 block text-xs text-gray-500">
                              {customer.orderCount || 0}{" "}
                              {(Number(customer.orderCount) || 0) === 1
                                ? "order"
                                : "orders"}
                            </span>
                          </span>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-bold sm:px-3 sm:text-xs ${statusClass[status]}`}
                          >
                            {status}
                          </span>

                          <ChevronRight
                            size={17}
                            className="shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-[#9c173d]"
                          />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* ADD CUSTOMER MODAL */}

      {showForm && (
        <CustomerForm
          onClose={() => setShowForm(false)}
          onSave={saveCustomer}
        />
      )}
    </div>
  );
}

/* ================= SUMMARY CARD ================= */

function SummaryCard({ title, value, icon }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-[#9c173d]/20 hover:shadow-md sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-gray-500 sm:text-sm">
          {title}
        </p>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fff1f3] text-[#9c173d]">
          {icon}
        </span>
      </div>

      <p className="mt-3 break-words text-xl font-bold text-gray-900 sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

export default CustomersDashboard;
