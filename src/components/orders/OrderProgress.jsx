import {
  Check,
  ChefHat,
  PackageCheck,
  Truck,
} from "lucide-react";

const customerOrderStages = [
  { label: "Order Confirmed", icon: Check },
  { label: "Order Preparing", icon: ChefHat },
  { label: "Out for Delivery", icon: Truck },
  { label: "Delivered", icon: PackageCheck },
];

function getCustomerOrderStage(status) {
  const normalizedStatus = String(status || "Confirmed").trim().toLowerCase();

  if (normalizedStatus === "cancelled" || normalizedStatus === "rejected") {
    return -1;
  }
  if (normalizedStatus === "delivered") return 3;
  if (
    normalizedStatus === "out for delivery" ||
    normalizedStatus === "delivery failed"
  ) {
    return 2;
  }
  if (
    normalizedStatus === "preparing" ||
    normalizedStatus === "ready" ||
    normalizedStatus === "ready for delivery" ||
    normalizedStatus === "returned to bakery"
  ) {
    return 1;
  }

  return 0;
}

function OrderProgress({ status }) {
  const currentStage = getCustomerOrderStage(status);

  if (currentStage < 0) return null;

  return (
    <section
      aria-label={`Order status: ${customerOrderStages[currentStage].label}`}
      className="border-b border-[var(--border)] px-4 py-5 sm:px-5"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <PackageCheck size={17} className="text-[var(--brand)]" />
          <h2 className="text-sm font-semibold">Order Progress</h2>
        </div>
        <span className="rounded-full bg-[var(--cream-dark)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
          {customerOrderStages[currentStage].label}
        </span>
      </div>

      <div className="relative">
        <div className="absolute left-[12.5%] right-[12.5%] top-4 h-1 rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-[var(--brand)] transition-all"
            style={{ width: `${(currentStage / (customerOrderStages.length - 1)) * 100}%` }}
          />
        </div>

        <ol className="relative grid grid-cols-4">
          {customerOrderStages.map(({ label, icon: Icon }, index) => {
            const complete = index <= currentStage;
            const current = index === currentStage;
            return (
              <li
                key={label}
                aria-current={current ? "step" : undefined}
                className={`flex min-w-0 flex-col items-center text-center ${
                  complete ? "text-[var(--brand)]" : "text-gray-400"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    complete
                      ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <Icon size={15} />
                </span>
                <span
                  className={`mt-2 max-w-[90px] text-[9px] leading-3 sm:max-w-none sm:text-xs sm:leading-4 ${
                    current ? "font-bold" : complete ? "font-medium" : ""
                  }`}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export default OrderProgress;
