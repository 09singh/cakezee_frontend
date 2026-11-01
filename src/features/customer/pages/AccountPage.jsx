import { UserRound } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import EmailOtpVerification from "../../../components/auth/EmailOtpVerification";
import { loginCustomerByEmail } from "../../../api/auth.api";
import useAuth from "../../../hooks/useAuth";
import { createCheckoutId } from "../../../utils/checkoutStorage";

function AccountPage() {
  const { user, isCustomerAuthenticated, loading, loginCustomer, logoutUser } = useAuth();
  const [email, setEmail] = useState("");
  const [checkoutId] = useState(createCheckoutId);
  const [verification, setVerification] = useState(null);

  const handleVerified = async (emailVerification) => {
    const response = await loginCustomerByEmail(emailVerification);
    if (!response?.token || response.user?.role !== "customer") {
      throw new Error("The account service returned an invalid response.");
    }
    loginCustomer(response);
    setVerification(null);
  };

  if (loading) {
    return (
      <section className="page-container flex min-h-[65vh] items-center justify-center py-12">
        <p role="status" className="text-sm text-[var(--text-muted)]">Loading your account...</p>
      </section>
    );
  }

  return (
    <section className="page-container flex min-h-[65vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-light)] text-[var(--brand)]">
          <UserRound size={22} />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[2px] text-[var(--brand)]">
          Welcome to Cakezee
        </p>
        <h1 className="mt-2 text-3xl font-semibold" style={{ fontFamily: "Georgia, serif" }}>
          Your account
        </h1>

        {isCustomerAuthenticated ? (
          <>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
              Signed in as <span className="font-semibold text-[var(--text)]">{user.name}</span>
              <br />
              {user.email}
            </p>
            <div className="mt-7 grid gap-3">
              <Link
                to="/orders"
                className="w-full rounded-lg bg-[var(--brand)] px-5 py-3.5 text-center text-sm font-semibold text-white hover:bg-[var(--brand-dark)]"
              >
                View my orders
              </Link>
              <button
                type="button"
                onClick={logoutUser}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-5 py-3.5 text-sm font-semibold text-[var(--text)] hover:bg-[var(--cream-dark)]"
              >
                Sign out
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
              Enter your email address and verify the one-time code we send you to sign in and view your orders.
            </p>
            <EmailOtpVerification
              className="mt-7"
              email={email}
              checkoutId={checkoutId}
              verification={verification}
              onEmailChange={(value) => {
                setEmail(value);
                setVerification(null);
              }}
              onVerificationInvalidated={() => setVerification(null)}
              onVerified={handleVerified}
            />
          </>
        )}
      </div>
    </section>
  );
}

export default AccountPage;
