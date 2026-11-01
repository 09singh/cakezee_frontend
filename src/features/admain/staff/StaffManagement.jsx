import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Trash2, UserRoundCog, Users } from "lucide-react";
import api from "../../../api/axios";

const field = "mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-[#8f1638]";
const staffRoles = [
  { value: "manager", label: "Manager" },
  { value: "kitchen", label: "Kitchen" },
  { value: "delivery", label: "Delivery" },
];
const emptyForm = { name: "", email: "", password: "", role: "manager" };

export default function StaffManagement() {
  const [form, setForm] = useState(emptyForm);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [notice, setNotice] = useState("");

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/auth/admin/staff");
      setStaff(Array.isArray(response.data?.users) ? response.data.users : []);
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Could not load staff accounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(loadStaff, 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadStaff]);

  const roleCounts = useMemo(
    () => Object.fromEntries(staffRoles.map(({ value }) => [
      value,
      staff.filter((user) => user.role === value).length,
    ])),
    [staff]
  );

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    setCreatedCredentials(null);
    try {
      await api.post("/auth/admin/staff", form);
      setCreatedCredentials({ ...form });
      setForm(emptyForm);
      await loadStaff();
    } catch (saveError) {
      const serverMessage = saveError.response?.data?.message;
      setError(serverMessage || `Could not create the ${form.role} account.`);
    } finally {
      setSaving(false);
    }
  };

  const removeStaff = async (user) => {
    if (!window.confirm(`Permanently remove ${user.name || user.email}'s ${user.role} account?`)) return;
    setBusyId(user._id);
    setError("");
    setNotice("");
    try {
      await api.delete(`/auth/admin/staff/${user._id}`);
      setStaff((current) => current.filter((item) => item._id !== user._id));
      setNotice(`${user.name || user.email}'s account was removed.`);
    } catch (removeError) {
      setError(removeError.response?.data?.message || "Could not remove this staff account.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#95616E]">Admin settings</p>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold text-[#351d24]"><UserRoundCog size={25} /> Staff access</h1>
          <p className="mt-1 text-sm text-stone-500">Create and manage Manager, Kitchen, and Delivery logins.</p>
        </div>
        <button type="button" onClick={loadStaff} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Staff account totals">
        {staffRoles.map(({ value, label }) => (
          <article key={value} className="flex items-center gap-3 rounded-2xl border bg-white p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f8e9ed] text-[#65152D]"><Users size={19} /></span>
            <div><p className="text-sm text-stone-500">{label} accounts</p><p className="text-2xl font-bold text-[#351d24]">{roleCounts[value] || 0}</p></div>
          </article>
        ))}
      </section>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
      {createdCredentials && (
        <section role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          <h2 className="font-bold">{staffRoles.find(({ value }) => value === createdCredentials.role)?.label} account created</h2>
          <p className="mt-2">Name: {createdCredentials.name}</p>
          <p>Email / login ID: <span className="font-semibold">{createdCredentials.email}</span></p>
          <p>Temporary password: <span className="font-semibold">{createdCredentials.password}</span></p>
          <p className="mt-2 text-xs">This password is shown only now. It cannot be retrieved from the account list later.</p>
          <button type="button" onClick={() => setCreatedCredentials(null)} className="mt-2 text-xs font-semibold underline">Hide credentials</button>
        </section>
      )}

      <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-white p-5 sm:p-7">
        <h2 className="text-lg font-bold">Create staff account</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">Full name
            <input required minLength="2" maxLength="100" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className={field} />
          </label>
          <label className="block text-sm font-medium">Role
            <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} className={field}>
              {staffRoles.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium">Email / login ID
            <input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className={field} />
          </label>
          <label className="block text-sm font-medium">Temporary password
            <input required type="password" minLength="8" maxLength="128" autoComplete="new-password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} className={field} />
            <span className="mt-1 block text-xs text-stone-500">At least 8 characters. It will be shown once after creation.</span>
          </label>
        </div>
        <button disabled={saving} className="rounded-xl bg-[#65152D] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? "Creating account…" : "Create account"}
        </button>
      </form>

      <section className="rounded-2xl border bg-white p-5 sm:p-7">
        <h2 className="text-lg font-bold">Staff accounts</h2>
        {loading ? <p className="py-8 text-center text-sm text-stone-500">Loading staff accounts…</p> : staff.length ? (
          <div className="mt-3 divide-y">
            {staff.map((user) => (
              <article key={user._id} className="flex flex-wrap items-center gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[#351d24]">{user.name || "Staff member"}</p>
                  <p className="truncate text-sm text-stone-500">{user.email}</p>
                </div>
                <span className="rounded-full bg-[#f8e9ed] px-3 py-1 text-xs font-semibold capitalize text-[#65152D]">{user.role}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.isActive ? "bg-green-50 text-green-700" : "bg-stone-100 text-stone-600"}`}>{user.isActive ? "Active" : "Inactive"}</span>
                <button type="button" onClick={() => removeStaff(user)} disabled={busyId === user._id} aria-label={`Remove ${user.name || user.email}`} className="rounded-lg border border-red-200 p-2 text-red-700 disabled:opacity-50" title="Permanently remove account">
                  <Trash2 size={16} />
                </button>
              </article>
            ))}
          </div>
        ) : <p className="py-8 text-center text-sm text-stone-500">No staff accounts have been created.</p>}
      </section>
    </main>
  );
}
