
import { Check } from "lucide-react";

function CheckoutSteps({ currentStep = 1 }) {
  const steps = [
    {
      number: 1,
      label: "Cake",
    },
    {
      number: 2,
      label: "Personalise",
    },
    {
      number: 3,
      label: "Delivery",
    },
    {
      number: 4,
      label: "Pay",
    },
  ];

  return (
    <div className="mb-8 w-full">
      <div className="flex items-start justify-between">

        {steps.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;

          return (
            <div
              key={step.number}
              className="relative flex flex-1 flex-col items-center"
            >

              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    absolute
                    left-1/2
                    top-4
                    h-[2px]
                    w-full
                    -z-10
                    ${
                      step.number < currentStep
                        ? "bg-[var(--brand)]"
                        : "bg-[var(--border)]"
                    }
                  `}
                />
              )}

              {/* Circle */}
              <div
                className={`
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-full
                  border-2
                  text-xs
                  font-semibold
                  transition
                  ${
                    isCompleted
                      ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                      : isActive
                      ? "border-[var(--brand)] bg-white text-[var(--brand)] ring-4 ring-[var(--brand-light)]"
                      : "border-[var(--border)] bg-white text-[var(--text-muted)]"
                  }
                `}
              >
                {isCompleted ? (
                  <Check size={15} />
                ) : (
                  step.number
                )}
              </div>

              {/* Label */}
              <p
                className={`
                  mt-2
                  text-center
                  text-[11px]
                  font-medium
                  ${
                    isActive || isCompleted
                      ? "text-[var(--brand)]"
                      : "text-[var(--text-muted)]"
                  }
                `}
              >
                {step.label}
              </p>

            </div>
          );
        })}

      </div>
    </div>
  );
}

export default CheckoutSteps;
