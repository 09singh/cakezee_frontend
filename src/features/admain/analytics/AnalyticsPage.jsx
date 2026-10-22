import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  Eye,
  Globe2,
  RefreshCw,
  Smartphone,
  Users,
} from "lucide-react";
import { getAnalyticsOverview } from "../../../api/analytics.api";

const localDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const today = () => localDate(new Date());
const dateOffset = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return localDate(date);
};

const number = (value) => Number(value || 0).toLocaleString("en-IN");
const percent = (value) => `${(Number(value || 0) * 100).toFixed(1)}%`;

const panelClass = "rounded-2xl border border-[#eadcda] bg-white p-5 shadow-sm";
const selectClass = "rounded-lg border border-[#eadcda] bg-white px-3 py-2 text-sm text-[#351c20] outline-none focus:border-[#74152f]";

function formatTrendDate(value) {
  if (!/^\d{8}$/.test(value || "")) return value;
  return new Date(`${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T00:00:00`)
    .toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function TrafficChart({ rows }) {
  const width = 900;
  const height = 210;
  const values = rows.map((row) => Number(row.sessions) || 0);
  const maximum = Math.max(1, ...values);
  const points = values.map((value, index) => {
    const x = rows.length < 2 ? width / 2 : (index / (rows.length - 1)) * width;
    const y = height - 12 - (value / maximum) * (height - 28);
    return `${x},${y}`;
  }).join(" ");

  if (!rows.length || values.every((value) => value === 0)) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl bg-[#fffaf7] text-sm text-[#76676a]">
        No traffic data is available for this period.
      </div>
    );
  }

  const labelStep = Math.max(1, Math.ceil(rows.length / 7));

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs text-[#76676a]">
        <span className="h-2.5 w-2.5 rounded-full bg-[#74152f]" />
        Sessions
      </div>
      <svg className="h-52 w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Daily sessions traffic chart" preserveAspectRatio="none">
        {[0, 1, 2, 3].map((line) => {
          const y = 8 + (line / 3) * (height - 16);
          return <line key={line} x1="0" x2={width} y1={y} y2={y} stroke="#f0e7e4" strokeDasharray="4 5" />;
        })}
        <polyline points={points} fill="none" stroke="#74152f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {rows.map((row, index) => {
          if (index % labelStep !== 0 && index !== rows.length - 1) return null;
          const x = rows.length < 2 ? width / 2 : (index / (rows.length - 1)) * width;
          const y = height - 12 - (values[index] / maximum) * (height - 28);
          return <circle key={row.date} cx={x} cy={y} r="4" fill="#74152f" stroke="white" strokeWidth="2" vectorEffect="non-scaling-stroke" />;
        })}
      </svg>
      <div className="mt-1 flex justify-between gap-2 text-[11px] text-[#76676a]">
        {rows.map((row, index) =>
          index % labelStep === 0 || index === rows.length - 1
            ? <span key={row.date}>{formatTrendDate(row.date)}</span>
            : null
        )}
      </div>
    </div>
  );
}

function DataTable({ columns, rows, emptyMessage }) {
  if (!rows.length) {
    return <p className="py-8 text-center text-sm text-[#76676a]">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[360px] text-left text-sm">
        <thead>
          <tr className="border-b border-[#f0e7e4] text-xs uppercase tracking-wide text-[#76676a]">
            {columns.map((column) => <th key={column.label} className="px-2 py-3 font-medium">{column.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row[columns[0].key]}-${index}`} className="border-b border-[#f5efed] last:border-0">
              {columns.map((column) => (
                <td key={column.key} className={`max-w-[260px] truncate px-2 py-3 ${column.align === "right" ? "text-right tabular-nums" : ""}`} title={String(row[column.key] ?? "")}>
                  {column.format ? column.format(row[column.key]) : row[column.key] || "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AnalyticsPage() {
  const [preset, setPreset] = useState("7");
  const [customStart, setCustomStart] = useState(dateOffset(6));
  const [customEnd, setCustomEnd] = useState(today());
  const [refreshCount, setRefreshCount] = useState(0);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const dates = useMemo(() => {
    if (preset === "custom") return { startDate: customStart, endDate: customEnd };
    return { startDate: `${preset}daysAgo`, endDate: "today" };
  }, [preset, customStart, customEnd]);

  useEffect(() => {
    const controller = new AbortController();
    getAnalyticsOverview(dates, { signal: controller.signal })
      .then((response) => setReport(response.data))
      .catch((requestError) => {
        if (controller.signal.aborted) return;
        setError(
          requestError.response?.data?.message ||
          (requestError.code === "ECONNABORTED"
            ? "The analytics request timed out. Please refresh and try again."
            : "Analytics could not be loaded. Check your connection and try again.")
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [dates, refreshCount]);

  const summary = report?.summary || {};
  const cards = [
    { label: "Active users", value: number(summary.activeUsers), icon: Users },
    { label: "Sessions", value: number(summary.sessions), icon: Activity },
    { label: "Page views", value: number(summary.pageViews), icon: Eye },
    { label: "Engagement rate", value: percent(summary.engagementRate), icon: BarChart3 },
  ];
  const hasData = Boolean(
    summary.activeUsers || summary.totalUsers || summary.sessions || summary.pageViews
  );
  const updatedAt = report?.lastUpdated
    ? new Date(report.lastUpdated).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : "";

  return (
    <div className="min-h-screen bg-[#fffaf7] px-4 py-6 text-[#351c20] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8b5d64]">
              <BarChart3 size={15} /> Admin insights
            </p>
            <h1 className="font-serif text-3xl font-bold">Analytics</h1>
            <p className="mt-1 text-sm text-[#76676a]">Website performance from your GA4 property.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="analytics-range">Date range</label>
            <select
              id="analytics-range"
              className={selectClass}
              value={preset}
              onChange={(event) => {
                setLoading(true);
                setError("");
                setPreset(event.target.value);
              }}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="custom">Custom dates</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setError("");
                setRefreshCount((count) => count + 1);
              }}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-[#74152f] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-[#5c1025] disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {preset === "custom" && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#eadcda] bg-white p-4">
            <CalendarDays size={18} className="text-[#74152f]" />
            <label className="text-sm text-[#76676a]" htmlFor="analytics-start">From</label>
            <input
              id="analytics-start"
              type="date"
              max={customEnd || today()}
              value={customStart}
              onChange={(event) => {
                setLoading(true);
                setError("");
                setCustomStart(event.target.value);
              }}
              className={selectClass}
            />
            <label className="text-sm text-[#76676a]" htmlFor="analytics-end">To</label>
            <input
              id="analytics-end"
              type="date"
              min={customStart}
              max={today()}
              value={customEnd}
              onChange={(event) => {
                setLoading(true);
                setError("");
                setCustomEnd(event.target.value);
              }}
              className={selectClass}
            />
            <span className="text-xs text-[#76676a]">Maximum range: 90 days</span>
          </div>
        )}

        {!import.meta.env.VITE_GA4_MEASUREMENT_ID && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Website tracking is not configured. Set <code>VITE_GA4_MEASUREMENT_ID</code> in the frontend environment to collect page views.
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p className="font-semibold">Analytics unavailable</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {loading && !report ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading analytics">
            {cards.map((card) => <div key={card.label} className="h-28 animate-pulse rounded-2xl border border-[#eadcda] bg-white" />)}
          </div>
        ) : (
          <>
            <section aria-label="Analytics overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-2xl border border-[#eadcda] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#76676a]">{label}</span>
                    <span className="rounded-xl bg-[#fff1f2] p-2.5 text-[#74152f]"><Icon size={19} /></span>
                  </div>
                  <p className="mt-4 text-2xl font-bold tabular-nums">{loading ? "…" : value}</p>
                </div>
              ))}
            </section>

            {report && !loading && !error && !hasData && (
              <div className="rounded-2xl border border-[#eadcda] bg-white px-5 py-8 text-center">
                <Globe2 className="mx-auto text-[#8b5d64]" size={26} />
                <h2 className="mt-3 font-semibold">No analytics data yet</h2>
                <p className="mt-1 text-sm text-[#76676a]">GA4 has no report data for this date range. New data may take up to 24–48 hours to appear.</p>
              </div>
            )}

            <section className={panelClass}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Daily traffic</h2>
                  <p className="mt-1 text-xs text-[#76676a]">Sessions by day</p>
                </div>
                <Activity size={19} className="text-[#8b5d64]" />
              </div>
              {loading ? <div className="h-56 animate-pulse rounded-xl bg-[#fffaf7]" /> : <TrafficChart rows={report?.dailyTraffic || []} />}
            </section>

            <div className="grid gap-5 xl:grid-cols-2">
              <section className={panelClass}>
                <div className="mb-2 flex items-center gap-2"><Globe2 size={18} className="text-[#74152f]" /><h2 className="font-semibold">Traffic sources</h2></div>
                {loading ? <div className="h-48 animate-pulse rounded-xl bg-[#fffaf7]" /> : (
                  <DataTable
                    columns={[
                      { label: "Source / medium", key: "sourceMedium" },
                      { label: "Sessions", key: "sessions", align: "right", format: number },
                      { label: "Active users", key: "activeUsers", align: "right", format: number },
                    ]}
                    rows={report?.sources || []}
                    emptyMessage="No source data is available for this period."
                  />
                )}
              </section>
              <section className={panelClass}>
                <div className="mb-2 flex items-center gap-2"><Eye size={18} className="text-[#74152f]" /><h2 className="font-semibold">Top pages</h2></div>
                {loading ? <div className="h-48 animate-pulse rounded-xl bg-[#fffaf7]" /> : (
                  <DataTable
                    columns={[
                      { label: "Page", key: "pagePath" },
                      { label: "Views", key: "pageViews", align: "right", format: number },
                      { label: "Active users", key: "activeUsers", align: "right", format: number },
                    ]}
                    rows={report?.pages || []}
                    emptyMessage="No page data is available for this period."
                  />
                )}
              </section>
            </div>

            <section className={panelClass}>
              <div className="mb-2 flex items-center gap-2"><Smartphone size={18} className="text-[#74152f]" /><h2 className="font-semibold">Devices</h2></div>
              {loading ? <div className="h-32 animate-pulse rounded-xl bg-[#fffaf7]" /> : (
                <DataTable
                  columns={[
                    { label: "Device category", key: "category" },
                    { label: "Sessions", key: "sessions", align: "right", format: number },
                    { label: "Active users", key: "activeUsers", align: "right", format: number },
                  ]}
                  rows={report?.devices || []}
                  emptyMessage="No device breakdown is available for this period."
                />
              )}
            </section>

            {report?.ecommerce?.events?.length > 0 && (
              <section className={panelClass}>
                <h2 className="mb-2 font-semibold">Ecommerce events</h2>
                <DataTable
                  columns={[
                    { label: "Event", key: "eventName" },
                    { label: "Count", key: "eventCount", align: "right", format: number },
                    { label: "Revenue", key: "revenue", align: "right", format: (value) => `₹${number(value)}` },
                  ]}
                  rows={report.ecommerce.events}
                  emptyMessage="No ecommerce events are available for this period."
                />
              </section>
            )}
          </>
        )}

        {updatedAt && (
          <p className="text-right text-xs text-[#76676a]">
            Last updated {updatedAt}{loading ? " · refreshing" : ""}
          </p>
        )}
      </div>
    </div>
  );
}

export default AnalyticsPage;
