import {
  ArrowLeft,
  ArrowRight,
  MapPin,
} from "lucide-react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CheckoutSteps from "../components/CheckoutSteps";
import {
  getCheckout,
  updateCheckout,
} from "../utils/checkoutStorage";

const OPENING_HOUR = 10; // 10 AM
const CLOSING_HOUR = 20; // 8 PM

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

  // Future date → show all bakery hours
  if (selectedDate > today) {
    for (let hour = OPENING_HOUR; hour < CLOSING_HOUR; hour++) {
      slots.push({
        value: `${formatHour(hour)} - ${formatHour(hour + 1)}`,
        label: `${formatHour(hour)} - ${formatHour(hour + 1)}`,
      });
    }

    return slots;
  }

  // Past date → no slots
  if (selectedDate < today) {
    return [];
  }

  // Today's date
  const now = new Date();
  const currentHour = now.getHours();

  for (
    let hour = OPENING_HOUR;
    hour < CLOSING_HOUR;
    hour++
  ) {
    /*
      Example:

      Current time = 4:30 PM
      currentHour = 16

      10-11 → removed
      11-12 → removed
      ...
      3-4 → removed
      4-5 → available
      5-6 → available
    */

    if (hour >= currentHour) {
      slots.push({
        value: `${formatHour(hour)} - ${formatHour(hour + 2)}`,
        label: `${formatHour(hour)} - ${formatHour(hour + 2)}`,
      });
    }
  }

  return slots;
}

function DeliveryPage() {
  const navigate = useNavigate();

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
    checkout?.delivery?.phone || ""
  );

  if (!checkout) {
    return null;
  }

  const quantity = Number(checkout.quantity) || 1;
  const cakePrice = Number(checkout.cakePrice || 0) * quantity;

  const addonsTotal =
    checkout.addons?.reduce(
      (total, addon) => total + Number(addon.price || 0),
      0
    ) * quantity || 0;

  const deliveryFee = method === "delivery" ? 60 : 0;

  const total = cakePrice + addonsTotal + deliveryFee;

  const today = getLocalDateString();

  const timeSlots = generateTimeSlots(date);

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;

    setDate(selectedDate);

    // Reset time whenever date changes
    setTime("");
  };

  const handleContinue = () => {
    const normalizedPhone = phone.trim();
    const phoneDigits = normalizedPhone.replace(/\D/g, "");

    if (
      !/^[+\d][\d\s()-]{6,19}$/.test(normalizedPhone) ||
      phoneDigits.length < 7 ||
      phoneDigits.length > 15
    ) {
      alert("Please enter a valid phone number for your order.");
      return;
    }

    if (!date || !time) {
      alert("Please select delivery date and time.");
      return;
    }

    // Extra protection against manually submitting a past date
    if (date < today) {
      alert("Please select a valid delivery date.");
      return;
    }

    // Extra protection for today's time slots
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

    if (method === "delivery" && !address.trim()) {
      alert("Please enter your delivery address.");
      return;
    }
    // const phoneDigits = phone.replace(/\D/g, "");
    // if (
    //   !/^[+\d][\d\s()-]{6,19}$/.test(phone.trim()) ||
    //   phoneDigits.length < 7 ||
    //   phoneDigits.length > 15
    // ) {
    //   alert("Please enter a valid phone number for your order.");
    //   return;
    // }

    updateCheckout({
      delivery: {
        method,
        date,
        time,
        address: method === "delivery" ? address : "",
        phone: normalizedPhone,
      },
    });

    navigate(checkout.productType === "ready_now" ? "/checkout/payment" : "/checkout/summary");
  };

  return (
    <section className="page-container py-6 md:py-10">

      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)]"
      >
        <ArrowLeft size={16} />
        {checkout.productType === "ready_now" ? "Ready Now" : "Add-ons"}
      </button>

      <CheckoutSteps currentStep={3} />

      <div className="mx-auto mt-6 max-w-xl">

        <p className="text-xs font-semibold uppercase tracking-[2px] text-[var(--brand)]">
          Almost there
        </p>

        <h1
          className="mt-2 text-3xl font-semibold"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Delivery Date & Time
        </h1>

        <div className="mt-6">
          <label htmlFor="order-phone" className="text-sm font-semibold">
            Contact phone number
          </label>
          <input
            id="order-phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            autoComplete="tel"
            placeholder="Enter your phone number"
            className="mt-3 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-3 text-sm"
          />
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Keep this number and your order reference to look up guest orders.
          </p>
        </div>

        {/* Delivery / Pickup */}
        <div className="mt-6 grid grid-cols-2 gap-3">

          <button
            type="button"
            onClick={() => setMethod("delivery")}
            className={`
              rounded-xl border p-4 text-left
              ${
                method === "delivery"
                  ? "border-[var(--brand)] bg-[var(--brand-light)]"
                  : "border-[var(--border)] bg-white"
              }
            `}
          >
            <p className="text-sm font-semibold">
              Delivery
            </p>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Get it delivered
            </p>
          </button>

          <button
            type="button"
            onClick={() => setMethod("pickup")}
            className={`
              rounded-xl border p-4 text-left
              ${
                method === "pickup"
                  ? "border-[var(--brand)] bg-[var(--brand-light)]"
                  : "border-[var(--border)] bg-white"
              }
            `}
          >
            <p className="text-sm font-semibold">
              Store Pickup
            </p>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Pick up from store
            </p>
          </button>
        </div>

        {/* Date */}
        <div className="mt-6">

          <label className="text-sm font-semibold">
            Select date
          </label>

          <input
            type="date"
            value={date}
            min={today}
            onChange={handleDateChange}
            className="
              mt-3
              w-full
              rounded-lg
              border
              border-[var(--border)]
              bg-white
              px-3
              py-3
              text-sm
            "
          />

        </div>

        {/* Time */}
        <div className="mt-5">

          <label className="text-sm font-semibold">
            Select time
          </label>

          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={!date || timeSlots.length === 0}
            className="
              mt-3
              w-full
              rounded-lg
              border
              border-[var(--border)]
              bg-white
              px-3
              py-3
              text-sm
              disabled:cursor-not-allowed
              disabled:bg-gray-100
              disabled:text-gray-400
            "
          >

            <option value="">
              {!date
                ? "Select a date first"
                : timeSlots.length === 0
                ? "No time slots available"
                : "Select a time"}
            </option>

            {timeSlots.map((slot) => (
              <option
                key={slot.value}
                value={slot.value}
              >
                {slot.label}
              </option>
            ))}

          </select>

          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Store hours: 10:00 AM - 8:00 PM
          </p>

        </div>

        {/* Address */}
        {method === "delivery" && (
          <div className="mt-5">

            <label className="flex items-center gap-2 text-sm font-semibold">

              <MapPin
                size={16}
                className="text-[var(--brand)]"
              />

              Delivery Address

            </label>

            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={4}
              placeholder="Enter your complete delivery address"
              className="
                mt-3
                w-full
                resize-none
                rounded-lg
                border
                border-[var(--border)]
                bg-white
                px-3
                py-3
                text-sm
              "
            />

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

        {/* Continue */}
        <button
          onClick={handleContinue}
          className="
            mt-6
            flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-lg
            bg-[var(--brand)]
            px-5
            py-3.5
            text-sm
            font-semibold
            text-white
          "
        >
          Continue · ₹{total}

          <ArrowRight size={17} />

        </button>

      </div>

    </section>
  );
}

export default DeliveryPage;
