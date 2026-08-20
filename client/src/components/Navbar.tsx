import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, ShoppingBag, UserRound, LogOut, LogIn, UserPlus, UtensilsCrossed, ClipboardList, Truck, BarChart3, CreditCard } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { NotificationBell } from "./notifications/NotificationBell";

const baseNavigation = [
  { name: "Menu", path: "/menu" },
  { name: "Meal Builder", path: "/meal-builder" },
  { name: "My Nutrition", path: "/profile" },
];

const KITCHEN_STAFF_ROLES = ['admin', 'manager', 'kitchen_staff'];
const ADMIN_ROLES = ['admin', 'manager'];
const RIDER_ROLES = ['delivery_rider'];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const isKitchenStaff = user && KITCHEN_STAFF_ROLES.includes(user.role);
  const isAdminManager = user && ADMIN_ROLES.includes(user.role);
  const isDeliveryRider = user && RIDER_ROLES.includes(user.role);

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--gd-border)] bg-[rgba(248,247,243,0.88)] backdrop-blur-xl">
      <nav className="gd-container flex h-20 items-center justify-between">

        {/* Logo */}
        <Link
          to="/"
          className="group flex items-center gap-3"
          onClick={() => setMobileOpen(false)}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--gd-charcoal)] text-white transition-transform duration-300 group-hover:rotate-[-6deg]">
            <span className="font-display text-lg">G</span>
          </div>

          <div className="leading-none">
            <p className="font-display text-xl font-semibold tracking-tight">
              Gaya Darbar
            </p>
            <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.25em] text-[var(--gd-forest)]">
              Iron & Fuel House
            </p>
          </div>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-6 md:flex">
          {baseNavigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative py-2 text-sm font-medium transition-colors duration-300 ${
                  isActive
                    ? "text-[var(--gd-forest)]"
                    : "text-[var(--gd-muted)] hover:text-[var(--gd-charcoal)]"
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}

          {isAdminManager && (
            <>
              <NavLink
                to="/admin/orders"
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-zinc-900 text-white shadow-sm"
                      : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
                  }`
                }
              >
                <ClipboardList size={14} />
                <span>Order Management</span>
              </NavLink>
              <NavLink
                to="/admin/deliveries"
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-indigo-900 text-white shadow-sm"
                      : "bg-indigo-50 text-indigo-900 hover:bg-indigo-100"
                  }`
                }
              >
                <Truck size={14} />
                <span>Delivery Operations</span>
              </NavLink>
              <NavLink
                to="/admin/analytics"
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-[var(--gd-forest)] text-white shadow-sm"
                      : "bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                  }`
                }
              >
                <BarChart3 size={14} />
                <span>Analytics</span>
              </NavLink>
              <NavLink
                to="/admin/payments"
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-purple-900 text-white shadow-sm"
                      : "bg-purple-50 text-purple-900 hover:bg-purple-100"
                  }`
                }
              >
                <CreditCard size={14} />
                <span>Payments</span>
              </NavLink>
            </>
          )}

          {isDeliveryRider && (
            <NavLink
              to="/delivery"
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-indigo-100 text-indigo-900 hover:bg-indigo-200"
                }`
              }
            >
              <Truck size={14} />
              <span>Delivery Dashboard</span>
            </NavLink>
          )}

          {isKitchenStaff && (
            <NavLink
              to="/kitchen"
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[var(--gd-forest)] text-white shadow-sm"
                    : "bg-amber-100/80 text-amber-900 hover:bg-amber-200"
                }`
              }
            >
              <UtensilsCrossed size={14} />
              <span>Kitchen KDS</span>
            </NavLink>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-full border border-[var(--gd-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--gd-charcoal)] transition-all duration-300 hover:shadow-sm"
                aria-label="Profile"
              >
                <UserRound size={16} className="text-[var(--gd-forest)]" />
                <span className="max-w-[100px] truncate">{user?.name || 'Profile'}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-800"
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                to="/login"
                className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-[var(--gd-charcoal)] transition-colors hover:bg-white"
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1.5 rounded-full bg-[var(--gd-forest)] px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[var(--gd-charcoal)]"
              >
                <UserPlus size={15} />
                <span>Register</span>
              </Link>
            </div>
          )}

          <NotificationBell />

          <Link
            to="/cart"
            className="relative flex items-center justify-center rounded-full bg-[var(--gd-charcoal)] p-3 text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--gd-forest)]"
            aria-label={`Shopping cart with ${itemCount} items`}
          >
            <ShoppingBag size={18} strokeWidth={1.8} />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--gd-forest)] text-[10px] font-bold text-white shadow-sm ring-2 ring-[var(--gd-ivory)]">
                {itemCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="rounded-full p-3 text-[var(--gd-charcoal)] transition-colors hover:bg-white md:hidden"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`overflow-hidden border-t border-[var(--gd-border)] bg-[var(--gd-ivory)] transition-all duration-300 md:hidden ${
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="gd-container flex flex-col py-5">
          {baseNavigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className="border-b border-[var(--gd-border)] py-4 text-sm font-medium text-[var(--gd-charcoal)] last:border-0"
            >
              {item.name}
            </NavLink>
          ))}

          {isAdminManager && (
            <>
              <NavLink
                to="/admin/orders"
                onClick={() => setMobileOpen(false)}
                className="border-b border-[var(--gd-border)] py-4 text-sm font-bold text-zinc-900 flex items-center gap-2"
              >
                <ClipboardList size={16} />
                <span>Order Management</span>
              </NavLink>
              <NavLink
                to="/admin/deliveries"
                onClick={() => setMobileOpen(false)}
                className="border-b border-[var(--gd-border)] py-4 text-sm font-bold text-indigo-900 flex items-center gap-2"
              >
                <Truck size={16} />
                <span>Delivery Operations</span>
              </NavLink>
              <NavLink
                to="/admin/analytics"
                onClick={() => setMobileOpen(false)}
                className="border-b border-[var(--gd-border)] py-4 text-sm font-bold text-emerald-900 flex items-center gap-2"
              >
                <BarChart3 size={16} />
                <span>Analytics</span>
              </NavLink>
            </>
          )}

          {isDeliveryRider && (
            <NavLink
              to="/delivery"
              onClick={() => setMobileOpen(false)}
              className="border-b border-[var(--gd-border)] py-4 text-sm font-bold text-indigo-700 flex items-center gap-2"
            >
              <Truck size={16} />
              <span>Delivery Dashboard</span>
            </NavLink>
          )}

          {isKitchenStaff && (
            <NavLink
              to="/kitchen"
              onClick={() => setMobileOpen(false)}
              className="border-b border-[var(--gd-border)] py-4 text-sm font-bold text-amber-900 flex items-center gap-2"
            >
              <UtensilsCrossed size={16} />
              <span>Kitchen KDS</span>
            </NavLink>
          )}

          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="flex items-center justify-between py-4 text-sm font-medium text-red-600 border-b border-[var(--gd-border)]"
            >
              <span>Log Out ({user?.name})</span>
              <LogOut size={16} />
            </button>
          ) : (
            <div className="flex items-center gap-4 py-4 border-b border-[var(--gd-border)]">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-[var(--gd-charcoal)] hover:text-[var(--gd-forest)]"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="text-sm font-bold text-[var(--gd-forest)]"
              >
                Create Account
              </Link>
            </div>
          )}
          <NavLink
            to="/cart"
            onClick={() => setMobileOpen(false)}
            className="py-4 text-sm font-medium text-[var(--gd-forest)] flex items-center justify-between"
          >
            <span>My Fuel Bag</span>
            {itemCount > 0 && (
              <span className="rounded-full bg-[var(--gd-forest)] px-2.5 py-0.5 text-[10px] font-bold text-white">
                {itemCount} items
              </span>
            )}
          </NavLink>
        </div>
      </div>
    </header>
  );
}