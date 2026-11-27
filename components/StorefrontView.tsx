'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  Check,
  FileCheck2,
  Images,
  MapPin,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { BRAND_LOGO_HQ, MEDICINE_IMAGES, STOREFRONT_DHARWAD_BG } from '@/lib/assets';
import { BRANCH_INFO } from '@/lib/branchInfo';
import {
  MEDICINE_CATEGORIES,
  type Medicine,
  type MedicineCategory,
} from '@/lib/types';
import { usePharmacy } from './FirebaseContext';

export default function StorefrontView() {
  const {
    medicines,
    addToCart,
    cart,
    setIsCartOpen,
    setActiveRoute,
  } = usePharmacy();

  const [selectedCategory, setSelectedCategory] = useState<'All' | MedicineCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailMedicine, setDetailMedicine] = useState<Medicine | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const filteredMedicines = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return medicines.filter((m) => {
      const catMatch =
        selectedCategory === 'All' || m.category === selectedCategory;
      const textMatch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q);
      return catMatch && textMatch;
    });
  }, [medicines, selectedCategory, searchQuery]);

  const handleBookMedicine = (med: Medicine) => {
    addToCart(med, 1);
    setJustAddedId(med.id);
    window.setTimeout(() => {
      setJustAddedId((curr) => (curr === med.id ? null : curr));
    }, 1200);
  };

  return (
    <div className="pb-16">
      {/* Storefront Hero with Dharwad Store Background Image & Contrast Scrim */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8">
        <div className="relative rounded-2xl overflow-hidden border border-[#DCE5DF] min-h-[420px] lg:min-h-[460px] flex items-center">
          <Image
            src={STOREFRONT_DHARWAD_BG}
            alt={BRANCH_INFO.branchName}
            fill
            priority
            referrerPolicy="no-referrer"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0C2115]/95 via-[#0C2115]/82 to-[#0C2115]/35" />

          <div className="relative z-10 w-full p-5 sm:p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-end">
            <div className="lg:col-span-8 min-w-0 text-white">
              <p className="text-xs font-medium text-[#D9E021] tracking-wide mb-2 sm:mb-3">
                {BRANCH_INFO.branchName} · 24/7 Cloud Sync
              </p>
              <h1
                className="text-[26px] sm:text-4xl lg:text-[46px] font-semibold leading-[1.14] tracking-tight"
                style={{
                  fontFamily: 'var(--font-display), Georgia, serif',
                  textWrap: 'balance',
                }}
              >
                Verified Medicines &amp; Everyday Clinical Care
              </h1>
              <p className="mt-4 text-[15px] sm:text-base text-[#E3EFE8] leading-relaxed max-w-xl">
                Book prescription medications, preventive supplements, and dermatologist-tested skincare online. Upload your prescription and choose UPI, Card, or Cash on Delivery before checkout.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href="#medicine-catalog"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#D9E021] text-[#132A1E] text-sm font-bold hover:bg-[#cbd21d] transition-colors whitespace-nowrap"
                >
                  <span>Browse Medicines</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white/12 backdrop-blur-sm border border-white/25 text-white text-sm font-medium hover:bg-white/20 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4 text-[#D9E021]" />
                  <span>Upload Rx &amp; Checkout</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRoute('gallery')}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-white hover:text-[#D9E021] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Images className="w-4 h-4" />
                  <span>Store Gallery</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white/95 backdrop-blur-sm text-[#132A1E] rounded-xl p-5 border border-white/40 space-y-2.5">
              <Image
                src={BRAND_LOGO_HQ}
                alt="Wellness Forever Chemists & Lifestyle Store"
                width={190}
                height={60}
                referrerPolicy="no-referrer"
                className="h-12 w-auto object-contain mb-1"
              />
              <p className="text-xs font-semibold text-[#1F5E3B]">
                Hosayallapur, Dharwad Branch
              </p>
              <p className="text-xs text-[#3D5245] flex items-start gap-2 leading-relaxed">
                <MapPin className="w-4 h-4 text-[#1F5E3B] shrink-0 mt-0.5" />
                <span>{BRANCH_INFO.address}</span>
              </p>
              <div className="pt-2 border-t border-[#E6EDE8] flex items-center justify-between gap-2">
                <a
                  href={BRANCH_INFO.phoneHref}
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#1F5E3B] hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{BRANCH_INFO.phoneDisplay}</span>
                </a>
                <button
                  type="button"
                  onClick={() => setActiveRoute('contact')}
                  className="text-xs font-semibold text-[#132A1E] hover:text-[#1F5E3B] cursor-pointer"
                >
                  Contact Desk →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Booking Workflow Strip */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              step: '01. Select Medicines',
              desc: 'Choose Rx treatments, pain care, vitamins, or clinical skincare.',
            },
            {
              step: '02. Upload Rx & Pay',
              desc: 'Attach your prescription and select UPI, Card, or Cash on Delivery.',
            },
            {
              step: '03. Pharmacist Approval',
              desc: 'Real-time alert notifies our Dharwad pharmacy desk for instant review.',
            },
            {
              step: '04. Cross-Device Sync',
              desc: 'Approval status, enquiries, and order updates appear on all devices.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-white border border-[#DCE5DF] rounded-xl p-5"
            >
              <h2 className="text-sm font-semibold text-[#1F5E3B]">
                {item.step}
              </h2>
              <p className="text-xs text-[#4E6157] mt-1.5 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Medicine Catalog Grid */}
      <section
        id="medicine-catalog"
        className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-12"
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-[#DCE5DF]">
          <div>
            <h2
              className="text-2xl sm:text-3xl font-semibold text-[#132A1E]"
              style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
            >
              Pharmacy &amp; Lifestyle Catalog
            </h2>
            <p className="text-sm text-[#4E6157] mt-1">
              Live cloud inventory · Select items to book with prescription verification
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 min-w-0 w-full lg:w-auto">
            <div className="relative shrink-0">
              <Search className="w-4 h-4 text-[#6E8276] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search medicine or composition..."
                className="w-full sm:w-60 md:w-64 h-10 pl-9 pr-3 rounded-lg border border-[#DCE5DF] bg-white text-sm text-[#132A1E] placeholder:text-[#7B8F83] focus:outline-none focus:border-[#1F5E3B]"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#EDF2EE] rounded-lg overflow-x-auto max-w-full min-w-0">
              {(['All', ...MEDICINE_CATEGORIES] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-white text-[#1F5E3B] shadow-sm font-semibold'
                      : 'text-[#4E6157] hover:text-[#132A1E]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredMedicines.length === 0 ? (
          <div className="mt-8 border border-[#DCE5DF] rounded-2xl bg-white p-12 text-center">
            <p className="text-base font-semibold text-[#132A1E]">
              No matching medicines found
            </p>
            <p className="text-sm text-[#4E6157] mt-1">
              Try clearing your search filter or selecting another category.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMedicines.map((med) => {
              const inBagQty =
                cart.find((c) => c.medicineId === med.id)?.quantity ?? 0;
              const isJustAdded = justAddedId === med.id;

              return (
                <article
                  key={med.id}
                  className="bg-white border border-[#DCE5DF] rounded-2xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => setDetailMedicine(med)}
                    className="relative aspect-[4/3] w-full bg-[#F1F5F2] overflow-hidden text-left cursor-pointer"
                  >
                    <Image
                      src={MEDICINE_IMAGES[med.imageKey]}
                      alt={med.name}
                      fill
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                  </button>

                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[#4E6157]">
                        <span>{med.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {med.requiresPrescription ? 'Rx Required' : 'OTC Available'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDetailMedicine(med)}
                        className="mt-1.5 text-left block w-full cursor-pointer"
                      >
                        <h3 className="text-base font-semibold text-[#132A1E] hover:text-[#1F5E3B] transition-colors">
                          {med.name}
                        </h3>
                      </button>
                      <p className="text-xs text-[#4E6157] mt-1 truncate">
                        {med.genericName}
                      </p>
                      <p className="text-xs text-[#6E8276] mt-2 line-clamp-2 leading-relaxed">
                        {med.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#EDF2EE] flex items-center justify-between gap-3">
                      <div>
                        <p className="font-mono text-base font-bold tabular-nums text-[#132A1E]">
                          ₹{med.price.toFixed(2)}
                        </p>
                        <p className="text-[11px] text-[#4E6157]">
                          {med.packSize} · {med.stock} in stock
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={med.stock <= 0}
                        onClick={() => handleBookMedicine(med)}
                        className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isJustAdded
                            ? 'bg-[#8DC63F] text-[#0E2B1A]'
                            : 'bg-[#1F5E3B] text-white hover:bg-[#17482D]'
                        } disabled:opacity-50`}
                      >
                        {isJustAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>
                              {inBagQty > 0 ? `Book (${inBagQty})` : 'Book Medicine'}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Clinical Trust Callout Section */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="bg-[#1F5E3B] text-white rounded-2xl p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-2 text-xs font-medium text-[#D9E021] mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Wellness Forever Hosayallapur, Dharwad Quality Standard</span>
            </div>
            <h2
              className="text-2xl sm:text-3xl font-semibold leading-snug"
              style={{
                fontFamily: 'var(--font-display), Georgia, serif',
                textWrap: 'balance',
              }}
            >
              Every prescription booking is reviewed by a registered pharmacist before dispatch
            </h2>
            <p className="text-sm text-[#DCEBE2] mt-2 max-w-2xl leading-relaxed">
              Explore our Dharwad branch photos and store walkthrough videos in the Gallery, or place an online medicine booking with flexible payment options.
            </p>
          </div>
          <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-3">
            <button
              type="button"
              onClick={() => setActiveRoute('gallery')}
              className="px-5 py-3 rounded-lg border border-white/25 text-white text-sm font-semibold hover:bg-white/10 transition-colors whitespace-nowrap cursor-pointer"
            >
              Explore Gallery
            </button>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="px-6 py-3 rounded-lg bg-[#D9E021] text-[#132A1E] text-sm font-bold hover:bg-[#c8cf1d] transition-colors whitespace-nowrap cursor-pointer"
            >
              Open Booking Bag
            </button>
          </div>
        </div>
      </section>

      {/* Medicine Detail Modal */}
      <AnimatePresence>
        {detailMedicine && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailMedicine(null)}
              className="fixed inset-0 bg-[#0E2417]/40 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.16 }}
              className="relative z-10 max-w-2xl w-full bg-white border border-[#DCE5DF] rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2">
                <div className="relative aspect-[4/3] sm:aspect-auto bg-[#F1F5F2] min-h-[220px]">
                  <Image
                    src={MEDICINE_IMAGES[detailMedicine.imageKey]}
                    alt={detailMedicine.name}
                    fill
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs text-[#4E6157]">
                        {detailMedicine.category} ·{' '}
                        {detailMedicine.requiresPrescription
                          ? 'Rx Required'
                          : 'OTC / Lifestyle'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDetailMedicine(null)}
                        aria-label="Close product details"
                        className="text-[#4E6157] hover:text-[#132A1E] cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <h3
                      className="text-xl font-semibold text-[#132A1E] mt-2"
                      style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
                    >
                      {detailMedicine.name}
                    </h3>
                    <p className="text-xs text-[#1F5E3B] font-medium mt-1">
                      {detailMedicine.genericName}
                    </p>
                    <p className="text-sm text-[#4E6157] mt-3 leading-relaxed">
                      {detailMedicine.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#E6EDE8] space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-xl font-bold tabular-nums text-[#132A1E]">
                        ₹{detailMedicine.price.toFixed(2)}
                      </span>
                      <span className="text-xs text-[#4E6157]">
                        {detailMedicine.packSize} · {detailMedicine.stock} units
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleBookMedicine(detailMedicine);
                        setDetailMedicine(null);
                        setIsCartOpen(true);
                      }}
                      className="w-full py-2.5 rounded-lg bg-[#1F5E3B] text-white text-sm font-semibold hover:bg-[#17482D] transition-colors cursor-pointer"
                    >
                      Add to Booking Bag
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
