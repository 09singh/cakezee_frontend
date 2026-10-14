import { useEffect, useState } from "react";
import {
  Boxes,
  ChefHat,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Menu,
  Package,
  Tag,
  Truck,
  Users,
  Wallet,
  Zap,
  X,
} from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import { getStaffOrders } from "../../api/orders.api";

const adminItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/admin" },
  { label: "Orders", icon: ClipboardList, to: "/admin/orders" },
  { label: "Finance", icon: Wallet, to: "/admin/finance" },
  { label: "Kitchen", icon: ChefHat, to: "/admin/kitchen" },
  { label: "Delivery", icon: Truck, to: "/admin/delivery" },
  { label: "Products", icon: Package, to: "/admin/products" },
  { label: "Ready Now", icon: Zap, to: "/admin/ready-now" },
  { label: "Inventory", icon: Boxes, to: "/admin/inventory" },
  { label: "Customers", icon: Users, to: "/admin/customers" },
  { label: "Offers & Coupons", icon: Tag, to: "/admin/coupons" },
  { label: "WhatsApp", icon: MessageCircle, href: "https://web.whatsapp.com/", green: true },
  // { label: "Marketing (Ads)", icon: Megaphone, badge: "8" },
  // { label: "WhatsApp Inbox", icon: MessageCircle, green: true },
  // { label: "Zomato / Swiggy", icon: UtensilsCrossed },
  // { label: "Reports & Analytics", icon: BarChart3 },
];

const SEEN_ORDERS_KEY = "cakezee_admin_seen_new_orders";

function StaffLayout() {
  const { user, logoutUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeAdminLabel, setActiveAdminLabel] = useState("Dashboard");
  const [newOrderCount, setNewOrderCount] = useState(0);
  const isAdmin = user?.role === "admin";
  const isKitchen = user?.role === "kitchen";
  const title = isAdmin ? "Admin" : isKitchen ? "Kitchen" : "Delivery";
  const items = isAdmin
    ? adminItems
    : isKitchen
      ? [{ label: "Kitchen Orders", icon: ChefHat, to: "/kitchen" }]
      : [{ label: "Delivery Orders", icon: Truck, to: "/delivery" }];

  useEffect(() => {
    if (!isAdmin) return undefined;

    let active = true;
    const refreshNewOrders = async () => {
      try {
        const result = await getStaffOrders({ limit: 100 });
        if (!active) return;
        const pendingIds = (result?.items || [])
          .filter((order) => ["confirmed", "pending", "new"].includes(String(order.status || "").toLowerCase()))
          .map((order) => String(order.orderId || order._id || ""))
          .filter(Boolean);
        let seenIds;
        try {
          const stored = localStorage.getItem(SEEN_ORDERS_KEY);
          seenIds = stored ? JSON.parse(stored) : pendingIds;
        } catch {
          seenIds = [];
        }
        if (!Array.isArray(seenIds)) seenIds = [];

        if (!localStorage.getItem(SEEN_ORDERS_KEY)) {
          localStorage.setItem(SEEN_ORDERS_KEY, JSON.stringify(pendingIds));
        }
        if (location.pathname.startsWith("/admin/orders")) {
          localStorage.setItem(SEEN_ORDERS_KEY, JSON.stringify([...new Set([...seenIds, ...pendingIds])]));
          setNewOrderCount(0);
          return;
        }
        setNewOrderCount(pendingIds.filter((id) => !seenIds.includes(id)).length);
      } catch {
        // Keep the sidebar quiet if the order check is temporarily unavailable.
      }
    };

    refreshNewOrders();
    const interval = window.setInterval(refreshNewOrders, 30000);
    window.addEventListener("focus", refreshNewOrders);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshNewOrders);
    };
  }, [isAdmin, location.pathname]);

  const handleNavigation = (item) => {
    setMobileSidebarOpen(false);
    if (isAdmin && item.to) setActiveAdminLabel(item.label);
    if (item.to) navigate(item.to);
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate("/staff/login", { replace: true });
  };

  const isActive = (item) => {
    if (!item.to) return false;
    if (isAdmin && item.to === "/admin") {
      return location.pathname === "/admin" && activeAdminLabel === item.label;
    }
    if (isAdmin && item.to === "/admin/products") {
      return location.pathname.startsWith("/admin/products") && item.label === "Products";
    }
    if (isAdmin && item.to === "/admin/ready-now") {
      return location.pathname.startsWith("/admin/ready-now");
    }
    if (isAdmin && item.to === "/admin/finance") {
      return location.pathname.startsWith("/admin/finance");
    }    if (isAdmin && item.to === "/admin/orders") {
      return location.pathname.startsWith("/admin/orders");
    }
    if (isAdmin && item.to === "/admin/inventory") {
      return location.pathname.startsWith("/admin/inventory");
    }
    if (isAdmin && item.to === "/admin/coupons") {
      return location.pathname.startsWith("/admin/coupons");
    }
    if (isAdmin && item.to === "/admin/customers") {
      return location.pathname.startsWith("/admin/customers");
    }
    return location.pathname === item.to;
  };

  return (
    <div className={`min-h-screen ${isAdmin ? "bg-[#f8f8f6] text-[#1f1f1f]" : "bg-[#f7f7f5] text-[#202020]"}`}>
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[245px] flex-col bg-[#07131c] text-white transition-transform duration-300 lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[72px] shrink-0 items-center justify-between px-6">
          <div>
            <p className="font-serif text-[25px] font-bold tracking-tight">Cakezee</p>
            {!isAdmin && (
              <p className="mt-0.5 text-[11px] text-gray-400">
                {isKitchen ? "Kitchen Management" : "Delivery Management"}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close menu"
            className="rounded-lg p-2 text-gray-400 hover:bg-white/10 lg:hidden"
          >
            <X size={20} />
          </button>
          {isAdmin && <div className="hidden lg:block"><Menu size={18} className="text-gray-400" /></div>}
        </div>

        <nav aria-label="Staff navigation" className="flex-1 overflow-y-auto px-3 pb-6">
          <div className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              const NavigationItem = item.href ? "a" : "button";
              return (
                <NavigationItem
                  type={item.href ? undefined : "button"}
                  key={item.label}
                  href={item.href}
                  target={item.href ? "_blank" : undefined}
                  rel={item.href ? "noopener noreferrer" : undefined}
                  onClick={() => handleNavigation(item)}
                  aria-current={active ? "page" : undefined}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition-all duration-150 ${
                    active
                      ? "bg-white text-[#8f1638] shadow-sm"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon
                    size={17}
                    strokeWidth={active ? 2.3 : 1.8}
                    className={item.green ? "text-emerald-400" : active ? "text-[#8f1638]" : ""}
                  />
                  <span className="flex-1 whitespace-nowrap">{item.label}</span>
                  {isAdmin && item.label === "Orders" && newOrderCount > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white" aria-label={`${newOrderCount} new orders`}>
                      {newOrderCount}
                    </span>
                  )}
                  {item.badge && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c91445] px-1.5 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </NavigationItem>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-[245px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open menu"
              className="rounded-lg border border-gray-200 p-2"
            >
              <Menu size={20} />
            </button>
            <span className="font-serif text-xl font-bold">Cakezee</span>
            {!isAdmin && <span className="text-[10px] text-gray-500">{title}</span>}
          </div>
          {isAdmin && (
            <button
              type="button"
              aria-label="Notifications"
              className="rounded-full bg-[#fff3f5] p-2 text-[#9c173d]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
          )}
        </header>
        <Outlet />
      </main>
    </div>
  );
}

export default StaffLayout;



