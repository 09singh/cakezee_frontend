import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Users,
  Wallet,
  Clock,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import {
  getStaffOrders,
  mapApiOrder,
} from "../../../api/orders.api";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const businessDate = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const getStatus = (status = "") => {
  const value = String(status).toLowerCase();

  if (["cancelled", "canceled"].includes(value)) return "Cancelled";
  if (value === "delivered") return "Delivered";
  if (value.includes("ready") || value === "out for delivery") return "Ready";
  if (["preparing", "baking"].includes(value)) return "Baking";
  if (["decoration", "decorating"].includes(value)) return "Decoration";

  return "Pending";
};

const getBalance = (order) => {
  const total = Number(order.pricing?.total || 0);
  const paid = Number(
    order.payment?.amountPaid ??
      order.payment?.paidAmount ??
      0
  );

  if (String(order.payment?.status).toLowerCase() === "paid") {
    return 0;
  }

  return Math.max(0, total - paid);
};

const getCustomerKey = (order) =>
  String(order.phone || order.customer || order.customerName || "")
    .trim()
    .toLowerCase();

const getDeliveryDate = (order) =>
  String(
    order.delivery?.date ||
      order.deliveryDate ||
      order.scheduledDeliveryDate ||
      ""
  ).slice(0, 10);

function MetricCard({ label, value, caption, icon: Icon }) {
  return (
    <article className="min-w-0 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">{label}</p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#063b32]">
          <Icon size={19} />
        </span>
      </div>

      <p className="mt-3 break-words text-3xl font-bold tracking-tight text-[#063b32]">
        {value}
      </p>

      <p className="mt-3 text-xs text-gray-500">{caption}</p>
    </article>
  );
}

function BriefingCard({
  title,
  description,
  count,
  icon: Icon,
  accent,
  actionLabel,
  to,
  children,
}) {
  return (
    <section
      className={`min-w-0 rounded-xl border border-gray-100 border-l-4 ${accent} bg-white p-5 shadow-sm`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon size={18} className="shrink-0 text-[#063b32]" />
          <h3 className="font-semibold text-[#063b32]">{title}</h3>
        </div>

        <Link
          to={to}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#0b6b59] hover:underline"
        >
          {actionLabel}
          <ArrowRight size={14} />
        </Link>
      </div>

      <p className="mt-4 text-2xl font-bold text-[#063b32]">{count}</p>
      <p className="mt-1 text-sm text-gray-500">{description}</p>

      {children && <div className="mt-3">{children}</div>}
    </section>
  );
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      const result = await getStaffOrders({ limit: 100 });

      const items = Array.isArray(result?.items)
        ? result.items
        : Array.isArray(result?.data?.items)
          ? result.data.items
          : [];

      setOrders(items.map(mapApiOrder));
      setError("");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = useMemo(() => {
    const today = businessDate();
    const month = today.slice(0, 7);

    const monthOrders = orders.filter((order) => {
      const createdAt =
        order.createdAt ||
        order.created_at ||
        order.orderDate;

      return createdAt
        ? String(createdAt).slice(0, 7) === month
        : false;
    });

    const activeOrders = orders.filter(
      (order) => getStatus(order.status) !== "Cancelled"
    );

    const customers = new Set(
      orders.map(getCustomerKey).filter(Boolean)
    );

    const outstandingOrders = activeOrders.filter(
      (order) => getBalance(order) > 0
    );

    const outstandingAmount = outstandingOrders.reduce(
      (sum, order) => sum + getBalance(order),
      0
    );

    const pendingActions = orders.filter(
      (order) =>
        order.cancellation?.decision === "pending"
    ).length;

    const monthRevenue = monthOrders.reduce(
      (sum, order) =>
        sum + Number(order.pricing?.total || 0),
      0
    );

    return {
      customers: customers.size,
      monthOrderCount: monthOrders.length,
      monthRevenue,
      pendingActions,
      outstandingOrders,
      outstandingAmount,
      upcomingOrders: activeOrders.filter((order) => {
        const date = getDeliveryDate(order);
        return date >= today && date !== "";
      }),
    };
  }, [orders]);

  return (
    <main className="min-h-screen bg-[#f8f9fa] p-4 text-[#17232a] sm:p-5 lg:p-6">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#063b32] sm:text-3xl">
              Good evening! 👋
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Here's what's happening with Cakezee today.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              loadDashboard();
            }}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#063b32] hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                loadDashboard();
              }}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Customers in loaded orders"
            value={loading ? "…" : stats.customers}
            caption="Unique customers in the loaded order records"
            icon={Users}
          />

          <MetricCard
            label="Orders This Month"
            value={loading ? "…" : stats.monthOrderCount}
            caption="Orders created this calendar month"
            icon={CalendarDays}
          />

          <MetricCard
            label="Orders Booked This Month"
            value={loading ? "…" : money(stats.monthRevenue)}
            caption="Total value of this month's orders"
            icon={Wallet}
          />

          <MetricCard
            label="Pending Actions"
            value={loading ? "…" : stats.pendingActions}
            caption="Cancellation requests awaiting review"
            icon={AlertCircle}
          />
        </section>

        <div className="mb-4 mt-8 flex items-center gap-2">
          <ClipboardList size={19} className="text-gray-400" />
          <h2 className="font-bold text-[#063b32]">
            Today's Briefing
          </h2>
        </div>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <BriefingCard
            title="Outstanding Balances"
            description="Orders with a remaining balance"
            count={loading ? "…" : stats.outstandingOrders.length}
            icon={Wallet}
            accent="border-l-orange-500"
            actionLabel="View Orders"
            to="/admin/orders"
          >
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {loading
                ? "Calculating balance…"
                : `${money(stats.outstandingAmount)} to collect`}
            </p>

            {!loading && stats.outstandingOrders.length > 0 && (
              <ul className="mt-3 space-y-2 text-xs text-gray-600">
                {stats.outstandingOrders.slice(0, 5).map((order) => (
                  <li
                    key={order.id}
                    className="flex flex-wrap justify-between gap-2"
                  >
                    <span>
                      {order.customer || order.customerName || "Customer"}
                    </span>
                    <span className="font-semibold">
                      {money(getBalance(order))}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {!loading && stats.outstandingOrders.length === 0 && (
              <p className="text-xs text-gray-500">
                No outstanding balances in the loaded orders.
              </p>
            )}
          </BriefingCard>

          <BriefingCard
            title="Upcoming Orders"
            description="Orders scheduled for today or a future date"
            count={loading ? "…" : stats.upcomingOrders.length}
            icon={Clock}
            accent="border-l-red-400"
            actionLabel="View Orders"
            to="/admin/orders"
          >
            {!loading && stats.upcomingOrders.length > 0 && (
              <ul className="space-y-2 text-xs text-gray-600">
                {stats.upcomingOrders.slice(0, 5).map((order) => (
                  <li key={order.id} className="flex flex-wrap gap-2">
                    <span className="font-medium">
                      {order.customer || order.customerName || "Customer"}
                    </span>
                    <span>·</span>
                    <span>{getDeliveryDate(order)}</span>
                  </li>
                ))}
              </ul>
            )}

            {!loading && stats.upcomingOrders.length === 0 && (
              <p className="text-xs text-gray-500">
                No upcoming orders in the loaded records.
              </p>
            )}
          </BriefingCard>
        </section>
      </div>
    </main>
  );
}