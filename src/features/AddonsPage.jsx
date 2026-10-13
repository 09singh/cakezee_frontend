
// import {
//   ArrowLeft,
//   ArrowRight,
// } from "lucide-react";

// import { useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import CheckoutSteps from "../components/CheckoutSteps";
// import {
//   getCheckout,
//   updateCheckout,
// } from "../utils/checkoutStorage";

// import { ADDONS } from "../data/addons";

// function AddonsPage() {
//   const navigate = useNavigate();

//   const checkout = getCheckout();

//   const category = checkout?.category;

//   // Get addons according to cake category
//   const availableAddons = ADDONS[category] || [];

//   // Selected addon IDs
//   const [selected, setSelected] = useState(
//     checkout?.addons?.map((item) => item.id) || []
//   );

//   // Calculate total only when selected/addons change
//  const addonsTotal = useMemo(() => {
//   return availableAddons
//     .filter((addon) => selected.includes(addon.id))
//     .reduce(
//       (total, addon) => total + Number(addon.price || 0),
//       0
//     );
// }, [availableAddons, selected]);

// const cakePrice = Number(checkout?.cakePrice || 0);

// const total = cakePrice + addonsTotal;

//   // If checkout does not exist
//   if (!checkout) {
//     return (
//       <section className="page-container py-16 text-center">
//         <h1 className="text-xl font-semibold">
//           No cake selected
//         </h1>

//         <button
//           onClick={() => navigate("/category/all")}
//           className="mt-5 rounded-lg bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white"
//         >
//           Browse Cakes
//         </button>
//       </section>
//     );
//   }

//   // Toggle addon
//   const toggleAddon = (addon) => {
//     setSelected((current) => {
//       if (current.includes(addon.id)) {
//         return current.filter(
//           (id) => id !== addon.id
//         );
//       }

//       return [...current, addon.id];
//     });
//   };

//   // Continue to delivery
//   const handleContinue = () => {
//     const selectedAddons = availableAddons.filter(
//       (addon) => selected.includes(addon.id)
//     );

//     updateCheckout({
//       addons: selectedAddons,
//     });

//     navigate("/checkout/delivery");
//   };

//   return (
//     <section className="page-container py-6 md:py-10">

//       {/* Back */}
//       <button
//         onClick={() => navigate(-1)}
//         className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)]"
//       >
//         <ArrowLeft size={16} />
//         Personalise
//       </button>
//       <CheckoutSteps currentStep={2} />
//       <div className="mx-auto mt-6 max-w-2xl">

//         {/* Heading */}
//         <p className="text-xs font-semibold uppercase tracking-[2px] text-[var(--brand)]">
//           Complete your celebration
//         </p>

//         <h1
//           className="mt-2 text-3xl font-semibold"
//           style={{ fontFamily: "Georgia, serif" }}
//         >
//           Add some extras
//         </h1>

//         <p className="mt-2 text-sm text-[var(--text-muted)]">
//           Choose something extra for your celebration.
//         </p>

//         {/* Category */}
//         <div className="mt-4 rounded-lg bg-[var(--cream-dark)] px-3 py-2">
//           <p className="text-xs text-[var(--text-muted)]">
//             Showing add-ons for
//           </p>

//           <p className="mt-1 text-sm font-semibold capitalize">
//             {category?.replace("-", " ") || "Celebration"}
//           </p>
//         </div>

//         {/* No addons */}
//         {availableAddons.length === 0 && (
//           <div className="mt-6 rounded-xl border border-[var(--border)] bg-white p-6 text-center">
//             <p className="text-sm font-medium">
//               No add-ons available
//             </p>

//             <p className="mt-1 text-xs text-[var(--text-muted)]">
//               You can continue without adding anything.
//             </p>
//           </div>
//         )}

//         {/* Addons */}
//         {availableAddons.length > 0 && (
//           <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">

//             {availableAddons.map((addon) => {
//               const isSelected =
//                 selected.includes(addon.id);

//               return (
//                 <button
//                   key={addon.id}
//                   type="button"
//                   onClick={() => toggleAddon(addon)}
//                   className={`
//                     overflow-hidden
//                     rounded-xl
//                     border
//                     bg-white
//                     text-left
//                     transition
//                     ${
//                       isSelected
//                         ? "border-[var(--brand)] ring-2 ring-[var(--brand-light)]"
//                         : "border-[var(--border)]"
//                     }
//                   `}
//                 >

//                   {/* Optimized Image Container */}
//                   <div className="aspect-square w-full overflow-hidden bg-gray-100">

//                     <img
//                       src={addon.image}
//                       alt={addon.name}
//                       loading="lazy"
//                       decoding="async"
//                       className="h-full w-full object-cover"
//                     />

//                   </div>

//                   {/* Content */}
//                   <div className="p-3">

//                     <h2 className="text-sm font-semibold">
//                       {addon.name}
//                     </h2>

//                     <p className="mt-1 text-sm text-[var(--brand)]">
//                       ₹{addon.price}
//                     </p>

//                     {/* Add Button */}
//                     <div
//                       className={`
//                         mt-2
//                         rounded-md
//                         py-1.5
//                         text-center
//                         text-xs
//                         font-semibold
//                         ${
//                           isSelected
//                             ? "bg-[var(--brand)] text-white"
//                             : "bg-[var(--cream-dark)]"
//                         }
//                       `}
//                     >
//                       {isSelected
//                         ? "Added ✓"
//                         : "Add"}
//                     </div>

//                   </div>

//                 </button>
//               );
//             })}

//           </div>
//         )}

//         {/* Addon Total */}
//         <div className="mt-6 flex items-center justify-between rounded-xl bg-[var(--cream-dark)] p-4">

//           <span className="text-sm">
//             Add-ons total
//           </span>

//           <span className="font-semibold text-[var(--brand)]">
//             ₹{addonsTotal}
//           </span>

//         </div>

//         {/* Continue */}
//         {/* Continue */}
// <button
//   onClick={handleContinue}
//   className="
//     mt-5
//     flex
//     w-full
//     items-center
//     justify-center
//     gap-2
//     rounded-lg
//     bg-[var(--brand)]
//     px-5
//     py-3.5
//     text-sm
//     font-semibold
//     text-white
//   "
// >
//   Continue · ₹{total}
//   <ArrowRight size={17} />
// </button>
//       </div>
//     </section>
//   );
// }

// export default AddonsPage;
