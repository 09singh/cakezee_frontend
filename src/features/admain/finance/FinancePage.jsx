
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Eye,
  Plus,
  Printer,
  RefreshCw,
  Wallet,
  X,
} from "lucide-react";
import { createFinanceAdjustment, getFinance, getFinanceInvoice } from "./finance.api";

const tabs = ["Invoices", "Reconciliation", "Outstanding", "Credit Notes", "Store Credit"];

const localDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const initialFilters = () => {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 29);

  return {
    from: localDate(from),
    to: localDate(today),
    mode: "all",
    type: "all",
  };
};

const emptyData = {
  invoices: [],
  reconciliation: {
    items: [],
    totals: { total: 0, upi: 0, cash: 0, other: 0, driver: 0 },
  },
  outstanding: { items: [], total: 0 },
  creditNotes: [],
  storeCredits: [],
};

const rupees = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

function getReconciliationTotals(items, reportedTotals = {}) {
  const transactions = Array.isArray(items) ? items : [];
  const hasReportedTotals = ["total", "upi", "cash", "other", "driver"]
    .every((key) => Number.isFinite(Number(reportedTotals[key])));

  if (transactions.length) {
    return transactions.reduce(
      (totals, item) => {
        const amount = Number(item.amount) || 0;
        const mode = String(item.mode || "").trim().toLowerCase();
        totals.total += amount;

        if (["cash", "cod"].includes(mode)) {
          totals.cash += amount;
          if (/driver|delivery/i.test(String(item.receivedBy || ""))) {
            totals.driver += amount;
          }
        } else if (mode === "upi") {
          totals.upi += amount;
        } else {
          totals.other += amount;
        }

        return totals;
      },
      { total: 0, upi: 0, cash: 0, other: 0, driver: 0 }
    );
  }

  if (hasReportedTotals) {
    return {
      total: Number(reportedTotals.total) || 0,
      upi: Number(reportedTotals.upi) || 0,
      cash: Number(reportedTotals.cash) || 0,
      other: Number(reportedTotals.other) || 0,
      driver: Number(reportedTotals.driver) || 0,
    };
  }

  return { total: 0, upi: 0, cash: 0, other: 0, driver: 0 };
}

function matchesReconciliationMode(item, mode) {
  const normalizedMode = String(item?.mode || item?.method || "")
    .trim()
    .toLowerCase();

  if (mode === "all") return true;
  if (mode === "cash") return ["cash", "cod"].includes(normalizedMode);
  if (mode === "cod") return normalizedMode === "cod";
  if (mode === "upi") return normalizedMode === "upi";
  if (mode === "other") return !["cash", "cod", "upi"].includes(normalizedMode);

  return true;
}

function matchesReconciliationType(item, type) {
  if (type === "all") return true;

  const normalizedType = String(item?.type || item?.channel || "")
    .trim()
    .toLowerCase();

  return normalizedType === type.toLowerCase();
}

const dateLabel = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const dateTimeLabel = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

const csvEscape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

const fieldClass =
  "mt-1 w-full rounded-lg border border-[#E8D9D5] bg-white px-3 py-2.5 text-sm text-[#35262A] outline-none transition focus:border-[#65152D] focus:ring-2 focus:ring-[#65152D]/10 disabled:cursor-not-allowed disabled:bg-[#F8EBDD]";

const buttonSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-[#E8D9D5] bg-white px-4 py-2.5 text-sm font-semibold text-[#35262A] transition hover:border-[#65152D] hover:bg-[#FFF5E9] disabled:cursor-not-allowed disabled:opacity-50";

const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#65152D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#501023] disabled:cursor-not-allowed disabled:opacity-50";

function exportCsv(name, rows) {
  if (!rows.length) return;

  const columns = Object.keys(rows[0]);

  const content = [
    columns.map(csvEscape).join(","),
    ...rows.map((row) =>
      columns.map((column) => csvEscape(row[column])).join(",")
    ),
  ].join("\r\n");

  const link = document.createElement("a");
  link.href = URL.createObjectURL(
    new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" })
  );
  link.download = `${name}-${localDate(new Date())}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function getInvoiceLines(order) {
  if (!order) return [];

  const pricing = order.pricing || {};
  const quantity = Math.max(1, Number(order.quantity) || 1);
  const addons = Array.isArray(order.addons) ? order.addons : [];

  const addonTotal = Number(
    pricing.addonsTotal ??
      addons.reduce(
        (sum, addon) => sum + Number(addon.price || 0) * quantity,
        0
      )
  );

  const cakeTotal = Number(
    pricing.cakePrice ??
      Math.max(
        0,
        Number(pricing.subtotal || pricing.total || 0) -
          addonTotal -
          Number(pricing.deliveryFee || 0)
      )
  );

  const lines = [
    {
      description: [order.productName, order.flavour, order.size]
        .filter(Boolean)
        .join(" · "),
      hsn: "19059090",
      quantity,
      amount: cakeTotal,
    },
  ];

  for (const addon of addons) {
    lines.push({
      description: addon.name || "Add-on",
      hsn: "21069099",
      quantity,
      amount: Number(addon.price || 0) * quantity,
    });
  }

  if (Number(pricing.deliveryFee || 0) > 0) {
    lines.push({
      description: "Delivery charge",
      hsn: "9968",
      quantity: 1,
      amount: Number(pricing.deliveryFee),
    });
  }

  if (Number(pricing.discount || 0) > 0) {
    lines.push({
      description: `Discount${order.coupon?.code ? ` (${order.coupon.code})` : ""}`,
      hsn: "",
      quantity: 1,
      amount: -Number(pricing.discount),
    });
  }

  return lines;
}

function amountInWords(value) {
  const ones = [
    "Zero",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const belowThousand = (number) => {
    let result = "";

    if (number >= 100) {
      result += `${ones[Math.floor(number / 100)]} Hundred `;
    }

    number %= 100;

    if (number >= 20) {
      result += `${tens[Math.floor(number / 10)]}${
        number % 10 ? ` ${ones[number % 10]}` : ""
      }`;
    } else if (number > 0) {
      result += ones[number];
    }

    return result.trim();
  };

  let number = Math.floor(Math.abs(Number(value) || 0));

  if (!number) return "Zero Only";

  const parts = [];

  for (const [size, name] of [
    [10000000, "Crore"],
    [100000, "Lakh"],
    [1000, "Thousand"],
    [1, ""],
  ]) {
    const group = Math.floor(number / size);
    number %= size;

    if (group) {
      parts.push(`${belowThousand(group)}${name ? ` ${name}` : ""}`);
    }
  }

  return `${parts.join(" ")} Only`;
}

function FinancePage() {
  const [tab, setTab] = useState("Invoices");
  const [filters, setFilters] = useState(initialFilters);
  const [invoiceFilter, setInvoiceFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const [adjustmentForm, setAdjustmentForm] = useState({
    orderId: "",
    kind: "credit-note",
    amount: "",
    reason: "",
    method: "cash",
  });

  const [savingAdjustment, setSavingAdjustment] = useState(false);
  const loadRef = useRef(null);

  const load = useCallback(
    async (nextFilters = filters) => {
      setLoading(true);
      setError("");

      try {
        const result = await getFinance(nextFilters);

        setData({
          ...emptyData,
          ...result,
          reconciliation: {
            ...emptyData.reconciliation,
            ...result?.reconciliation,
            items: Array.isArray(result?.reconciliation?.items)
              ? result.reconciliation.items
              : [],
            totals: {
              ...emptyData.reconciliation.totals,
              ...result?.reconciliation?.totals,
            },
          },
          outstanding: {
            ...emptyData.outstanding,
            ...result?.outstanding,
          },
        });
      } catch (loadError) {
        setError(
          loadError.response?.data?.message ||
            "Could not load finance records."
        );
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    const initialLoad = window.setTimeout(
      () => loadRef.current?.(initialFilters()),
      0
    );

    return () => window.clearTimeout(initialLoad);
  }, []);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") load();
    };

    const interval = window.setInterval(refresh, 30000);

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);

  const invoices = useMemo(
    () =>
      data.invoices.filter((item) => {
        const itemMode = String(item.mode || "").toLowerCase();

        const matchesType =
          invoiceFilter === "all" ||
          (invoiceFilter === "cash"
            ? ["cash", "cod"].includes(itemMode)
            : item.type?.toLowerCase() === invoiceFilter);

        const text =
          `${item.orderId} ${item.customerName} ${item.phone} ${item.productName}`.toLowerCase();

        return matchesType && text.includes(search.toLowerCase());
      }),
    [data.invoices, invoiceFilter, search]
  );

  const reconciliationItems = useMemo(
    () =>
      (Array.isArray(data.reconciliation.items)
        ? data.reconciliation.items
        : []
      ).filter((item) => {
        const matchesType = matchesReconciliationType(item, filters.type);
        const matchesMode = matchesReconciliationMode(item, filters.mode);
        const text =
          `${item.orderId} ${item.customerName} ${item.phone} ${item.receivedBy}`.toLowerCase();

        return matchesType && matchesMode && text.includes(search.toLowerCase());
      }),
    [data.reconciliation.items, filters.mode, filters.type, search]
  );
  const reconciliationTotals = useMemo(
    () =>
      getReconciliationTotals(
        reconciliationItems,
        data.reconciliation.totals
      ),
    [reconciliationItems, data.reconciliation.totals]
  );

  const refresh = () => load(filters);

  const setDatePreset = (days) => {
    const to = new Date();
    const from = new Date(to);

    from.setDate(from.getDate() - days + 1);

    const next = {
      ...filters,
      from: localDate(from),
      to: localDate(to),
    };

    setFilters(next);
    load(next);
  };

  const thisMonth = () => {
    const to = new Date();

    const next = {
      ...filters,
      from: localDate(new Date(to.getFullYear(), to.getMonth(), 1)),
      to: localDate(to),
    };

    setFilters(next);
    load(next);
  };

  const applyFilters = () => load(filters);

  const updateFilter = (key, value) => {
    const next = { ...filters, [key]: value };

    setFilters(next);
    load(next);
  };

  const openInvoice = async (orderId) => {
    setInvoiceLoading(true);
    setError("");

    try {
      const invoice = await getFinanceInvoice(orderId);
      setSelectedInvoice(invoice);
    } catch (invoiceError) {
      setError(
        invoiceError.response?.data?.message ||
          "Could not load this invoice."
      );
    } finally {
      setInvoiceLoading(false);
    }
  };

  const submitAdjustment = async (event) => {
    event.preventDefault();

    setSavingAdjustment(true);
    setError("");
    setNotice("");

    try {
      await createFinanceAdjustment({
        ...adjustmentForm,
        amount: Number(adjustmentForm.amount),
      });

      setAdjustmentForm({
        orderId: "",
        kind: "credit-note",
        amount: "",
        reason: "",
        method: "cash",
      });

      setNotice("Credit note / refund recorded successfully.");
      await load(filters);
    } catch (saveError) {
      setError(
        saveError.response?.data?.message ||
          "Could not create the credit note or refund."
      );
    } finally {
      setSavingAdjustment(false);
    }
  };

  const copyReminder = async (item) => {
    const message = `Hello ${item.customerName}, a payment of ${rupees(
      item.outstanding
    )} for Cakezee order ${item.orderId} is pending. Please contact us to complete the payment. Thank you.`;

    try {
      await navigator.clipboard.writeText(message);
      setCopied(item.orderId);
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      setError("Could not copy reminder text on this device.");
    }
  };

  const exportCurrent = () => {
    if (tab === "Invoices") {
      exportCsv(
        "cakezee-invoices",
        invoices.map((item) => ({
          invoice: item.orderId,
          date: dateLabel(item.date),
          customer: item.customerName,
          phone: item.phone,
          type: item.type,
          mode: item.mode,
          status: item.status,
          discount: item.discount,
          coupon: item.couponCode,
          amount: item.total,
        }))
      );
    } else if (tab === "Reconciliation") {
      exportCsv(
        "cakezee-reconciliation",
        reconciliationItems.map((item) => ({
          date: dateTimeLabel(item.date),
          customer: item.customerName,
          phone: item.phone,
          invoice: item.orderId,
          type: item.type,
          mode: item.mode,
          transaction: item.transactionType || "Payment",
          receivedBy: item.receivedBy,
          amount: item.amount,
        }))
      );
    } else if (tab === "Outstanding") {
      exportCsv(
        "cakezee-outstanding",
        data.outstanding.items.map((item) => ({
          customer: item.customerName,
          phone: item.phone,
          invoice: item.orderId,
          deliveryDate: item.deliveryDate,
          total: item.total,
          collected: item.collected,
          outstanding: item.outstanding,
          overdue: item.overdue ? "Yes" : "No",
        }))
      );
    } else if (tab === "Credit Notes") {
      exportCsv(
        "cakezee-credit-notes",
        data.creditNotes.map((item) => ({
          date: dateLabel(item.date),
          customer: item.customerName,
          phone: item.phone,
          invoice: item.orderId,
          type: item.kind,
          reason: item.reason,
          status: item.status,
          amount: item.amount,
        }))
      );
    } else {
      exportCsv("cakezee-store-credit", data.storeCredits);
    }
  };

  const modeFilters = ["all", "cash", "cod", "upi", "other"];
  const invoiceCount = data.invoices.length;
  const exportLabel =
    tab === "Outstanding" ? "Export Outstanding" : `Export ${tab}`;

  return (
    <main className="mx-auto min-h-screen max-w-7xl bg-[#FFF5E9] p-4 text-[#35262A] md:p-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.16em] text-[#65152D]">
            Admin reports
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#35262A]">
            Finances
          </h1>
          <p className="mt-1 text-sm text-[#78676A]">
            Invoices, received payments, and outstanding balances.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className={buttonSecondary}
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={exportCurrent}
            disabled={loading}
            className={buttonPrimary}
          >
            <Download size={16} />
            {exportLabel} (.csv)
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {notice && (
        <p
          role="status"
          className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800"
        >
          {notice}
        </p>
      )}

      <nav className="mb-5 flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-[#E8D9D5] bg-[#F8EBDD] p-2">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setTab(item);
              setSearch("");
            }}
            className={`shrink-0 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              tab === item
                ? "bg-[#65152D] text-white shadow-sm"
                : "text-[#78676A] hover:bg-white hover:text-[#65152D]"
            }`}
          >
            {item}
            {item === "Outstanding" && data.outstanding.items.length
              ? ` (${data.outstanding.items.length})`
              : ""}
          </button>
        ))}
      </nav>

      <section className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-[#E8D9D5] bg-white p-4 shadow-sm">
        <label className="flex flex-col gap-1 text-sm font-semibold text-[#35262A]">
          From
          <input
            type="date"
            value={filters.from}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                from: event.target.value,
              }))
            }
            className="rounded-lg border border-[#E8D9D5] bg-white px-3 py-2 font-normal outline-none focus:border-[#65152D] focus:ring-2 focus:ring-[#65152D]/10"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold text-[#35262A]">
          To
          <input
            type="date"
            value={filters.to}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                to: event.target.value,
              }))
            }
            className="rounded-lg border border-[#E8D9D5] bg-white px-3 py-2 font-normal outline-none focus:border-[#65152D] focus:ring-2 focus:ring-[#65152D]/10"
          />
        </label>

        <button
          type="button"
          onClick={applyFilters}
          className={buttonPrimary}
        >
          Apply
        </button>

        <button
          type="button"
          onClick={thisMonth}
          className="rounded-xl bg-[#F8EBDD] px-4 py-2.5 text-sm font-semibold text-[#65152D] transition hover:bg-[#EEDCCD]"
        >
          This Month
        </button>

        <button
          type="button"
          onClick={() => setDatePreset(7)}
          className="rounded-xl bg-[#F8EBDD] px-4 py-2.5 text-sm font-semibold text-[#65152D] transition hover:bg-[#EEDCCD]"
        >
          Last 7 Days
        </button>

        <button
          type="button"
          onClick={() => setDatePreset(30)}
          className="rounded-xl bg-[#F8EBDD] px-4 py-2.5 text-sm font-semibold text-[#65152D] transition hover:bg-[#EEDCCD]"
        >
          Last 30 Days
        </button>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-[#E8D9D5] bg-white py-16 text-center text-sm text-[#78676A]">
          <RefreshCw
            size={22}
            className="mx-auto mb-3 animate-spin text-[#65152D]"
          />
          Loading finance data…
        </div>
      ) : (
        <>
          {tab === "Invoices" && (
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {[
                    ["all", "All"],
                    ["website", "Website"],
                    ["admin", "Admin"],
                    ["cash", "Cash / COD"],
                    ["upi", "UPI"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setInvoiceFilter(key)}
                      className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                        invoiceFilter === key
                          ? "bg-[#65152D] text-white"
                          : "border border-[#E8D9D5] bg-white text-[#78676A] hover:bg-[#F8EBDD]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <SearchBox
                  value={search}
                  onChange={setSearch}
                  placeholder="Search invoice, customer, phone…"
                />
              </div>

              <div className="space-y-3">
                {invoices.map((item) => (
                  <button
                    key={item.orderId}
                    type="button"
                    onClick={() => openInvoice(item.orderId)}
                    className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E8D9D5] bg-white px-5 py-4 text-left shadow-sm transition hover:border-[#65152D] hover:shadow-md"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm text-[#65152D]">
                          {item.orderId}
                        </strong>

                        <span className="rounded-full bg-[#F8EBDD] px-2.5 py-1 text-[10px] font-bold uppercase text-[#78676A]">
                          {item.type}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            item.status === "Cancelled"
                              ? "bg-red-50 text-red-700"
                              : "bg-green-50 text-green-800"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-[#78676A]">
                        {item.productName} · {item.customerName} · {item.phone} ·{" "}
                        {dateLabel(item.date)}
                      </p>

                      {item.couponCode && (
                        <p className="mt-1 text-xs text-[#65152D]">
                          Coupon {item.couponCode} · {item.discount}% off
                        </p>
                      )}
                    </div>

                    <span className="flex items-center gap-2 text-right">
                      <strong className="text-base text-[#65152D]">
                        {rupees(item.total)}
                      </strong>
                      <Eye size={16} className="text-[#65152D]" />
                    </span>
                  </button>
                ))}

                {!invoices.length && (
                  <Empty
                    text={
                      invoiceCount
                        ? "No invoices match these filters."
                        : "No invoices found for this date range."
                    }
                  />
                )}
              </div>
            </section>
          )}

          {tab === "Reconciliation" && (
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {modeFilters.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => updateFilter("mode", key)}
                      className={`rounded-full px-4 py-2 text-xs font-bold uppercase transition ${
                        filters.mode === key
                          ? "bg-[#65152D] text-white"
                          : "border border-[#E8D9D5] bg-white text-[#78676A] hover:bg-[#F8EBDD]"
                      }`}
                    >
                      {key === "all" ? "All modes" : key}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Order type"
                    value={filters.type}
                    onChange={(event) =>
                      updateFilter("type", event.target.value)
                    }
                    className="rounded-lg border border-[#E8D9D5] bg-white px-3 py-2 text-sm outline-none focus:border-[#65152D]"
                  >
                    <option value="all">All channels</option>
                    <option value="website">Website</option>
                    <option value="admin">Admin</option>
                  </select>

                  <SearchBox
                    value={search}
                    onChange={setSearch}
                    placeholder="Search order or customer…"
                  />
                </div>
              </div>

              <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Metric
                  label="Total Revenue"
                  value={reconciliationTotals.total}
                />
                <Metric
                  label="UPI"
                  value={reconciliationTotals.upi}
                  tone="green"
                />
                <Metric
                  label="Cash"
                  value={reconciliationTotals.cash}
                />
                <Metric
                  label="Other Modes"
                  value={reconciliationTotals.other}
                  tone="blue"
                />
                <Metric
                  label="Cash by Driver"
                  value={reconciliationTotals.driver}
                  tone="amber"
                />
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#E8D9D5] bg-white shadow-sm">
                <table className="min-w-[900px] w-full text-left text-sm">
                  <thead className="bg-[#F8EBDD] text-xs uppercase tracking-wide text-[#78676A]">
                    <tr>
                      {[
                        "Date",
                        "Customer / Order",
                        "Type",
                        "Mode",
                        "Transaction",
                        "Received by",
                        "Amount",
                      ].map((label) => (
                        <th key={label} className="px-4 py-3">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#E8D9D5]">
                    {reconciliationItems.map((item, index) => (
                      <tr
                        key={`${item.orderId}-${item.date}-${index}`}
                        className="cursor-pointer transition hover:bg-[#FFF5E9]"
                        onClick={() => openInvoice(item.orderId)}
                      >
                        <td className="px-4 py-3">
                          {dateTimeLabel(item.date)}
                        </td>

                        <td className="px-4 py-3">
                          <strong>{item.customerName}</strong>
                          <div className="text-xs text-[#65152D]">
                            {item.orderId} · {item.phone}
                          </div>
                        </td>

                        <td className="px-4 py-3">{item.type}</td>
                        <td className="px-4 py-3 uppercase">{item.mode}</td>
                        <td className="px-4 py-3">
                          {item.transactionType || "Payment"}
                        </td>
                        <td className="px-4 py-3">{item.receivedBy}</td>

                        <td
                          className={`px-4 py-3 font-bold ${
                            Number(item.amount) < 0
                              ? "text-red-700"
                              : "text-[#65152D]"
                          }`}
                        >
                          {rupees(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {!reconciliationItems.length && (
                  <Empty text="No payment transactions match these filters." />
                )}
              </div>
            </section>
          )}

          {tab === "Outstanding" && (
            <section>
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-2xl font-bold text-red-800">
                      {rupees(data.outstanding.total)}
                    </p>
                    <p className="mt-1 text-sm text-red-600">
                      Outstanding across {data.outstanding.items.length}{" "}
                      delivered{" "}
                      {data.outstanding.items.length === 1 ? "order" : "orders"}
                    </p>
                  </div>

                  <span className="text-xs text-[#78676A]">
                    Sorted by delivery date · oldest first
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {data.outstanding.items.map((item) => (
                  <article
                    key={item.orderId}
                    className={`rounded-2xl border border-[#E8D9D5] border-l-4 bg-white p-5 shadow-sm ${
                      item.overdue
                        ? "border-l-red-500"
                        : "border-l-amber-400"
                    }`}
                  >
                    <div className="flex flex-wrap justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => openInvoice(item.orderId)}
                        className="text-left"
                      >
                        <strong className="text-[#35262A]">
                          {item.customerName}
                        </strong>

                        <p className="mt-1 text-sm text-[#65152D]">
                          Order {item.orderId} · Phone: {item.phone}
                        </p>

                        <p className="mt-1 text-sm text-[#78676A]">
                          Delivered {dateLabel(item.deliveryDate)}
                          {item.deliveryTime ? ` at ${item.deliveryTime}` : ""}
                        </p>
                      </button>

                      <div className="text-right">
                        <strong className="text-xl text-orange-600">
                          {rupees(item.outstanding)}
                        </strong>
                        <p className="text-xs text-[#78676A]">
                          of {rupees(item.total)} total
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-[#E8D9D5] pt-3">
                      <button
                        type="button"
                        onClick={() => copyReminder(item)}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#FFF5E9] px-3 py-2 text-xs font-bold text-[#65152D] transition hover:bg-[#F8EBDD]"
                      >
                        {copied === item.orderId ? (
                          <Check size={15} />
                        ) : (
                          <Copy size={15} />
                        )}
                        {copied === item.orderId
                          ? "Reminder copied"
                          : "Copy payment reminder"}
                      </button>
                    </div>
                  </article>
                ))}

                {!data.outstanding.items.length && (
                  <Empty text="No outstanding balances for delivered orders in this date range." />
                )}
              </div>
            </section>
          )}

          {tab === "Credit Notes" && (
            <section>
              <form
                onSubmit={submitAdjustment}
                className="mb-6 rounded-2xl border border-[#E8D9D5] bg-white p-5 shadow-sm"
              >
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-[#65152D]">
                    Create a credit note or refund
                  </h2>
                  <p className="mt-1 text-sm text-[#78676A]">
                    Choose the order, enter an amount and reason, then save it
                    to the finance records.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <label className="text-xs font-semibold text-[#78676A]">
                    Order
                    <select
                      required
                      value={adjustmentForm.orderId}
                      onChange={(event) =>
                        setAdjustmentForm((current) => ({
                          ...current,
                          orderId: event.target.value,
                        }))
                      }
                      className={fieldClass}
                    >
                      <option value="">Select an order</option>
                      {data.invoices.map((item) => (
                        <option key={item.orderId} value={item.orderId}>
                          {item.orderId} · {item.customerName} ·{" "}
                          {rupees(item.total)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-xs font-semibold text-[#78676A]">
                    Record type
                    <select
                      value={adjustmentForm.kind}
                      onChange={(event) =>
                        setAdjustmentForm((current) => ({
                          ...current,
                          kind: event.target.value,
                        }))
                      }
                      className={fieldClass}
                    >
                      <option value="credit-note">Credit note</option>
                      <option value="refund">Refund paid</option>
                    </select>
                  </label>

                  <label className="text-xs font-semibold text-[#78676A]">
                    Amount
                    <input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={adjustmentForm.amount}
                      onChange={(event) =>
                        setAdjustmentForm((current) => ({
                          ...current,
                          amount: event.target.value,
                        }))
                      }
                      className={fieldClass}
                      placeholder="0.00"
                    />
                  </label>

                  <label className="text-xs font-semibold text-[#78676A]">
                    Reason
                    <input
                      required
                      maxLength={250}
                      value={adjustmentForm.reason}
                      onChange={(event) =>
                        setAdjustmentForm((current) => ({
                          ...current,
                          reason: event.target.value,
                        }))
                      }
                      className={fieldClass}
                      placeholder="Reason for adjustment"
                    />
                  </label>

                  <label className="text-xs font-semibold text-[#78676A]">
                    Refund mode
                    <select
                      disabled={adjustmentForm.kind !== "refund"}
                      value={adjustmentForm.method}
                      onChange={(event) =>
                        setAdjustmentForm((current) => ({
                          ...current,
                          method: event.target.value,
                        }))
                      }
                      className={fieldClass}
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                    </select>
                  </label>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingAdjustment || !data.invoices.length}
                    className={buttonPrimary}
                  >
                    <Plus size={16} />
                    {savingAdjustment ? "Saving…" : "Create record"}
                  </button>
                </div>
              </form>

              <h2 className="mb-3 text-lg font-bold text-[#35262A]">
                Credit notes and refunds
              </h2>

              <div className="overflow-x-auto rounded-2xl border border-[#E8D9D5] bg-white shadow-sm">
                <table className="min-w-[760px] w-full text-left text-sm">
                  <thead className="bg-[#F8EBDD] text-xs uppercase text-[#78676A]">
                    <tr>
                      {[
                        "Date",
                        "Customer / Order",
                        "Type",
                        "Reason",
                        "Status",
                        "Amount",
                      ].map((label) => (
                        <th key={label} className="px-4 py-3">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#E8D9D5]">
                    {data.creditNotes.map((item, index) => (
                      <tr
                        key={item.id || `${item.orderId}-${index}`}
                        onClick={() => openInvoice(item.orderId)}
                        className="cursor-pointer transition hover:bg-[#FFF5E9]"
                      >
                        <td className="px-4 py-3">{dateLabel(item.date)}</td>

                        <td className="px-4 py-3">
                          <strong>{item.customerName}</strong>
                          <div className="text-xs text-[#65152D]">
                            {item.orderId} · {item.phone}
                          </div>
                        </td>

                        <td className="px-4 py-3 capitalize">
                          {item.kind || "Credit note"}
                        </td>
                        <td className="px-4 py-3">{item.reason}</td>
                        <td className="px-4 py-3">{item.status}</td>
                        <td className="px-4 py-3 font-bold text-[#65152D]">
                          {rupees(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {!data.creditNotes.length && (
                  <Empty text="No credit notes or refunds are recorded in this date range." />
                )}
              </div>
            </section>
          )}

          {tab === "Store Credit" && (
            <section className="rounded-2xl border border-[#E8D9D5] bg-white px-6 py-16 text-center shadow-sm">
              <Wallet
                className="mx-auto mb-3 text-[#65152D]"
                size={32}
              />
              <h2 className="font-bold text-[#35262A]">
                No store credit records
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-[#78676A]">
                Store credit balances are not currently tracked in the order
                and payment records.
              </p>
            </section>
          )}
        </>
      )}

      <p className="mt-4 text-xs text-[#78676A]">
        Finance data is based on orders and payments recorded in Cakezee.
        Exports are CSV files that open in Excel.
      </p>

      {invoiceLoading && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <p className="rounded-xl border border-[#E8D9D5] bg-white px-5 py-4 text-sm text-[#35262A] shadow-lg">
            <RefreshCw
              size={16}
              className="mr-2 inline animate-spin text-[#65152D]"
            />
            Loading invoice…
          </p>
        </div>
      )}

      {selectedInvoice && (
        <InvoiceModal
          order={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </main>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full max-w-sm rounded-lg border border-[#E8D9D5] bg-white px-3 py-2 text-sm text-[#35262A] outline-none transition placeholder:text-[#A49395] focus:border-[#65152D] focus:ring-2 focus:ring-[#65152D]/10"
    />
  );
}

function InvoiceModal({ order, onClose }) {
  const lines = getInvoiceLines(order);
  const total = Number(order.pricing?.total || 0);
  const taxable = lines.reduce(
    (sum, line) => sum + Number(line.amount || 0),
    0
  );

  const invoiceNumber = order.invoiceNumber || order.orderId;

  const mode =
    order.payment?.method === "cod"
      ? "Cash"
      : String(order.payment?.method || "Cash").toUpperCase();

  return (
    <div
      className="invoice-overlay fixed inset-0 z-[80] overflow-y-auto bg-black/50 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Invoice ${invoiceNumber}`}
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .invoice-overlay, .invoice-overlay * { visibility: visible !important; }
          .invoice-overlay {
            position: absolute !important;
            inset: 0 !important;
            overflow: visible !important;
            padding: 0 !important;
            background: white !important;
          }
          .invoice-sheet {
            width: 100% !important;
            max-width: none !important;
            border: 0 !important;
            box-shadow: none !important;
          }
          .invoice-actions { display: none !important; }
        }
      `}</style>

      <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-center">
        <div className="invoice-actions mb-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className={buttonPrimary}
          >
            <Printer size={16} />
            Print invoice
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close invoice"
            className="rounded-xl border border-[#E8D9D5] bg-white p-2.5 text-[#35262A] transition hover:bg-[#FFF5E9]"
          >
            <X size={18} />
          </button>
        </div>

        <article className="invoice-sheet overflow-hidden rounded-xl border border-[#E8D9D5] bg-white text-[#35262A] shadow-xl">
          <header className="flex items-start justify-between border-b-2 border-[#65152D] px-6 py-6">
            <div>
              <h2 className="text-2xl font-bold text-[#65152D]">Cakezee</h2>
              <p className="mt-2 text-sm text-[#78676A]">Ph: 9644927623</p>
              {order.gstin && (
                <p className="mt-1 text-xs text-[#78676A]">
                  GSTIN: {order.gstin}
                </p>
              )}
            </div>

            <strong className="text-base text-[#65152D]">Tax Invoice</strong>
          </header>

          <section className="grid border-b border-[#E8D9D5] sm:grid-cols-2">
            <div className="border-b border-[#E8D9D5] px-6 py-4 sm:border-b-0 sm:border-r">
              <p className="text-xs text-[#78676A]">Invoice No.</p>
              <strong className="mt-1 block text-[#65152D]">
                {invoiceNumber}
              </strong>

              <p className="mt-4 text-xs text-[#78676A]">Date</p>
              <p className="mt-1 text-sm">{dateTimeLabel(order.createdAt)}</p>
            </div>

            <div className="px-6 py-4">
              <p className="text-xs text-[#78676A]">Customer</p>
              <strong className="mt-1 block">
                {order.customerName || "Customer"}
              </strong>
              <p className="mt-1 text-sm">{order.phone}</p>

              <p className="mt-3 text-xs text-[#78676A]">Payment Mode</p>
              <p className="mt-1 text-sm">{mode}</p>
            </div>
          </section>

          <div className="px-6 py-5">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] border-b border-[#E8D9D5] text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-[#65152D] bg-[#FFF5E9]">
                    {[
                      "SI",
                      "Description of Goods",
                      "HSN",
                      "Qty",
                      "Rate",
                      "CGST",
                      "SGST",
                      "Amount",
                    ].map((item) => (
                      <th key={item} className="px-2 py-3">
                        {item}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {lines.map((line, index) => (
                    <tr
                      key={`${line.description}-${index}`}
                      className="border-b border-[#E8D9D5]"
                    >
                      <td className="px-2 py-3">{index + 1}</td>
                      <td className="px-2 py-3">{line.description}</td>
                      <td className="px-2 py-3">{line.hsn}</td>
                      <td className="px-2 py-3">{line.quantity}</td>
                      <td className="px-2 py-3">
                        {rupees(line.amount / Math.max(1, line.quantity))}
                      </td>
                      <td className="px-2 py-3">₹0.00</td>
                      <td className="px-2 py-3">₹0.00</td>
                      <td className="px-2 py-3 font-semibold">
                        {rupees(line.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr className="bg-[#FFF5E9] font-semibold">
                    <td className="px-2 py-3" colSpan={3}>
                      Total
                    </td>
                    <td className="px-2 py-3">
                      {Number(order.quantity || 1)}
                    </td>
                    <td />
                    <td className="px-2 py-3">₹0.00</td>
                    <td className="px-2 py-3">₹0.00</td>
                    <td className="px-2 py-3 text-[#65152D]">
                      {rupees(total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <p className="mt-5 text-sm">
              <strong>Amount Chargeable (in words):</strong>{" "}
              <span className="text-[#78676A]">
                Indian Rupee {amountInWords(total)}
              </span>
            </p>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[650px] border border-[#E8D9D5] text-center text-xs">
                <thead className="bg-[#F8EBDD]">
                  <tr>
                    {[
                      "HSN/SAC",
                      "Taxable Value",
                      "Central Tax Rate",
                      "Central Tax Amount",
                      "State Tax Rate",
                      "State Tax Amount",
                      "Total Tax Amount",
                    ].map((item) => (
                      <th
                        key={item}
                        className="border border-[#E8D9D5] px-2 py-2"
                      >
                        {item}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td className="border border-[#E8D9D5] px-2 py-2">
                      19059090
                    </td>
                    <td className="border border-[#E8D9D5] px-2 py-2">
                      {rupees(taxable)}
                    </td>
                    <td className="border border-[#E8D9D5] px-2 py-2">
                      0.0%
                    </td>
                    <td className="border border-[#E8D9D5] px-2 py-2">
                      ₹0.00
                    </td>
                    <td className="border border-[#E8D9D5] px-2 py-2">
                      0.0%
                    </td>
                    <td className="border border-[#E8D9D5] px-2 py-2">
                      ₹0.00
                    </td>
                    <td className="border border-[#E8D9D5] px-2 py-2">
                      ₹0.00
                    </td>
                  </tr>

                  <tr className="bg-[#FFF5E9] font-semibold">
                    <td className="border border-[#E8D9D5] px-2 py-2">
                      Total
                    </td>
                    <td className="border border-[#E8D9D5] px-2 py-2">
                      {rupees(taxable)}
                    </td>
                    <td />
                    <td className="border border-[#E8D9D5] px-2 py-2">
                      ₹0.00
                    </td>
                    <td />
                    <td className="border border-[#E8D9D5] px-2 py-2">
                      ₹0.00
                    </td>
                    <td className="border border-[#E8D9D5] px-2 py-2">
                      ₹0.00
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-sm">
              <strong>Tax Amount (in words):</strong>{" "}
              <span className="text-[#78676A]">Zero</span>
            </p>
          </div>

          <footer className="border-t border-[#E8D9D5] bg-[#FFF5E9] px-6 py-3 text-xs text-[#78676A]">
            Thank you for choosing Cakezee.
          </footer>
        </article>
      </div>
    </div>
  );
}

function Metric({ label, value, tone = "default" }) {
  const tones = {
    default: "border-[#E8D9D5] bg-white text-[#65152D]",
    green: "border-green-200 bg-green-50 text-green-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${tones[tone] || tones.default}`}
    >
      <p className="text-xs opacity-80">{label}</p>
      <p className="mt-2 text-xl font-bold">{rupees(value)}</p>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#E8D9D5] bg-white py-12 text-center text-sm text-[#78676A]">
      <Wallet size={24} className="mx-auto mb-2 text-[#65152D]/60" />
      {text}
    </div>
  );
}

export default FinancePage;
