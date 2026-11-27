'use client';

import React from 'react';
import Image from 'next/image';
import { Bell, MapPin, MessageCircle, Phone, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { BRAND_LOGO_HQ } from '@/lib/assets';
import { BRANCH_INFO } from '@/lib/branchInfo';
import AdminPanelView from './AdminPanelView';
import BlogView from './BlogView';
import CheckoutDrawer from './CheckoutDrawer';
import ContactView from './ContactView';
import { ErrorBoundary } from './ErrorBoundary';
import { FirebaseProvider, usePharmacy } from './FirebaseContext';
import GalleryView from './GalleryView';
import Header from './Header';
import LoginView from './LoginView';
import MyBookingsView from './MyBookingsView';
import NotificationDrawer from './NotificationDrawer';
import StorefrontView from './StorefrontView';

function PharmacyShell() {
  const {
    activeRoute,
    setActiveRoute,
    toastBanner,
    dismissToast,
    setIsNotificationsOpen,
  } = usePharmacy();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF8] overflow-x-clip">
      <Header />

      <main className="flex-1">
        {activeRoute === 'storefront' && <StorefrontView />}
        {activeRoute === 'gallery' && <GalleryView />}
        {activeRoute === 'blog' && <BlogView />}
        {activeRoute === 'bookings' && <MyBookingsView />}
        {activeRoute === 'contact' && <ContactView />}
        {activeRoute === 'admin' && <AdminPanelView />}
        {activeRoute === 'login' && <LoginView />}
      </main>

      <footer className="border-t border-[#DCE5DF] bg-white mt-16">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex flex-wrap items-center gap-3">
              <Image
                src={BRAND_LOGO_HQ}
                alt="Wellness Forever Chemists & Lifestyle Store"
                width={200}
                height={64}
                referrerPolicy="no-referrer"
                className="h-14 w-auto object-contain"
              />
              <span className="text-xs font-semibold text-[#1F5E3B]">
                {BRANCH_INFO.shortLocation}
              </span>
            </div>
            <p className="text-xs text-[#4E6157] flex items-start gap-1.5 leading-relaxed">
              <MapPin className="w-3.5 h-3.5 text-[#1F5E3B] shrink-0 mt-0.5" />
              <span>{BRANCH_INFO.address}</span>
            </p>
            <p className="text-xs font-mono text-[#1F5E3B] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <a href={BRANCH_INFO.phoneHref} className="hover:underline">
                {BRANCH_INFO.phoneDisplay}
              </a>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs text-[#4E6157]">
            <button
              type="button"
              onClick={() => setActiveRoute('storefront')}
              className="hover:text-[#1F5E3B] cursor-pointer"
            >
              Medicines
            </button>
            <button
              type="button"
              onClick={() => setActiveRoute('gallery')}
              className="hover:text-[#1F5E3B] cursor-pointer"
            >
              Gallery
            </button>
            <button
              type="button"
              onClick={() => setActiveRoute('blog')}
              className="hover:text-[#1F5E3B] cursor-pointer"
            >
              Health Blog
            </button>
            <button
              type="button"
              onClick={() => setActiveRoute('bookings')}
              className="hover:text-[#1F5E3B] cursor-pointer"
            >
              My Bookings
            </button>
            <button
              type="button"
              onClick={() => setActiveRoute('contact')}
              className="hover:text-[#1F5E3B] cursor-pointer"
            >
              Contact
            </button>
            <button
              type="button"
              onClick={() => setActiveRoute('login')}
              className="hover:text-[#1F5E3B] cursor-pointer"
            >
              Login
            </button>
            <span>© {new Date().getFullYear()} Wellness Forever</span>
          </div>
        </div>
      </footer>

      <CheckoutDrawer />
      <NotificationDrawer />

      {/* Real-time Toast Alert when a booking or approval notification arrives */}
      <AnimatePresence>
        {toastBanner && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-20 right-4 sm:bottom-24 sm:right-5 z-50 max-w-sm w-[calc(100%-2rem)] bg-[#132A1E] text-white rounded-xl p-4 shadow-xl border border-[#2C4B39]"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1F5E3B] text-[#D9E021] flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-[#D9E021]">
                  {toastBanner.title}
                </h4>
                <p className="text-xs text-[#DCEBE2] mt-1 leading-relaxed">
                  {toastBanner.message}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    dismissToast();
                    setIsNotificationsOpen(true);
                  }}
                  className="mt-2 text-[11px] font-semibold text-white underline cursor-pointer"
                >
                  Open Notification Center
                </button>
              </div>
              <button
                type="button"
                onClick={dismissToast}
                aria-label="Dismiss notification"
                className="text-[#9CB3A6] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating WhatsApp Quick-Chat Icon */}
      <a
        href={`https://wa.me/917204678008?text=${encodeURIComponent(
          'Hello Wellness Forever Pharmacy (Hosayallapur, Dharwad), I would like assistance with a medicine booking / prescription.'
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp with Wellness Forever Dharwad"
        title="WhatsApp Wellness Forever (+91 72046 78008)"
        className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 group inline-flex items-center justify-center gap-2.5 w-12 h-12 sm:w-auto sm:h-14 sm:px-4 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white shadow-lg border-2 border-white transition-all duration-200 hover:scale-105"
      >
        <MessageCircle className="w-6 h-6 shrink-0" />
        <span className="text-xs font-bold tracking-wide pr-0.5 hidden sm:inline">
          WhatsApp Us
        </span>
      </a>
    </div>
  );
}

export default function PharmacyApp() {
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <PharmacyShell />
      </FirebaseProvider>
    </ErrorBoundary>
  );
}
