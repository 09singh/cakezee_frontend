
import {
  Home,
  ShoppingBag,
  UserRound,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const navigation = [
  {
    label: "Home",
    path: "/",
    icon: Home,
  },
  {
    label: "Categories",
    path: "/categories",
    icon: ShoppingBag,
  },
  {
    label: "Orders",
    path: "/orders",
    icon: ShoppingBag,
  },
  {
    label: "Account",
    path: "/account",
    icon: UserRound,
  },
];

function BottomNavigation() {
  return (
    <nav
      className="
        fixed
        bottom-0
        left-0
        right-0
        z-50
        border-t
        border-[var(--border)]
        bg-[var(--cream)]/95
        backdrop-blur
        md:hidden
      "
    >
      <div
        className="
          mx-auto
          grid
          h-[72px]
          max-w-md
          grid-cols-4
          items-center
        "
      >
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `
                flex
                h-full
                flex-col
                items-center
                justify-center
                gap-1
                text-[10px]
                transition-colors
                ${
                  isActive
                    ? "text-[var(--brand)]"
                    : "text-[var(--text-muted)]"
                }
                `
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-full
                      transition-all
                      duration-200
                      ${
                        isActive
                          ? "bg-[var(--brand)]/40"
                          : "bg-transparent"
                      }
                    `}
                  >
                    <Icon
                      size={19}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                  </div>

                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNavigation;
