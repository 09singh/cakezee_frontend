
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import CheckoutSteps from "../components/CheckoutSteps";

import {
  createCheckoutId,
  getCheckout,
  updateCheckout,
} from "../utils/checkoutStorage";
import EmailOtpVerification from "../components/auth/EmailOtpVerification";
import useAuth from "../hooks/useAuth";

const OPENING_HOUR = 10;
const CLOSING_HOUR = 20;

// Format Indian Rupees consistently
const formatINR = (amount) =>
  `\u20B9${Number(amount || 0).toLocaleString("en-IN")}`;

function getLocalDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type).value;

  return `${value("year")}-${value("month")}-${value("day")}`;
}

function formatHour(hour) {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:00 ${period}`;
}

function generateTimeSlots(selectedDate) {
  if (!selectedDate) {
    return [];
  }

  const today = getLocalDateString();
  const slots = [];

  // Future date: show all bakery hours
  if (selectedDate > today) {
    for (
      let hour = OPENING_HOUR;
      hour < CLOSING_HOUR;
      hour++
    ) {
      slots.push({
        value: `${formatHour(hour)} - ${formatHour(hour + 1)}`,
        label: `${formatHour(hour)} - ${formatHour(hour + 1)}`,
      });
    }

    return slots;
  }

  // Past date: no slots
  if (selectedDate < today) {
    return [];
  }

  // Keep a two-hour preparation window, rounding forward at :45.
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type) => Number(parts.find((part) => part.type === type).value);
  const earliestHour = value("hour") + 2 + (value("minute") >= 45 ? 1 : 0);

  for (
    let hour = OPENING_HOUR;
    hour < CLOSING_HOUR;
    hour++
  ) {
    if (hour >= earliestHour) {
      slots.push({
        value: `${formatHour(hour)} - ${formatHour(hour + 1)}`,
        label: `${formatHour(hour)} - ${formatHour(hour + 1)}`,
      });
    }
  }

  return slots;
}

function DeliveryPage() {
  const navigate = useNavigate();
  const { user, isCustomerAuthenticated, loading: authLoading } = useAuth();
  const checkout = getCheckout();

  const [method, setMethod] = useState(
    checkout?.delivery?.method || "delivery"
  );

  const [date, setDate] = useState(
    checkout?.delivery?.date || ""
  );

  const [time, setTime] = useState(
    checkout?.delivery?.time || ""
  );

  const [address, setAddress] = useState(
    checkout?.delivery?.address || ""
  );

  const [phone, setPhone] = useState(
    checkout?.delivery?.phone || user?.phone || ""
  );

  const [email, setEmail] = useState(
    checkout?.delivery?.email || checkout?.emailVerification?.email || user?.email || ""
  );
  const [checkoutId] = useState(
    () => checkout?.checkoutId || createCheckoutId()
  );
  const [emailVerification, setEmailVerification] = useState(
    checkout?.emailVerification || null
  );
  const [otpRequested, setOtpRequested] = useState(
    Boolean(checkout?.emailOtpRequested)
  );
  const [resendAvailableAt, setResendAvailableAt] = useState(
    checkout?.emailOtpResendAt || null
  );
  const [expiredEmailToken, setExpiredEmailToken] = useState("");

  useEffect(() => {
    if (!emailVerification?.token) return undefined;
    const delay = Math.max(0, Number(emailVerification.expiresAt) - Date.now());
    const timer = window.setTimeout(
      () => setExpiredEmailToken(emailVerification.token),
      delay
    );
    return () => window.clearTimeout(timer);
  }, [emailVerification?.token, emailVerification?.expiresAt]);

  if (!checkout) {
    return (
      <section className="page-container py-16 text-center">
        <h1 className="text-xl font-semibold">
          Your cake selection has expired
        </h1>

        <button
          type="button"
          onClick={() => navigate("/category/all")}
          className="mt-5 rounded-lg bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white"
        >
          Browse Cakes
        </button>
      </section>
    );
  }

  // Price calculation
  const quantity = Number(checkout.quantity) || 1;

  const cakePrice =
    Number(checkout.cakePrice || 0) * quantity;

  const addonsTotal =
    (checkout.addons || []).reduce(
      (total, addon) =>
        total + Number(addon.price || 0),
      0
    ) * quantity;

  const deliveryFee = method === "delivery" ? 60 : 0;

  const total = cakePrice + addonsTotal + deliveryFee;

  const today = getLocalDateString();
  const timeSlots = generateTimeSlots(date);
  const normalizedEmail = isCustomerAuthenticated
    ? user.email
    : email.trim().toLowerCase();
  const isEmailVerified = isCustomerAuthenticated || Boolean(
    emailVerification?.email === normalizedEmail &&
    emailVerification?.token &&
    expiredEmailToken !== emailVerification.token
  );

  const persistDelivery = (updates) => {
    updateCheckout({
      checkoutId,
      delivery: {
        ...(getCheckout()?.delivery || {}),
        method,
        date,
        time,
        address: method === "delivery" ? address : "",
        phone,
        email,
        ...updates,
      },
    });
  };

  const handleDateChange = (event) => {
    setDate(event.target.value);
    setTime("");
    updateCheckout({
      checkoutId,
      delivery: {
        ...(getCheckout()?.delivery || {}),
        method,
        date: event.target.value,
        time: "",
        address: method === "delivery" ? address : "",
        phone,
        email,
      },
    });
  };

  const handleContinue = () => {
    if (authLoading) return;
    const normalizedPhone = (phone || (isCustomerAuthenticated ? user.phone : "") || "").trim();
    const phoneDigits = normalizedPhone.replace(/\D/g, "");

    if (
      !/^[+\d][\d\s()-]{6,19}$/.test(normalizedPhone) ||
      phoneDigits.length < 7 ||
      phoneDigits.length > 15
    ) {
      alert("Please enter a valid phone number for your order.");
      return;
    }

    if (!isCustomerAuthenticated && !isEmailVerified) {
      alert("Please verify your email address before continuing.");
      return;
    }

    if (!date || !time) {
      alert("Please select delivery date and time.");
      return;
    }

    if (date < today) {
      alert("Please select a valid delivery date.");
      return;
    }

    const availableSlots = generateTimeSlots(date);

    const selectedSlotIsValid = availableSlots.some(
      (slot) => slot.value === time
    );

    if (!selectedSlotIsValid) {
      alert(
        "The selected delivery time is no longer available. Please select another time."
      );

      setTime("");
      return;
    }

    if (method === "delivery" && address.trim().length < 30) {
      alert("Please enter a delivery address with at least 30 characters.");
      return;
    }

    updateCheckout({
      checkoutId,
      emailVerification: isCustomerAuthenticated ? null : emailVerification,
      delivery: {
        method,
        date,
        time,
        address: method === "delivery" ? address : "",
        phone: normalizedPhone,
        email: normalizedEmail,
      },
    });

    navigate(
      checkout.productType === "ready_now"
        ? "/checkout/payment"
        : "/checkout/summary"
    );
  };

  return (
    <section className="page-container py-6 pb-10 md:py-10">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)]"
      >
        <ArrowLeft size={16} />

        {checkout.productType === "ready_now"
          ? "Ready Now"
          : "Add-ons"}
      </button>

      <CheckoutSteps currentStep={3} />

      <div className="mx-auto mt-6 max-w-xl">
        {/* Page heading */}
        <p className="text-xs font-semibold uppercase tracking-[2px] text-[var(--brand)]">
          Almost there
        </p>

        <h1
          className="mt-2 text-3xl font-semibold"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Delivery Date &amp; Time
        </h1>

        {/* Phone number */}
        <div className="mt-6">
          <label
            htmlFor="order-phone"
            className="text-sm font-semibold"
          >
            Contact phone number
          </label>

          <input
            id="order-phone"
            type="tel"
            value={phone || (isCustomerAuthenticated ? user.phone || "" : "")}
            onChange={(event) => {
              setPhone(event.target.value);
              persistDelivery({ phone: event.target.value });
            }}
            autoComplete="tel"
            placeholder="Enter your phone number"
            className="mt-3 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-3 text-sm outline-none focus:border-[var(--brand)]"
          />

          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Keep this number and your order reference to look up guest orders.
          </p>
        </div>

        {isCustomerAuthenticated ? (
          <div className="mt-5 rounded-lg border border-[var(--border)] bg-white p-4">
            <p className="text-sm font-semibold">Signed in email</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{user.email}</p>
          </div>
        ) : authLoading ? (
          <p role="status" className="mt-5 text-sm text-[var(--text-muted)]">
            Checking your account...
          </p>
        ) : (
          <EmailOtpVerification
            className="mt-5"
            email={email}
            checkoutId={checkoutId}
            verification={emailVerification}
            requestPending={otpRequested}
            resendAvailableAt={resendAvailableAt}
            onEmailChange={(value) => {
              setEmail(value);
              setEmailVerification(null);
              persistDelivery({ email: value });
              updateCheckout({ emailVerification: null, emailOtpRequested: false, emailOtpResendAt: null });
            }}
            onVerificationInvalidated={() => {
              setEmailVerification(null);
              updateCheckout({ emailVerification: null });
            }}
            onVerified={(value) => {
              setEmailVerification(value);
              updateCheckout({
                checkoutId,
                emailVerification: value,
                customerEmail: value.email,
                delivery: { ...(getCheckout()?.delivery || {}), email: value.email },
              });
            }}
            onRequestPendingChange={(value) => {
              setOtpRequested(value);
              updateCheckout({ emailOtpRequested: value });
            }}
            onResendAvailableAtChange={(value) => {
              setResendAvailableAt(value);
              updateCheckout({ emailOtpResendAt: value });
            }}
          />
        )}

        {/* Delivery / Pickup */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setMethod("delivery");
              persistDelivery({ method: "delivery" });
            }}
            className={`rounded-xl border p-4 text-left ${
              method === "delivery"
                ? "border-[var(--brand)] bg-[var(--brand-light)]"
                : "border-[var(--border)] bg-white"
            }`}
          >
            <p className="text-sm font-semibold">
              Delivery
            </p>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Get it delivered
            </p>

            <p className="mt-2 text-xs font-semibold text-[var(--brand)]">
              {formatINR(60)} delivery fee
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setMethod("pickup");
              persistDelivery({ method: "pickup" });
            }}
            className={`rounded-xl border p-4 text-left ${
              method === "pickup"
                ? "border-[var(--brand)] bg-[var(--brand-light)]"
                : "border-[var(--border)] bg-white"
            }`}
          >
            <p className="text-sm font-semibold">
              Store Pickup
            </p>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Pick up from store
            </p>

            <p className="mt-2 text-xs font-semibold text-[var(--brand)]">
              No delivery fee
            </p>
          </button>
        </div>

        {/* Date */}
        <div className="mt-6">
          <label
            htmlFor="delivery-date"
            className="text-sm font-semibold"
          >
            Select date
          </label>

          <input
            id="delivery-date"
            type="date"
            value={date}
            min={today}
            onChange={handleDateChange}
            className="mt-3 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-3 text-sm"
          />
        </div>

        {/* Time */}
        <div className="mt-5">
          <label
            htmlFor="delivery-time"
            className="text-sm font-semibold"
          >
            Select time
          </label>

          <select
            id="delivery-time"
            value={time}
            onChange={(event) => {
              setTime(event.target.value);
              persistDelivery({ time: event.target.value });
            }}
            disabled={!date || timeSlots.length === 0}
            className="mt-3 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-3 text-sm disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">
              {!date
                ? "Select a date first"
                : timeSlots.length === 0
                ? "No time slots available"
                : "Select a time"}
            </option>

            {timeSlots.map((slot) => (
              <option key={slot.value} value={slot.value}>
                {slot.label}
              </option>
            ))}
          </select>

          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Store hours: 10:00 AM - 8:00 PM
          </p>
        </div>

        {/* Delivery address */}
{method === "delivery" && (
  <div className="mt-5">
    <label
      htmlFor="delivery-address"
      className="flex items-center gap-2 text-sm font-semibold"
    >
      <MapPin
        size={16}
        className="text-[var(--brand)]"
      />
      Delivery Address
    </label>

    <textarea
      id="delivery-address"
      value={address}
      onChange={(event) => {
        setAddress(event.target.value);
        persistDelivery({ address: event.target.value });
      }}
      rows={4}
      minLength={30}
      required
      placeholder="Enter your complete delivery address"
      className="mt-3 w-full resize-none rounded-lg border border-[var(--border)] bg-white px-3 py-3 text-sm"
    />

    {address.trim().length < 30 && (
      <p className="mt-1 text-xs text-red-500">
        Please enter at least 30 characters.
        ({address.trim().length}/30)
      </p>
    )}
  </div>
)}

        {/* Pickup information */}
        {method === "pickup" && (
          <div className="mt-5 rounded-xl bg-[var(--cream-dark)] p-4">
            <p className="text-sm font-semibold">
              Store Pickup
            </p>

            <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
              Your cake will be prepared and kept ready at our
              store for the selected date and time.
            </p>
          </div>
        )}

        {/* Order price summary */}
        <div className="mt-6 space-y-3 rounded-xl border border-[var(--border)] bg-white p-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-[var(--text-muted)]">
              Cake
            </span>

            <span className="font-medium">
              {formatINR(cakePrice)}
            </span>
          </div>

          {addonsTotal > 0 && (
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-[var(--text-muted)]">
                Add-ons
              </span>

              <span className="font-medium">
                {formatINR(addonsTotal)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-[var(--text-muted)]">
              Delivery fee
            </span>

            <span className="font-medium">
              {formatINR(deliveryFee)}
            </span>
          </div>

          <div className="border-t border-[var(--border)] pt-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">
                Total
              </span>

              <span className="text-lg font-bold text-[var(--brand)]">
                {formatINR(total)}
              </span>
            </div>
          </div>
        </div>

        {/* Continue */}
        <button
          type="button"
          onClick={handleContinue}
          disabled={authLoading || (!isCustomerAuthenticated && !isEmailVerified)}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-5 py-3.5 text-sm font-semibold text-white hover:bg-[var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue · {formatINR(total)}
          <ArrowRight size={17} />
        </button>
      </div>
    </section>
  );
}

export default DeliveryPage;
