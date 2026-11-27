'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Bell,
  LogIn,
  Menu,
  Phone,
  ShoppingBag,
  UserCheck,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { BRAND_LOGO_HQ } from '@/lib/assets';
import { BRANCH_INFO } from '@/lib/branchInfo';
import { type ActiveRoute, usePharmacy } from './FirebaseContext';

const NAV_ITEMS: { id: ActiveRoute; label: string }[] = [
  { id: 'storefront', label: 'Medicines' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'blog', label: 'Health Blog' },
  { id: 'bookings', label: 'My Bookings' },
  { id: 'contact', label: 'Contact' },
  { id: 'admin', label: 'Admin Panel' },
];

export default function Header() {
  const {
    user,
    isAdmin,
    activeRoute,
    setActiveRoute,
    cartCount,
    setIsCartOpen,
    unreadNotificationCount,
    setIsNotificationsOpen,
    allOrders,
  } = usePharmacy();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pendingApprovalsCount = isAdmin
    ? allOrders.filter((o) => o.status === 'pending_approval').length
    : 0;

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const handleNav = (route: ActiveRoute) => {
    setActiveRoute(route);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-[#DCE5DF]">
      <div className="max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4 lg:gap-5">
        {/* Zone 1: Brand Wordmark Logo (fluid across 320px mobile to desktop) */}
        <button
          type="button"
          onClick={() => handleNav('storefront')}
          className="flex items-center min-w-0 shrink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F5E3B] rounded-lg cursor-pointer py-1"
          aria-label="Wellness Forever Home"
        >
          <Image
            src={BRAND_LOGO_HQ}
            alt="Wellness Forever Chemists & Lifestyle Store"
            width={220}
            height={70}
            priority
            referrerPolicy="no-referrer"
            className="h-9 min-[375px]:h-10 sm:h-14 lg:h-12 xl:h-16 w-auto max-w-[118px] min-[375px]:max-w-[145px] sm:max-w-[190px] lg:max-w-[165px] xl:max-w-none object-contain"
          />
        </button>

        {/* Zone 2: Single-Line Navigation Links (lg+ screens) */}
        <nav
          aria-label="Primary"
          className="hidden lg:flex items-center gap-3.5 xl:gap-6 text-[13px] xl:text-sm font-medium text-[#3D5245]"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeRoute === item.id;
            const showPending = item.id === 'admin' && pendingApprovalsCount > 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`relative py-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#1F5E3B] font-semibold'
                    : 'text-[#4E6157] hover:text-[#132A1E]'
                }`}
              >
                <span>{item.label}</span>
                {showPending && (
                  <span className="ml-1 font-mono text-xs tabular-nums text-[#B45309] font-semibold">
                    ({pendingApprovalsCount})
                  </span>
                )}
                {isActive && (
                  <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[#1F5E3B]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Real-Time Notifications, Login Page Trigger, Bag & Mobile Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              setIsNotificationsOpen(true);
            }}
            aria-label="Open notifications"
            className="relative inline-flex items-center justify-center h-9 sm:h-10 px-2.5 sm:px-3 rounded-lg border border-[#DCE5DF] bg-white text-[#132A1E] hover:bg-[#F1F5F2] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Bell className="w-4 h-4 text-[#1F5E3B]" />
            {unreadNotificationCount > 0 && (
              <span className="ml-1 font-mono text-xs font-semibold tabular-nums text-[#1F5E3B]">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleNav('login')}
            className={`hidden sm:inline-flex items-center gap-1.5 h-9 sm:h-10 px-3 lg:px-3 xl:px-3.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeRoute === 'login'
                ? 'border-[#1F5E3B] bg-[#EAF3ED] text-[#1F5E3B] font-semibold'
                : 'border-[#DCE5DF] bg-white text-[#132A1E] hover:bg-[#F1F5F2]'
            }`}
          >
            {user ? (
              <>
                <UserCheck className="w-3.5 h-3.5 text-[#1F5E3B]" />
                <span className="max-w-[90px] xl:max-w-[110px] truncate">
                  {user.displayName?.split(' ')[0] || 'Account'}
                </span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 text-[#1F5E3B]" />
                <span>Login</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              setIsCartOpen(true);
            }}
            aria-label={`Open medicine bag with ${cartCount} items`}
            className="inline-flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-2.5 sm:px-4 rounded-lg bg-[#1F5E3B] text-white text-xs sm:text-sm font-medium hover:bg-[#17482D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span className="hidden min-[380px]:inline">Bag</span>
            <span className="font-mono text-[11px] sm:text-xs tabular-nums bg-[#8DC63F] text-[#0E2B1A] font-bold px-1.5 py-0.5 rounded">
              {cartCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-[#DCE5DF] bg-white text-[#132A1E] hover:bg-[#F1F5F2] shrink-0 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Navigation Drawer (< lg screens) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 top-16 sm:top-20 z-30 bg-[#0E2417]/25 backdrop-blur-[1px]"
              aria-hidden="true"
            />
            <motion.nav
              aria-label="Mobile navigation"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden relative z-40 border-t border-[#DCE5DF] bg-white px-4 py-4 space-y-1.5 max-h-[calc(100dvh-4rem)] sm:max-h-[calc(100dvh-5rem)] overflow-y-auto shadow-lg"
            >
              {NAV_ITEMS.map((item) => {
                const isActive = activeRoute === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNav(item.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-[#EAF3ED] text-[#1F5E3B] font-semibold'
                        : 'text-[#3D5245] hover:bg-[#F1F5F2]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.id === 'admin' && pendingApprovalsCount > 0 && (
                      <span className="font-mono text-xs tabular-nums text-[#B45309] font-semibold">
                        {pendingApprovalsCount} pending
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="pt-3 mt-2 border-t border-[#E6EDE8] space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleNav('login')}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium cursor-pointer ${
                    activeRoute === 'login'
                      ? 'border-[#1F5E3B] bg-[#EAF3ED] text-[#1F5E3B]'
                      : 'border-[#1F5E3B] text-[#1F5E3B] hover:bg-[#F4F8F5]'
                  }`}
                >
                  {user ? <UserCheck className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  <span>
                    {user
                      ? `Account (${user.displayName?.split(' ')[0] || 'Signed In'})`
                      : 'Login / Sign In'}
                  </span>
                </button>

                <a
                  href={BRANCH_INFO.phoneHref}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#F8FAF8] border border-[#DCE5DF] text-xs font-mono text-[#1F5E3B]"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Dharwad Desk: {BRANCH_INFO.phoneDisplay}</span>
                </a>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
