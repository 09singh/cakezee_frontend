
import { useEffect, useState } from "react";
import {
  Menu,
  X,
  Search,
  ShoppingCart,
  UserRound,
  House,
  Gift,
  Package,
  ChevronRight,
} from "lucide-react";

import { Link, useLocation } from "react-router-dom";
import { getCart } from "../../data/cart";
import CakezeeLogo from "../../assets/images/cakezee-logo.png.png";

function Header() {
  const [cartCount, setCartCount] = useState(() =>
    getCart().reduce((count, item) => count + item.quantity, 0)
  );

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const location = useLocation();

  const navLinks = [
    { label: "Home", to: "/", icon: House },
    { label: "Cakes", to: "/category/all", icon: Gift },
    // { label: "Ready Now", to: "/category/ready-now", icon: Gift },
    { label: "Benetto", to: "/category/ready-now?category=benetto", icon: Gift },
    { label: "Dessert", to: "/category/ready-now?category=dessert", icon: Gift },
    { label: "Pastries", to: "/category/ready-now?category=pastries", icon: Gift },
    // { label: "Birthday Cakes", to: "/category/birthday", icon: Gift },
    // { label: "Anniversary", to: "/category/anniversary", icon: Gift },
    // { label: "Kids Cakes", to: "/category/kids", icon: Baby },
    { label: "My Orders", to: "/orders", icon: Package },
  ];

  useEffect(() => {
    function updateCartCount() {
      setCartCount(
        getCart().reduce((count, item) => count + item.quantity, 0)
      );
    }

    window.addEventListener("cakezee:cart-updated", updateCartCount);

    return () =>
      window.removeEventListener("cakezee:cart-updated", updateCartCount);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  // Lock background scrolling and support Escape to close.
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--cream)]/95 backdrop-blur-xl">
        {/* HEADER BAR */}
        <div className="relative mx-auto flex h-[64px] max-w-[1440px] items-center px-4 md:h-[72px] md:px-8">
          {/* MOBILE MENU BUTTON */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen((open) => !open);
              setMobileSearchOpen(false);
            }}
            className={`z-[80] flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 md:hidden ${
              mobileMenuOpen
                ? "bg-[#65152D] text-[#FFF5E9]"
                : "text-[#65152D] hover:bg-[#65152D]/10"
            }`}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="cakezee-mobile-sidebar"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

         {/* LOGO */}
<Link
  to="/"
  onClick={() => setMobileMenuOpen(false)}
  className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0"
  aria-label="Cakezee Home"
>
  <img
    src={CakezeeLogo}
    alt="Cakezee — Made for Every Celebration"
    className="h-auto w-[145px] object-contain sm:w-[165px] md:w-[190px] lg:w-[220px]"
    decoding="async"
  />
            
</Link>

          {/* DESKTOP NAVIGATION */}
          <nav className="ml-5 hidden min-w-0 flex-1 items-center gap-4 overflow-x-auto whitespace-nowrap text-xs lg:ml-8 lg:gap-5 lg:text-sm md:flex">
            {navLinks.map((item) => {
              const itemPath = item.to.split("?")[0];
              const itemSearch = item.to.includes("?")
                ? `?${item.to.split("?")[1]}`
                : "";
              const isActive =
                location.pathname === itemPath &&
                (!itemSearch || location.search === itemSearch);

              return (
              <Link
                key={item.to}
                to={item.to}
                className={`transition hover:text-[var(--brand)] ${
                  isActive
                    ? "font-semibold text-[var(--brand)]"
                    : ""
                }`}
              >
                {item.label}
              </Link>
              );
            })}
          </nav>

          {/* HEADER ACTIONS */}
          <div className="ml-auto flex items-center gap-1 md:gap-3">
            {/* DESKTOP SEARCH */}
            <div className="hidden h-10 w-[220px] items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 md:flex">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search cakes..."
                aria-label="Search cakes"
                className="w-full bg-transparent text-xs outline-none"
              />
            </div>

            {/* MOBILE SEARCH */}
            <button
              type="button"
              onClick={() => {
                setMobileSearchOpen((open) => !open);
                setMobileMenuOpen(false);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#65152D] hover:bg-[#65152D]/10 md:hidden"
              aria-label="Search cakes"
              aria-expanded={mobileSearchOpen}
            >
              <Search size={20} />
            </button>

            {/* DESKTOP PROFILE */}
            <Link
              to="/profile"
              aria-label="Profile"
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] md:flex"
            >
              <UserRound size={18} />
            </Link>

            {/* CART */}
            <Link
              to="/cart"
              aria-label={`Cart, ${cartCount} items`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#65152D] hover:bg-[#65152D]/10 md:border md:border-[var(--border)]"
            >
              <ShoppingCart size={20} />

              {cartCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#65152D] px-1 text-[9px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* MOBILE SEARCH */}
        <div
          className={`overflow-hidden border-t border-[var(--border)] bg-[var(--cream)] transition-all duration-300 md:hidden ${
            mobileSearchOpen
              ? "max-h-20 px-4 py-3 opacity-100"
              : "max-h-0 border-transparent px-4 py-0 opacity-0"
          }`}
          aria-hidden={!mobileSearchOpen}
        >
          <div className="flex h-11 items-center gap-3 rounded-xl border border-[#65152D]/20 bg-white px-4">
            <Search size={18} className="text-[#65152D]" />
            <input
              type="text"
              tabIndex={mobileSearchOpen ? 0 : -1}
              placeholder="Search cakes..."
              aria-label="Search cakes"
              className="w-full bg-transparent text-sm text-[#45101F] outline-none"
            />
          </div>
        </div>
      </header>

      {/* FULL-SCREEN MOBILE MENU */}
      <div
        className={`fixed inset-0 z-[9999] md:hidden ${
          mobileMenuOpen
            ? "pointer-events-auto"
            : "pointer-events-none"
        }`}
        style={{ height: "100dvh" }}
        aria-hidden={!mobileMenuOpen}
      >
        {/* BACKDROP */}
        <button
          type="button"
          tabIndex={mobileMenuOpen ? 0 : -1}
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
          className={`absolute inset-0 h-full w-full bg-black/55 backdrop-blur-[3px] transition-opacity duration-300 ${
            mobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* SLIDING SIDEBAR */}
        <aside
          id="cakezee-mobile-sidebar"
          role="dialog"
          aria-modal="true"
          aria-label="Cakezee navigation menu"
          className={`absolute inset-y-0 left-0 flex h-full w-[min(86vw,340px)] flex-col overflow-y-auto overscroll-contain bg-[#65152D] text-[#FFF5E9] shadow-2xl transition-transform duration-300 ease-out ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
         {/* BRAND HEADER */}
<div className="relative overflow-hidden border-b border-white/15 px-6 pb-6 pt-7">
  <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full border border-[#E9C99D]/20" />
  <div className="pointer-events-none absolute -right-2 -top-4 h-24 w-24 rounded-full border border-[#E9C99D]/20" />

  <div className="relative flex items-start justify-between gap-3">
    <div className="min-w-0">
      <Link
        to="/"
        onClick={() => setMobileMenuOpen(false)}
        tabIndex={mobileMenuOpen ? 0 : -1}
        aria-label="Cakezee Home"
      >
        <img
          src={CakezeeLogo}
          alt="Cakezee — Made for Every Celebration"
          className="h-auto w-[210px] max-w-full object-contain object-left"
          decoding="async"
        />
      </Link>

      <p className="mt-3 text-xs tracking-wide text-[#F4DCE1]/80">
        Custom cakes, made with love.
      </p>
    </div>

    <button
      type="button"
      onClick={() => setMobileMenuOpen(false)}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 text-[#FFF5E9] transition hover:bg-white/10"
      aria-label="Close menu"
    >
      <X size={19} />
    </button>
  </div>

  <div className="mt-5 flex items-center gap-2">
    <span className="h-px w-8 bg-[#E9C99D]" />
    <span className="text-[9px] uppercase tracking-[2px] text-[#E9C99D]">
      Made for your moments
    </span>
  </div>
</div>

          {/* NAVIGATION */}
          <div className="px-4 py-5">
            <p className="mb-3 px-3 text-[9px] font-semibold uppercase tracking-[2.5px] text-[#E9C99D]/80">
              Explore
            </p>

            <nav className="space-y-1.5">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const itemPath = item.to.split("?")[0];
                const itemSearch = item.to.includes("?")
                  ? `?${item.to.split("?")[1]}`
                  : "";
                const isActive =
                  (location.pathname === itemPath &&
                    (!itemSearch || location.search === itemSearch)) ||
                  (item.to !== "/" &&
                    location.pathname.startsWith(itemPath + "/"));

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    tabIndex={mobileMenuOpen ? 0 : -1}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group flex items-center gap-3.5 rounded-xl px-3.5 py-3.5 transition-all duration-200 ${
                      isActive
                        ? "!bg-[#FFF5E9] !text-[#65152D] shadow-md"
                        : "!text-[#FFF5E9] hover:bg-white/10 hover:!text-white"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        isActive
                          ? "bg-[#65152D]/10"
                          : "bg-white/10 text-[#E9C99D]"
                      }`}
                    >
                      <Icon size={18} strokeWidth={1.8} />
                    </span>

                    <span className="flex-1 text-[13px] font-medium">
                      {item.label}
                    </span>

                    <ChevronRight
                      size={16}
                      className={`transition-transform group-hover:translate-x-1 ${
                        isActive
                          ? "text-[#65152D]"
                          : "text-[#E9C99D]/70"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* PROFILE */}
          {/* <div className="mt-auto px-4 pb-5">
            <div className="mb-4 border-t border-white/15" />

            <Link
              to="/profile"
              tabIndex={mobileMenuOpen ? 0 : -1}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/[0.06] p-3.5 transition hover:bg-white/10"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E9C99D] text-[#65152D]">
                <UserRound size={19} />
              </span>

              <span className="flex-1">
                <span className="block text-sm font-medium">
                  My Profile
                </span>
                <span className="mt-1 block text-[10px] text-[#FFF5E9]/60">
                  Your account & details
                </span>
              </span>

              <ChevronRight size={17} className="text-[#E9C99D]" />
            </Link>

            <p className="mt-5 text-center text-[9px] tracking-[1.5px] text-[#FFF5E9]/45">
              BAKED WITH LOVE · CAKEZEE
            </p>
          </div> */}
        </aside>
      </div>
    </>
  );
}

export default Header;
