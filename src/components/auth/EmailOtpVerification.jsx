import { useEffect, useState } from "react";
import { requestEmailOtp, verifyEmailOtp } from "../../api/emailOtp.api";
import {
  clearEmailVerificationSession,
  saveEmailVerificationSession,
} from "../../utils/checkoutStorage";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function EmailOtpVerification({
  email,
  onEmailChange,
  checkoutId,
  verification,
  resendAvailableAt,
  requestPending = false,
  onVerified,
  onVerificationInvalidated,
  onResendAvailableAtChange,
  onRequestPendingChange,
  className = "",
}) {
  const [code, setCode] = useState("");
  const [requested, setRequested] = useState(requestPending);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [clock, setClock] = useState(
    () => requestPending && resendAvailableAt
      ? Number(resendAvailableAt) - 60 * 1000
      : 0
  );
  const [expiredToken, setExpiredToken] = useState("");

  const normalizedEmail = email.trim().toLowerCase();
  const isVerified = Boolean(
    verification?.email === normalizedEmail &&
    verification?.token &&
    expiredToken !== verification.token
  );
  const cooldown = clock
    ? Math.max(0, Math.ceil((Number(resendAvailableAt) - clock) / 1000))
    : 0;

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!verification?.token) return undefined;
    const delay = Math.max(0, Number(verification.expiresAt) - Date.now());
    const timer = window.setTimeout(() => setExpiredToken(verification.token), delay);
    return () => window.clearTimeout(timer);
  }, [verification?.token, verification?.expiresAt]);

  const handleEmailChange = (event) => {
    const nextEmail = event.target.value;
    setCode("");
    setRequested(false);
    setMessage("");
    setError("");
    setClock(Date.now());
    onRequestPendingChange?.(false);
    onResendAvailableAtChange?.(null);
    clearEmailVerificationSession();
    onVerificationInvalidated?.();
    onEmailChange(nextEmail);
  };

  const handleRequest = async () => {
    if (busy) return;
    const requestEmail = normalizedEmail;
    if (!EMAIL_PATTERN.test(requestEmail) || requestEmail.length > 254) {
      setError("Enter a valid email address.");
      return;
    }

    setBusy(true);
    setClock(Date.now());
    setError("");
    setMessage("");
    clearEmailVerificationSession();
    onVerificationInvalidated?.();
    try {
      const response = await requestEmailOtp(requestEmail, checkoutId);
      const cooldownSeconds = Number(response?.data?.resendAfterSeconds) || 60;
      setRequested(true);
      setCode("");
      setMessage("If the address is valid, a verification code has been sent.");
      onRequestPendingChange?.(true);
      onResendAvailableAtChange?.(Date.now() + cooldownSeconds * 1000);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
        "We could not send a verification code. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await verifyEmailOtp(normalizedEmail, checkoutId, code.trim());
      const result = response?.data;
      if (!result?.verificationToken || result.email !== normalizedEmail) {
        throw new Error("The verification service returned an invalid response.");
      }

      const verifiedEmail = {
        email: result.email,
        token: result.verificationToken,
        expiresAt: Date.now() + Number(result.expiresInSeconds || 1200) * 1000,
        checkoutId,
      };
      saveEmailVerificationSession(verifiedEmail);
      await onVerified?.(verifiedEmail);
      setMessage("Email verified.");
      setError("");
      setRequested(false);
      onRequestPendingChange?.(false);
    } catch (verifyError) {
      setError(
        verifyError?.response?.data?.message ||
        verifyError.message ||
        "The verification code could not be confirmed."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      <label htmlFor="checkout-email" className="text-sm font-semibold">
        Email address
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id="checkout-email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          onChange={handleEmailChange}
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-white px-3 py-3 text-sm outline-none focus:border-[var(--brand)]"
        />
        <button
          type="button"
          onClick={handleRequest}
          disabled={busy || cooldown > 0 || !checkoutId || isVerified}
          className="rounded-lg border border-[var(--brand)] px-4 py-3 text-sm font-semibold text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isVerified ? "Verified" : busy ? "Please wait..." : requested ? (cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code") : "Verify"}
        </button>
      </div>

      {requested && !isVerified && (
        <div className="mt-3 space-y-2">
          <label htmlFor="checkout-email-otp" className="text-sm font-semibold">
            Verification code
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="checkout-email-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit code"
              className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-white px-3 py-3 text-sm tracking-[0.3em] outline-none focus:border-[var(--brand)]"
            />
            <button
              type="button"
              onClick={handleVerify}
              disabled={busy || code.length !== 6}
              className="rounded-lg bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Checking..." : "Verify code"}
            </button>
          </div>
        </div>
      )}

      {isVerified && (
        <p role="status" className="mt-2 text-sm font-medium text-green-700">
          Email verified
        </p>
      )}
      {message && !isVerified && (
        <p role="status" className="mt-2 text-xs text-[var(--text-muted)]">{message}</p>
      )}
      {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default EmailOtpVerification;
