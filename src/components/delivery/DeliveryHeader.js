'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  Truck,
  User,
  IndianRupee,
  BarChart3,
  Clock,
  Headphones,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Power,
  Home,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function DeliveryHeader({ isOnDuty, onToggleDuty }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setDrawerOpen(false);
    router.push('/login');
  };

  const navLinks = [
    { href: '/delivery', label: 'Dashboard', icon: Home, exact: true },
    { href: '/delivery/profile', label: 'My Profile', icon: User },
    { href: '/delivery/earnings', label: 'Earnings & Payouts', icon: IndianRupee },
    { href: '/delivery/performance', label: 'Performance', icon: BarChart3 },
    { href: '/delivery/history', label: 'Order History', icon: Clock },
    { href: '/delivery/support', label: 'Help & Support', icon: Headphones },
  ];

  const isActive = (link) => {
    if (link.exact) return pathname === link.href;
    return pathname.startsWith(link.href);
  };

  return (
    <>
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 text-white px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {/* Left: Hamburger + Branding */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-1.5 -ml-1.5 rounded-xl hover:bg-white/15 transition cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-purple-200" />
                <h1 className="text-sm font-black leading-tight tracking-tight">
                  Jyothi Mart Delivery
                </h1>
              </div>
              <p className="text-[10px] text-purple-200 font-medium">
                Partner Portal • {user?.name || user?.phone || 'Driver'}
              </p>
            </div>
          </div>

          {/* Right: Duty Badge */}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                href="/admin"
                className="text-[10px] font-extrabold bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded-full transition border border-white/20"
              >
                Admin →
              </Link>
            )}
            {typeof onToggleDuty === 'function' ? (
              <button
                onClick={onToggleDuty}
                className={`flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full transition cursor-pointer active:scale-95 ${
                  isOnDuty
                    ? 'bg-emerald-400 text-emerald-950 shadow-sm'
                    : 'bg-white/20 text-white border border-white/30'
                }`}
              >
                <Power className="w-3 h-3" />
                {isOnDuty ? 'ONLINE' : 'OFFLINE'}
              </button>
            ) : (
              <span
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                  isOnDuty
                    ? 'bg-emerald-400 text-emerald-950'
                    : 'bg-white/20 text-white border border-white/30'
                }`}
              >
                {isOnDuty ? '● ONLINE' : '○ OFFLINE'}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-black tracking-tight flex items-center gap-2">
                  <Truck className="w-5 h-5 text-purple-200" />
                  Delivery Portal
                </span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded-full hover:bg-white/20 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Driver Info Card */}
              <div className="bg-white/15 backdrop-blur-sm p-3 rounded-xl border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-black">
                    {user?.name?.charAt(0)?.toUpperCase() || '🚴'}
                  </div>
                  <div>
                    <p className="text-xs font-bold">{user?.name || 'Delivery Partner'}</p>
                    <p className="text-[10px] text-purple-200">
                      +91 {user?.phone || '—'} • {isAdmin ? 'Admin' : 'Driver'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {navLinks.map((link) => {
                const active = isActive(link);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                      active
                        ? 'bg-purple-50 text-purple-700 font-bold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <link.icon className={`w-4 h-4 ${active ? 'text-purple-600' : 'text-gray-500'}`} />
                    <span>{link.label}</span>
                    {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-purple-400" />}
                  </Link>
                );
              })}

              <div className="border-t border-gray-100 my-3" />

              {/* Back to Store */}
              <Link
                href="/"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                <span>Back to Customer Store</span>
              </Link>
            </div>

            {/* Drawer Footer: Logout */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
