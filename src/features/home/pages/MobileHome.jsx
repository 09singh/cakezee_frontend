
// import { ArrowRight, ShieldCheck } from "lucide-react";
// import { Link } from "react-router-dom";


// function Home({ products, categories }) {
//   const visibleCategories = categories;
//   const readyNowProducts = products.slice(0, 4);

//   return (
//     <div className="pb-6">

//       {/* =========================================================
//           DELIVERY MODES
//       ========================================================= */}

//       <section className="page-container mt-5">
//         <div className="grid grid-cols-2 gap-2">

//           {/* Ready Now */}
//           <div
//             className="
//               rounded-xl
//               border
//               border-[var(--border)]
//               bg-white
//               px-3
//               py-3
//             "
//           >
//             <div className="text-sm font-semibold">
//               ⚡ Ready Now
//             </div>

//             <div className="mt-1 text-xs text-[var(--text-muted)]">
//               ~20 Min
//             </div>
//           </div>

//           {/* Fresh Cakes */}
//           <div
//             className="
//               rounded-xl
//               border
//               border-[var(--border)]
//               bg-white
//               px-3
//               py-3
//             "
//           >
//             <div className="text-sm font-semibold">
//               ◷ Fresh Cakes
//             </div>

//             <div className="mt-1 text-xs text-[var(--text-muted)]">
//               ~1 Hour
//             </div>
//           </div>

//         </div>
//       </section>


//       {/* =========================================================
//           CATEGORIES
//       ========================================================= */}

//       <section className="page-container mt-7">

//         <div className="mb-4 flex items-center justify-between">

//           <h2
//             className="
//               text-[21px]
//               font-semibold
//               tracking-[-0.5px]
//             "
//             style={{
//               fontFamily: "Georgia, serif",
//             }}
//           >
//             What are you celebrating?
//           </h2>

//         </div>


//         <div
//           className="
//             grid
//             grid-cols-3
//             gap-x-3
//             gap-y-4
//             sm:grid-cols-4
//             md:grid-cols-5
//           "
//         >

//           {visibleCategories.map((category) => (

//             <Link
//               key={category._id || category.id}
//               to={`/category/${category.slug || category.id}`}
//               className="pressable text-center"
//             >

//               <div
//                 className="
//                   overflow-hidden
//                   rounded-xl
//                   bg-[var(--cream-dark)]
//                 "
//               >

//                 <img
//                   src={category.image?.url || category.image || "/images/placeholder.webp"}
//                   alt={category.name}
//                   decoding="async"
//                   width="180"
//                   height="180"
//                   className="
//                     aspect-square
//                     w-full
//                     object-cover
//                   "
//                 />

//               </div>

//               <p className="mt-2 text-[11px] font-medium">
//                 {category.name}
//               </p>

//             </Link>

//           ))}

//         </div>


//         {/* View More */}
//         <Link
//           to="/category/all"
//           className="
//             mt-6
//             flex
//             items-center
//             justify-center
//             gap-2
//             rounded-xl
//             border
//             border-[var(--brand)]
//             py-3
//             text-sm
//             font-semibold
//             text-[var(--brand)]
//           "
//         >
//           View More Occasions
//           <ArrowRight size={16} />
//         </Link>

//       </section>


//       {/* =========================================================
//           READY NOW
//       ========================================================= */}

//       <section className="mt-9">

//         <div className="page-container">

//           <div className="flex items-end justify-between">

//             <div>

//               <h2
//                 className="
//                   text-[21px]
//                   font-semibold
//                   tracking-[-0.5px]
//                 "
//                 style={{
//                   fontFamily: "Georgia, serif",
//                 }}
//               >
//                 Ready Now
//               </h2>

//               <p className="mt-1 text-xs text-[var(--text-muted)]">
//                 Freshly made. Delivered quickly.
//               </p>

//             </div>


//             <Link
//               to="/category/ready-now"
//               className="
//                 text-xs
//                 font-semibold
//                 text-[var(--brand)]
//               "
//             >
//               See All
//             </Link>

//           </div>

//         </div>


//         {/* Horizontal Products */}

//         <div
//           className="
//             mt-4
//             flex
//             gap-3
//             overflow-x-auto
//             px-4
//             pb-2
//             md:px-8
//           "
//         >

//           {readyNowProducts.map((product) => (

//             <Link
//               key={product.id}
//               to={`/product/${product.id}`}
//               className="
//                 pressable
//                 min-w-[175px]
//                 max-w-[190px]
//                 flex-1
//                 md:min-w-[210px]
//               "
//             >

//               <div
//                 className="
//                   overflow-hidden
//                   rounded-2xl
//                   bg-[var(--cream-dark)]
//                 "
//               >

//                 <img
//                   src={product.image}
//                   alt={product.name}
//                   decoding="async"
//                   width="300"
//                   height="300"
//                   className="product-image"
//                 />

//               </div>


//               <div className="mt-2">

//                 <p className="text-sm font-semibold">
//                   {product.name}
//                 </p>

//                 <p
//                   className="
//                     mt-1
//                     text-sm
//                     font-semibold
//                     text-[var(--brand)]
//                   "
//                 >
//                   ₹{product.price}
//                 </p>

//                 <p
//                   className="
//                     mt-1
//                     text-[10px]
//                     text-[var(--success)]
//                   "
//                 >
//                   ● 20–30 min
//                 </p>

//               </div>

//             </Link>

//           ))}

//         </div>

//       </section>

//       <section className="page-container mt-9 space-y-8">
//         {visibleCategories.map((category) => {
//           const categoryProducts = products.filter(
//             (product) =>
//               String(product.categoryId?._id || product.categoryId) ===
//               String(category._id || category.id)
//           );
//           if (!categoryProducts.length) return null;

//           return (
//             <div key={category._id || category.id}>
//               <div className="mb-3 flex items-center justify-between">
//                 <h2 className="text-lg font-semibold" style={{ fontFamily: "Georgia, serif" }}>
//                   {category.name}
//                 </h2>
//                 <Link
//                   to={`/category/${category.slug || category.id}`}
//                   className="text-xs font-semibold text-[var(--brand)]"
//                 >
//                   View all
//                 </Link>
//               </div>
//               <div className="grid grid-cols-2 gap-3">
//                 {categoryProducts.slice(0, 4).map((product) => (
//                   <Link
//                     key={product._id || product.id}
//                     to={`/product/${product.slug || product._id || product.id}`}
//                     className="min-w-0"
//                   >
//                     <img
//                       src={product.images?.[0]?.url || product.image || "/images/placeholder.webp"}
//                       alt={product.name}
//                       loading="lazy"
//                       className="aspect-square w-full rounded-xl object-cover"
//                     />
//                     <p className="mt-2 truncate text-sm font-semibold">{product.name}</p>
//                     <p className="mt-1 text-sm font-semibold text-[var(--brand)]">₹{product.price || 0}</p>
//                   </Link>
//                 ))}
//               </div>
//             </div>
//           );
//         })}
//       </section>


//       {/* =========================================================
//           PROMOTIONAL SECTION
//       ========================================================= */}

//       <section className="page-container mt-8">

//         <div
//           className="
//             relative
//             overflow-hidden
//             rounded-2xl
//             bg-[var(--brand)]
//             px-6
//             py-7
//             text-white
//           "
//         >

//           {/* Decorative Circle */}

//           <div
//             className="
//               absolute
//               -right-10
//               -top-10
//               h-32
//               w-32
//               rounded-full
//               bg-white/10
//             "
//           />

//           <div
//             className="
//               absolute
//               -bottom-12
//               right-16
//               h-24
//               w-24
//               rounded-full
//               bg-white/5
//             "
//           />


//           <div className="relative z-10">

//             <p
//               className="
//                 text-xs
//                 font-medium
//                 uppercase
//                 tracking-wider
//                 text-white/75
//               "
//             >
//               Sweet moments
//             </p>


//             <h2
//               className="
//                 mt-1
//                 max-w-[250px]
//                 text-2xl
//                 font-semibold
//                 leading-tight
//               "
//               style={{
//                 fontFamily: "Georgia, serif",
//               }}
//             >
//               Celebrate Every Special Moment
//             </h2>


//             <p
//               className="
//                 mt-2
//                 max-w-[250px]
//                 text-xs
//                 leading-relaxed
//                 text-white/80
//               "
//             >
//               Delicious cakes made to make your celebrations
//               extra special.
//             </p>


//             <Link
//               to="/category/all"
//               className="
//                 mt-5
//                 inline-flex
//                 items-center
//                 gap-2
//                 rounded-lg
//                 bg-white
//                 px-4
//                 py-2.5
//                 text-xs
//                 font-semibold
//                 text-[var(--brand)]
//                 transition
//                 hover:bg-white/90
//               "
//             >
//               Explore Cakes
//               <ArrowRight size={14} />
//             </Link>

//           </div>

//         </div>

//       </section>


//       {/* =========================================================
//           MOBILE FOOTER
//       ========================================================= */}

//       <footer
//         className="
//           mt-10
//           bg-[#3b211c]
//           px-5
//           py-8
//           text-white
//         "
//       >

//         <div className="space-y-7">

//           {/* Brand */}

//           <div>

//             <h3
//               className="text-2xl"
//               style={{
//                 fontFamily: "Georgia, serif",
//               }}
//             >
//               Cakezee
//             </h3>

//             <p
//               className="
//                 mt-2
//                 max-w-[280px]
//                 text-xs
//                 leading-5
//                 text-white/60
//               "
//             >
//               Fresh cakes made for every celebration.
//             </p>

//           </div>


//           {/* Shop */}

//           <div>

//             <h4 className="text-sm font-semibold">
//               Shop
//             </h4>

//             <div
//               className="
//                 mt-3
//                 space-y-2
//                 text-xs
//                 text-white/60
//               "
//             >

//               <Link
//                 className="block"
//                 to="/category/all"
//               >
//                 All Cakes
//               </Link>

//               <Link
//                 className="block"
//                 to="/category/ready-now"
//               >
//                 Ready Now
//               </Link>

//               <Link
//                 className="block"
//                 to="/category/birthday"
//               >
//                 Birthday
//               </Link>

//             </div>

//           </div>


//           {/* Help */}

//           <div>

//             <h4 className="text-sm font-semibold">
//               Help
//             </h4>

//             <div
//               className="
//                 mt-3
//                 space-y-2
//                 text-xs
//                 text-white/60
//               "
//             >

//               <p>Contact Us</p>
//               <p>Delivery Information</p>
//               <p>Terms & Conditions</p>

//             </div>

//           </div>


//           {/* Follow */}

//           <div>

//             <h4 className="text-sm font-semibold">
//               Follow Us
//             </h4>

//             <p
//               className="
//                 mt-3
//                 text-xs
//                 text-white/60
//               "
//             >
//               Instagram · Facebook
//             </p>


//             {/* =====================================================
//                 STAFF LOGIN
//             ===================================================== */}

//             <div className="mt-5">

//               <Link
//                 to="/staff/login"
//                 className="
//                   inline-flex
//                   w-full
//                   items-center
//                   justify-center
//                   gap-2
//                   rounded-lg
//                   border
//                   border-white/20
//                   bg-white/5
//                   px-4
//                   py-3
//                   text-xs
//                   font-medium
//                   text-white/80
//                   transition
//                   hover:bg-white/10
//                   hover:text-white
//                 "
//               >

//                 <ShieldCheck size={15} />

//                 Staff Login

//               </Link>

//             </div>

//           </div>


//           {/* Copyright */}

//           <div
//             className="
//               border-t
//               border-white/10
//               pt-5
//               text-center
//               text-[10px]
//               text-white/40
//             "
//           >
//             © {new Date().getFullYear()} Cakezee. All rights reserved.
//           </div>

//         </div>

//       </footer>

//     </div>
//   );
// }

// export default Home;
