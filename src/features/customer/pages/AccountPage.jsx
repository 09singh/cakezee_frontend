import { UserRound } from "lucide-react";
import { useState } from "react";

function AccountPage() {
  const [mobile, setMobile] = useState("");
  const [notice, setNotice] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setNotice("Mobile verification is not connected yet. Your number has not been sent or saved.");
  }

  return (
    <section className="page-container flex min-h-[65vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-light)] text-[var(--brand)]"><UserRound size={22} /></div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[2px] text-[var(--brand)]">Welcome to Cakezee</p>
        <h1 className="mt-2 text-3xl font-semibold" style={{ fontFamily: "Georgia, serif" }}>Your account</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Use your mobile number to access saved details and order updates.</p>
        <form onSubmit={handleSubmit} className="mt-7">
          <label htmlFor="mobile" className="text-sm font-semibold">Mobile number</label>
          <div className="mt-2 flex rounded-lg border border-[var(--border)] bg-white focus-within:border-[var(--brand)]">
            <span className="border-r border-[var(--border)] px-3 py-3 text-sm text-[var(--text-muted)]">+91</span>
            <input id="mobile" type="tel" inputMode="numeric" autoComplete="tel-national" pattern="[0-9]{10}" maxLength={10} required value={mobile} onChange={(event) => setMobile(event.target.value.replace(/\D/g, ""))} placeholder="10-digit mobile number" className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" />
          </div>
          <button type="submit" className="mt-4 w-full rounded-lg bg-[var(--brand)] px-5 py-3.5 text-sm font-semibold text-white hover:bg-[var(--brand-dark)]">Continue</button>
        </form>
        {notice && <p role="status" className="mt-4 rounded-lg bg-[var(--cream-dark)] p-3 text-sm leading-5 text-[var(--text-muted)]">{notice}</p>}
      </div>
    </section>
  );
}

export default AccountPage;
