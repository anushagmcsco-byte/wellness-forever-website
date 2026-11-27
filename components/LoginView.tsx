'use client';

import React from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Cloud,
  LogIn,
  LogOut,
  MapPin,
  PackageCheck,
  Phone,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { BRAND_LOGO_HQ, STOREFRONT_DHARWAD_BG } from '@/lib/assets';
import { BRANCH_INFO } from '@/lib/branchInfo';
import { ADMIN_EMAIL } from '@/lib/firebase';
import { usePharmacy } from './FirebaseContext';

export default function LoginView() {
  const {
    user,
    isAdmin,
    authError,
    signInWithGoogle,
    signOutUser,
    setActiveRoute,
    myOrders,
    myEnquiries,
  } = usePharmacy();

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left: Brand & Store Visual */}
        <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-[#DCE5DF] min-h-[360px] flex flex-col justify-end p-8 sm:p-10 text-white">
          <Image
            src={STOREFRONT_DHARWAD_BG}
            alt={BRANCH_INFO.branchName}
            fill
            priority
            referrerPolicy="no-referrer"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E2417]/95 via-[#0E2417]/65 to-[#0E2417]/30" />

          <div className="relative z-10 space-y-4">
            <div className="inline-block bg-white rounded-xl p-3 shadow-md">
              <Image
                src={BRAND_LOGO_HQ}
                alt="Wellness Forever Chemists & Lifestyle Store"
                width={252}
                height={80}
                referrerPolicy="no-referrer"
                className="h-16 sm:h-20 w-auto object-contain"
              />
            </div>

            <h1
              className="text-2xl sm:text-3xl font-semibold leading-snug"
              style={{
                fontFamily: 'var(--font-display), Georgia, serif',
                textWrap: 'balance',
              }}
            >
              One Cloud Account Across Mobile, Tablet &amp; Desktop
            </h1>

            <p className="text-sm text-[#DCEBE2] leading-relaxed max-w-lg">
              Sign in to synchronize your uploaded prescriptions, online medicine bookings, payment choices, and pharmacist approval notifications across every device.
            </p>

            <div className="pt-3 border-t border-white/20 space-y-1.5 text-xs text-[#E5EFE9]">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#D9E021] shrink-0 mt-0.5" />
                <span>{BRANCH_INFO.address}</span>
              </p>
              <p className="flex items-center gap-2 font-mono">
                <Phone className="w-4 h-4 text-[#D9E021] shrink-0" />
                <a href={BRANCH_INFO.phoneHref} className="hover:underline">
                  {BRANCH_INFO.phoneDisplay}
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Right: Sign In / Account Card */}
        <div className="lg:col-span-6 bg-white border border-[#DCE5DF] rounded-2xl p-8 sm:p-10 flex flex-col justify-between">
          {!user ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-medium text-[#1F5E3B] mb-1.5">
                  Customer &amp; Pharmacist Portal
                </p>
                <h2
                  className="text-2xl sm:text-3xl font-semibold text-[#132A1E]"
                  style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
                >
                  Sign In to Wellness Forever
                </h2>
                <p className="text-sm text-[#4E6157] mt-2 leading-relaxed">
                  Use your verified Google account for instant, passwordless access to prescription uploads, checkout payments, and order tracking.
                </p>
              </div>

              {authError && (
                <div className="p-3.5 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] text-xs text-[#991B1B]">
                  {authError}
                </div>
              )}

              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-[#DCE5DF] bg-[#F8FAF8] flex items-start gap-3">
                  <Cloud className="w-5 h-5 text-[#1F5E3B] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[#132A1E]">
                      Cross-Device Cloud Synchronization
                    </p>
                    <p className="text-xs text-[#4E6157] mt-0.5">
                      Start a booking on desktop, upload a prescription from your phone, and receive instant pharmacist approval alerts anywhere.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[#DCE5DF] bg-[#F8FAF8] flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#1F5E3B] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[#132A1E]">
                      Pharmacist Admin Access
                    </p>
                    <p className="text-xs text-[#4E6157] mt-0.5">
                      Signing in with <span className="font-mono font-medium text-[#132A1E]">{ADMIN_EMAIL}</span> automatically unlocks the Admin Approval, Catalog, Blog CMS, and Enquiries console.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={signInWithGoogle}
                className="w-full py-3.5 px-6 rounded-lg bg-[#1F5E3B] text-white text-sm font-semibold hover:bg-[#17482D] transition-colors inline-flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Continue with Google</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#EDF2EE]">
                <div>
                  <p className="text-xs font-medium text-[#1F5E3B] inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Signed In &amp; Synced
                  </p>
                  <h2
                    className="text-2xl font-semibold text-[#132A1E] mt-1"
                    style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
                  >
                    {user.displayName || 'Wellness Forever Member'}
                  </h2>
                  <p className="text-xs font-mono text-[#4E6157] mt-0.5">
                    {user.email}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#EAF3ED] text-[#1F5E3B]">
                  {isAdmin ? 'Pharmacist Admin' : 'Verified Patient'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-[#DCE5DF] bg-[#F8FAF8]">
                  <p className="text-xs text-[#4E6157]">Medicine Bookings</p>
                  <p className="font-mono text-2xl font-bold tabular-nums text-[#132A1E] mt-1">
                    {myOrders.length}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-[#DCE5DF] bg-[#F8FAF8]">
                  <p className="text-xs text-[#4E6157]">Enquiries Sent</p>
                  <p className="font-mono text-2xl font-bold tabular-nums text-[#132A1E] mt-1">
                    {myEnquiries.length}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setActiveRoute('storefront')}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-[#1F5E3B] text-white text-sm font-semibold hover:bg-[#17482D] cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    Browse Medicines &amp; Book Online
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveRoute('bookings')}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-[#DCE5DF] bg-white text-[#132A1E] text-sm font-medium hover:bg-[#F1F5F2] cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2">
                    <PackageCheck className="w-4 h-4 text-[#1F5E3B]" />
                    View My Bookings &amp; Prescriptions
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#4E6157]" />
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setActiveRoute('admin')}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-[#8DC63F] bg-[#F3F9F5] text-[#132A1E] text-sm font-semibold hover:bg-[#EAF3ED] cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-[#1F5E3B]" />
                      Open Pharmacist Admin Console
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#1F5E3B]" />
                  </button>
                )}
              </div>

              <div className="pt-4 border-t border-[#EDF2EE] flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#6E8276] truncate max-w-[200px]">
                  UID: {user.uid}
                </span>
                <button
                  type="button"
                  onClick={signOutUser}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B91C1C] hover:underline cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}

          <p className="text-[11px] text-[#6E8276] mt-6 pt-4 border-t border-[#EDF2EE]">
            Protected by Google Sign-In &amp; Cloud Firestore Security Rules.
          </p>
        </div>
      </div>
    </div>
  );
}
