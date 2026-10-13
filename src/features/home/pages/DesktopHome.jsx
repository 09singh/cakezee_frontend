// import { ArrowRight, ShieldCheck } from "lucide-react";
// import { Link } from "react-router-dom";


// function DesktopHome({ products, categories }) {
//   const desktopCategories = categories;
//   const featuredProducts = products.slice(0, 8);

//   return (
//     <div className="hidden min-h-screen bg-white md:block">

//       {/* ================= HERO ================= */}

//       <section className="mx-auto max-w-[1400px] px-8 pt-6">
//         <div className="relative min-h-[420px] overflow-hidden rounded-[20px] bg-[#3b211c]">

//           <img
//             src="YOUR_HERO_IMAGE"
//             alt="Fresh cakes"
//             className="absolute inset-0 h-full w-full object-cover"
//           />

//           <div className="absolute inset-0 bg-black/30" />

//           <div className="relative z-10 flex min-h-[420px] items-center px-14">

//             <div className="max-w-[500px] text-white">

//               <p className="mb-3 text-sm uppercase tracking-[3px] text-white/80">
//                 Freshly baked happiness
//               </p>

//               <h1
//                 className="text-[52px] font-semibold leading-[1.05]"
//                 style={{ fontFamily: "Georgia, serif" }}
//               >
//                 Something sweet
//                 <br />
//                 for every moment.
//               </h1>

//               <p className="mt-5 max-w-[420px] text-sm leading-6 text-white/80">
//                 Beautiful cakes made fresh for birthdays,
//                 anniversaries and every celebration.
//               </p>

//               <div className="mt-7 flex gap-3">

//                 <Link
//                   to="/category/all"
//                   className="rounded-lg bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white"
//                 >
//                   Explore Cakes
//                 </Link>

//                 <Link
//                   to="/category/ready-now"
//                   className="rounded-lg border border-white/60 px-6 py-3 text-sm font-semibold text-white"
//                 >
//                   Ready Now
//                 </Link>

//               </div>

//             </div>

//           </div>
//         </div>
//       </section>


//       {/* ================= OCCASIONS ================= */}

//       <section className="mx-auto max-w-[1400px] px-8 py-10">

//         <div className="mb-5 flex items-center justify-between">

//           <div>
//             <p className="text-xs uppercase tracking-[2px] text-[var(--brand)]">
//               Find the perfect cake
//             </p>

//             <h2
//               className="mt-1 text-[28px] font-semibold"
//               style={{ fontFamily: "Georgia, serif" }}
//             >
//               Shop by Occasion
//             </h2>
//           </div>

//           <Link
//             to="/category/all"
//             className="flex items-center gap-1 text-sm font-semibold text-[var(--brand)]"
//           >
//             View All
//             <ArrowRight size={16} />
//           </Link>

//         </div>


//         <div className="grid grid-cols-6 gap-4">

//           {desktopCategories.map((category) => (

//             <Link
//               key={category._id || category.id}
//               to={`/category/${category.slug || category.id}`}
//               className="group"
//             >

//               <div className="overflow-hidden rounded-xl bg-[#f8f1ed]">

//                 <img
//                   src={category.image?.url || category.image || "/images/placeholder.webp"}
//                   alt={category.name}
//                   className="aspect-[1.15] w-full object-cover transition duration-300 group-hover:scale-105"
//                   loading="lazy"
//                 />

//               </div>

//               <p className="mt-2 text-center text-sm font-medium">
//                 {category.name}
//               </p>

//             </Link>

//           ))}

//         </div>

//       </section>


//       {/* ================= EXPLORE CAKES ================= */}

//       <section className="mx-auto max-w-[1400px] px-8 py-4">

//         <div className="mb-6 flex items-end justify-between">

//           <div>
//             <p className="text-xs uppercase tracking-[2px] text-[var(--brand)]">
//               Our favourites
//             </p>

//             <h2
//               className="mt-1 text-[30px] font-semibold"
//               style={{ fontFamily: "Georgia, serif" }}
//             >
//               Explore Cakes
//             </h2>
//           </div>

//           <Link
//             to="/category/all"
//             className="flex items-center gap-1 text-sm font-semibold"
//           >
//             See all
//             <ArrowRight size={16} />
//           </Link>

//         </div>


//         <div className="grid grid-cols-4 gap-5">

//           {featuredProducts.map((product) => (

//             <Link
//               key={product.id}
//               to={`/product/${product.id}`}
//               className="group"
//             >

//               <div className="overflow-hidden rounded-2xl bg-[#f8f1ed]">

//                 <img
//                   src={product.image}
//                   alt={product.name}
//                   loading="lazy"
//                   className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.03]"
//                 />

//               </div>

//               <div className="mt-3">

//                 <h3 className="text-sm font-semibold">
//                   {product.name}
//                 </h3>

//                 <div className="mt-1 flex items-center justify-between">

//                   <p className="text-sm font-semibold text-[var(--brand)]">
//                     ₹{product.price}
//                   </p>

//                   <span className="text-[10px] text-[var(--success)]">
//                     ● Ready
//                   </span>

//                 </div>

//               </div>

//             </Link>

//           ))}

//         </div>

//         {desktopCategories.map((category) => {
//           const categoryProducts = products.filter(
//             (product) =>
//               String(product.categoryId?._id || product.categoryId) ===
//               String(category._id || category.id)
//           );
//           if (!categoryProducts.length) return null;

//           return (
//             <div key={category._id || category.id} className="mt-10">
//               <div className="mb-5 flex items-center justify-between">
//                 <h3 className="text-xl font-semibold">{category.name}</h3>
//                 <Link
//                   to={`/category/${category.slug || category.id}`}
//                   className="flex items-center gap-1 text-sm font-semibold text-[var(--brand)]"
//                 >
//                   View all <ArrowRight size={16} />
//                 </Link>
//               </div>
//               <div className="grid grid-cols-4 gap-5">
//                 {categoryProducts.slice(0, 4).map((product) => (
//                   <Link
//                     key={product._id || product.id}
//                     to={`/product/${product.slug || product._id || product.id}`}
//                     className="group"
//                   >
//                     <div className="overflow-hidden rounded-2xl bg-[#f8f1ed]">
//                       <img
//                         src={product.images?.[0]?.url || product.image || "/images/placeholder.webp"}
//                         alt={product.name}
//                         loading="lazy"
//                         className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.03]"
//                       />
//                     </div>
//                     <h4 className="mt-3 text-sm font-semibold">{product.name}</h4>
//                     <p className="mt-1 text-sm font-semibold text-[var(--brand)]">₹{product.price || 0}</p>
//                   </Link>
//                 ))}
//               </div>
//             </div>
//           );
//         })}

//       </section>


//       {/* ================= PROMOTIONAL SECTION ================= */}

//       <section className="mx-auto max-w-[1400px] px-8 py-12">

//         <div className="grid grid-cols-2 overflow-hidden rounded-3xl bg-[#f7eee9]">

//           <div className="flex items-center px-14 py-14">

//             <div>

//               <p className="text-xs uppercase tracking-[2px] text-[var(--brand)]">
//                 Made with love
//               </p>

//               <h2
//                 className="mt-2 text-[36px] font-semibold leading-tight"
//                 style={{ fontFamily: "Georgia, serif" }}
//               >
//                 Made for every
//                 <br />
//                 special moment.
//               </h2>

//               <p className="mt-4 max-w-[400px] text-sm leading-6 text-[var(--text-muted)]">
//                 From birthdays to anniversaries, find something
//                 delicious for every celebration.
//               </p>

//               <Link
//                 to="/category/all"
//                 className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white"
//               >
//                 Shop Cakes
//                 <ArrowRight size={16} />
//               </Link>

//             </div>

//           </div>

//           <div className="min-h-[320px]">

//             <img
//               src="YOUR_PROMO_IMAGE"
//               alt="Cake celebration"
//               className="h-full w-full object-cover"
//             />

//           </div>

//         </div>

//       </section>


//       {/* ================= FOOTER ================= */}

//       <footer className="bg-[#3b211c] px-8 py-12 text-white">

//         <div className="mx-auto grid max-w-[1400px] grid-cols-4 gap-10">

//           <div>

//             <h3
//               className="text-2xl"
//               style={{ fontFamily: "Georgia, serif" }}
//             >
//               Cakezee
//             </h3>

//             <p className="mt-3 max-w-[250px] text-xs leading-5 text-white/60">
//               Fresh cakes made for every celebration.
//             </p>

//           </div>


//           <div>

//             <h4 className="text-sm font-semibold">
//               Shop
//             </h4>

//             <div className="mt-4 space-y-2 text-xs text-white/60">

//               <Link className="block" to="/category/all">
//                 All Cakes
//               </Link>

//               <Link className="block" to="/category/ready-now">
//                 Ready Now
//               </Link>

//               <Link className="block" to="/category/birthday">
//                 Birthday
//               </Link>

//             </div>

//           </div>


//           <div>

//             <h4 className="text-sm font-semibold">
//               Help
//             </h4>

//             <div className="mt-4 space-y-2 text-xs text-white/60">
//               <p>Contact Us</p>
//               <p>Delivery Information</p>
//               <p>Terms & Conditions</p>
//             </div>

//           </div>


//           <div>

//             <h4 className="text-sm font-semibold">
//               Follow Us
//             </h4>

//             <p className="mt-4 text-xs text-white/60">
//               Instagram · Facebook
//             </p>

//             {/* ================= MANAGEMENT PANELS ================= */}

// <div className="mt-6 flex flex-wrap gap-2">

//   {/* Admin */}
//   <Link
//     to="/admin"
//     className="
//       inline-flex
//       items-center
//       gap-2
//       rounded-lg
//       border
//       border-white/20
//       bg-white/5
//       px-4
//       py-2.5
//       text-xs
//       font-medium
//       text-white/80
//       transition
//       hover:bg-white/10
//       hover:text-white
//     "
//   >
//     <ShieldCheck size={14} />
//     Admin Panel
//   </Link>


//   {/* Kitchen */}
//   <Link
//     to="/kitchen"
//     className="
//       inline-flex
//       items-center
//       gap-2
//       rounded-lg
//       border
//       border-white/20
//       bg-white/5
//       px-4
//       py-2.5
//       text-xs
//       font-medium
//       text-white/80
//       transition
//       hover:bg-white/10
//       hover:text-white
//     "
//   >
//     Kitchen
//   </Link>


//   {/* Delivery */}
//   <Link
//     to="/delivery"
//     className="
//       inline-flex
//       items-center
//       gap-2
//       rounded-lg
//       border
//       border-white/20
//       bg-white/5
//       px-4
//       py-2.5
//       text-xs
//       font-medium
//       text-white/80
//       transition
//       hover:bg-white/10
//       hover:text-white
//     "
//   >
//     Delivery
//   </Link>

//               {/* stafflogin */}
//   <Link
//     to="/staff/login"
//     className="
//       inline-flex
//       items-center
//       gap-2
//       rounded-lg
//       border
//       border-white/20
//       bg-white/5
//       px-4
//       py-2.5
//       text-xs
//       font-medium
//       text-white/80
//       transition
//       hover:bg-white/10
//       hover:text-white
//     "
//   >
//     Delivery
//   </Link>
// </div>
//           </div>

//         </div>

//       </footer>

//     </div>
//   );
// }

// export default DesktopHome;