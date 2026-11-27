'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  CreditCard,
  FileText,
  LogIn,
  Minus,
  Plus,
  QrCode,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { MEDICINE_IMAGES } from '@/lib/assets';
import {
  processPrescriptionFile,
  type ProcessedPrescription,
} from '@/lib/imageCompression';
import {
  FIELD_LIMITS,
  type PaymentMethod,
  type PaymentStatus,
} from '@/lib/types';
import { usePharmacy } from './FirebaseContext';

const PAYMENT_OPTIONS: {
  id: PaymentMethod;
  title: string;
  subtitle: string;
  Icon: React.ElementType;
}[] = [
  {
    id: 'upi',
    title: 'UPI / QR Instant Pay',
    subtitle: 'Google Pay, PhonePe, Paytm, or BHIM UPI',
    Icon: QrCode,
  },
  {
    id: 'card',
    title: 'Credit / Debit Card',
    subtitle: 'Visa, Mastercard, or RuPay authorization on booking',
    Icon: CreditCard,
  },
  {
    id: 'cod',
    title: 'Cash / UPI on Delivery',
    subtitle: 'Pay at doorstep after pharmacist approval & dispatch',
    Icon: Banknote,
  },
];

export default function CheckoutDrawer() {
  const {
    user,
    cart,
    cartSubtotal,
    isCartOpen,
    setIsCartOpen,
    updateCartQuantity,
    removeFromCart,
    submitMedicineBooking,
    signInWithGoogle,
    setActiveRoute,
  } = usePharmacy();

  const [step, setStep] = useState<'bag' | 'prescription' | 'confirmed'>('bag');
  const [patientName, setPatientName] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Dharwad');
  const [postalCode, setPostalCode] = useState('580001');
  const [doctorName, setDoctorName] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [prescriptionFile, setPrescriptionFile] =
    useState<ProcessedPrescription | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [paymentRef, setPaymentRef] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [confirmedPaymentLabel, setConfirmedPaymentLabel] = useState<string>('');

  const effectivePatientName = patientName ?? user?.displayName ?? '';

  const closeDrawer = () => {
    if (step === 'confirmed') {
      setStep('bag');
      setConfirmedOrderId(null);
    }
    setIsCartOpen(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const processed = await processPrescriptionFile(file);
      setPrescriptionFile(processed);
    } catch (err) {
      setPrescriptionFile(null);
      setUploadError(
        err instanceof Error ? err.message : 'Unable to process prescription file.'
      );
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!user || !user.emailVerified) {
      setSubmitError('Please sign in with Google before completing final checkout.');
      return;
    }

    if (effectivePatientName.trim().length < FIELD_LIMITS.nameMin) {
      setSubmitError('Please enter the patient full name (at least 2 characters).');
      return;
    }
    if (phone.trim().length < FIELD_LIMITS.phoneMin) {
      setSubmitError('Please enter a valid contact phone number.');
      return;
    }
    if (address.trim().length < FIELD_LIMITS.addressMin) {
      setSubmitError('Please enter your complete delivery address.');
      return;
    }
    if (city.trim().length < FIELD_LIMITS.cityMin) {
      setSubmitError('Please enter your city.');
      return;
    }
    if (postalCode.trim().length < FIELD_LIMITS.postalMin) {
      setSubmitError('Please enter a valid postal/PIN code.');
      return;
    }
    if (doctorName.trim().length < FIELD_LIMITS.nameMin) {
      setSubmitError('Please enter the prescribing doctor or clinic name.');
      return;
    }
    if (!prescriptionFile) {
      setSubmitError(
        'Prescription upload is required before final checkout so our pharmacist can verify and approve your medicine booking.'
      );
      return;
    }
    if (paymentMethod === 'upi' && paymentRef.trim().length > 0 && paymentRef.trim().length < 4) {
      setSubmitError('Please enter a valid UPI ID or transaction reference (at least 4 characters).');
      return;
    }

    const paymentStatus: PaymentStatus =
      paymentMethod === 'cod' ? 'pay_on_delivery' : 'paid_on_booking';

    setSubmitting(true);
    try {
      const orderId = await submitMedicineBooking({
        patientName: effectivePatientName,
        phone,
        address,
        city,
        postalCode,
        doctorName,
        prescriptionDate,
        prescriptionFileName: prescriptionFile.fileName,
        prescriptionDataUrl: prescriptionFile.dataUrl,
        paymentMethod,
        paymentStatus,
        paymentRef:
          paymentMethod === 'cod'
            ? 'Pay on Delivery'
            : paymentRef.trim() || `${paymentMethod.toUpperCase()}-VERIFIED`,
      });
      setConfirmedOrderId(orderId);
      setConfirmedPaymentLabel(
        PAYMENT_OPTIONS.find((o) => o.id === paymentMethod)?.title || 'Selected'
      );
      setStep('confirmed');
      setPrescriptionFile(null);
      setPaymentRef('');
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to submit booking.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-[#0E2417]/35 backdrop-blur-[2px]"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-xl bg-white h-full border-l border-[#DCE5DF] flex flex-col shadow-2xl"
          >
            <div className="px-6 py-5 border-b border-[#DCE5DF] flex items-center justify-between gap-4">
              <div>
                <h2
                  className="text-lg font-semibold text-[#132A1E]"
                  style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
                >
                  {step === 'bag' && 'Medicine Booking Bag'}
                  {step === 'prescription' && 'Prescription, Delivery & Payment'}
                  {step === 'confirmed' && 'Booking Queued for Pharmacist Approval'}
                </h2>
                <p className="text-xs text-[#4E6157] mt-0.5">
                  {step === 'bag' &&
                    'Review selected medicines before uploading your prescription'}
                  {step === 'prescription' &&
                    'Required prescription upload and payment method prior to checkout'}
                  {step === 'confirmed' &&
                    'Synced across all your devices via Wellness Forever Cloud'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Close booking bag"
                className="w-9 h-9 rounded-lg border border-[#DCE5DF] flex items-center justify-center text-[#4E6157] hover:bg-[#F1F5F2] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {step === 'confirmed' && confirmedOrderId ? (
                <div className="border border-[#DCE5DF] rounded-2xl p-6 bg-[#F8FAF8] text-center space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-[#EAF3ED] text-[#1F5E3B] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-mono text-[#1F5E3B] font-semibold">
                      Reference: {confirmedOrderId}
                    </p>
                    <h3
                      className="text-xl font-semibold text-[#132A1E] mt-1"
                      style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
                    >
                      Awaiting Pharmacist Approval
                    </h3>
                    <p className="text-xs font-medium text-[#1F5E3B] mt-1">
                      Payment Method: {confirmedPaymentLabel}
                    </p>
                    <p className="text-sm text-[#4E6157] mt-2 leading-relaxed">
                      Our licensed pharmacist at Hosayallapur, Dharwad has received a real-time notification with your uploaded prescription. You will receive an instant alert across all signed-in devices once approved.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        closeDrawer();
                        setActiveRoute('bookings');
                      }}
                      className="px-5 py-2.5 rounded-lg bg-[#1F5E3B] text-white text-sm font-medium hover:bg-[#17482D] cursor-pointer"
                    >
                      Track My Booking
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('bag');
                        setIsCartOpen(false);
                      }}
                      className="px-5 py-2.5 rounded-lg border border-[#DCE5DF] bg-white text-[#132A1E] text-sm font-medium hover:bg-[#F1F5F2] cursor-pointer"
                    >
                      Continue Browsing
                    </button>
                  </div>
                </div>
              ) : cart.length === 0 ? (
                <div className="border border-[#DCE5DF] rounded-2xl p-8 text-center bg-[#F8FAF8]">
                  <p className="text-sm font-semibold text-[#132A1E]">
                    Your medicine bag is empty
                  </p>
                  <p className="text-xs text-[#4E6157] mt-1 mb-4">
                    Add prescription medicines or daily wellness products from the catalog to begin booking.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="px-4 py-2 rounded-lg bg-[#1F5E3B] text-white text-xs font-medium hover:bg-[#17482D] cursor-pointer"
                  >
                    Browse Catalog
                  </button>
                </div>
              ) : step === 'bag' ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.medicineId}
                        className="flex items-center gap-4 p-3.5 rounded-xl border border-[#DCE5DF] bg-white"
                      >
                        <div className="w-16 h-14 rounded-lg overflow-hidden bg-[#F1F5F2] shrink-0">
                          <Image
                            src={MEDICINE_IMAGES[item.imageKey]}
                            alt={item.name}
                            width={96}
                            height={72}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-[#132A1E] truncate">
                            {item.name}
                          </h4>
                          <p className="text-xs text-[#4E6157] truncate">
                            {item.packSize} ·{' '}
                            {item.requiresPrescription
                              ? 'Rx Verification Required'
                              : 'Wellness / OTC'}
                          </p>
                          <p className="text-sm font-mono font-semibold tabular-nums text-[#1F5E3B] mt-1">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(item.medicineId, item.quantity - 1)
                            }
                            aria-label="Decrease quantity"
                            className="w-8 h-8 rounded-lg border border-[#DCE5DF] flex items-center justify-center text-[#132A1E] hover:bg-[#F1F5F2] cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center font-mono text-xs font-semibold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(item.medicineId, item.quantity + 1)
                            }
                            aria-label="Increase quantity"
                            className="w-8 h-8 rounded-lg border border-[#DCE5DF] flex items-center justify-center text-[#132A1E] hover:bg-[#F1F5F2] cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.medicineId)}
                            aria-label="Remove medicine"
                            className="w-8 h-8 rounded-lg text-[#6E8276] hover:text-[#B91C1C] flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl bg-[#F4F8F5] border border-[#DCE5DF] flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-[#1F5E3B] shrink-0 mt-0.5" />
                    <p className="text-xs text-[#3D5245] leading-relaxed">
                      Next step: complete patient verification, upload your prescription, and choose your preferred payment option (UPI, Card, or Cash on Delivery).
                    </p>
                  </div>
                </div>
              ) : (
                <form
                  id="prescription-checkout-form"
                  onSubmit={handleFinalSubmit}
                  className="space-y-5"
                >
                  {!user && (
                    <div className="p-4 rounded-xl border border-[#F59E0B] bg-[#FFFBEB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs text-[#78350F]">
                        <p className="font-semibold">
                          Google Sign-In required for cloud sync
                        </p>
                        <p className="mt-0.5">
                          Sign in so your prescription, payment, and approval status sync across all devices.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={signInWithGoogle}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1F5E3B] text-white text-xs font-medium hover:bg-[#17482D] whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        Sign In
                      </button>
                    </div>
                  )}

                  {submitError && (
                    <div className="p-3.5 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] text-xs text-[#991B1B] flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#132A1E] mb-1.5">
                        Patient Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={FIELD_LIMITS.shortTextMax}
                        value={effectivePatientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="e.g. Aarav Sharma"
                        className="w-full h-10 px-3 rounded-lg border border-[#DCE5DF] text-sm focus:outline-none focus:border-[#1F5E3B]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#132A1E] mb-1.5">
                        Mobile Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={FIELD_LIMITS.phoneMax}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 72046 78008"
                        className="w-full h-10 px-3 rounded-lg border border-[#DCE5DF] text-sm font-mono focus:outline-none focus:border-[#1F5E3B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#132A1E] mb-1.5">
                      Delivery Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={FIELD_LIMITS.addressMax}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Apartment, street name, and landmark"
                      className="w-full h-10 px-3 rounded-lg border border-[#DCE5DF] text-sm focus:outline-none focus:border-[#1F5E3B]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#132A1E] mb-1.5">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={FIELD_LIMITS.cityMax}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Dharwad"
                        className="w-full h-10 px-3 rounded-lg border border-[#DCE5DF] text-sm focus:outline-none focus:border-[#1F5E3B]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#132A1E] mb-1.5">
                        Postal / PIN Code *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={FIELD_LIMITS.postalMax}
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="580001"
                        className="w-full h-10 px-3 rounded-lg border border-[#DCE5DF] text-sm font-mono focus:outline-none focus:border-[#1F5E3B]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E6EDE8]">
                    <div>
                      <label className="block text-xs font-medium text-[#132A1E] mb-1.5">
                        Prescribing Doctor / Clinic *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={FIELD_LIMITS.shortTextMax}
                        value={doctorName}
                        onChange={(e) => setDoctorName(e.target.value)}
                        placeholder="Dr. Kavita Rao, Dharwad Clinic"
                        className="w-full h-10 px-3 rounded-lg border border-[#DCE5DF] text-sm focus:outline-none focus:border-[#1F5E3B]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#132A1E] mb-1.5">
                        Prescription Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={prescriptionDate}
                        onChange={(e) => setPrescriptionDate(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-[#DCE5DF] text-sm font-mono focus:outline-none focus:border-[#1F5E3B]"
                      />
                    </div>
                  </div>

                  {/* Required Prescription File Upload */}
                  <div>
                    <label className="block text-xs font-medium text-[#132A1E] mb-1.5">
                      Upload Prescription Document (Required) *
                    </label>
                    <label className="flex flex-col items-center justify-center border border-dashed border-[#8CA396] rounded-xl p-5 bg-[#F8FAF8] hover:bg-[#F1F6F3] transition-colors cursor-pointer text-center">
                      <Upload className="w-6 h-6 text-[#1F5E3B] mb-2" />
                      <span className="text-sm font-medium text-[#132A1E]">
                        {prescriptionFile
                          ? 'Replace prescription file'
                          : 'Click to upload prescription scan or photo'}
                      </span>
                      <span className="text-xs text-[#4E6157] mt-1">
                        Accepts JPG, PNG, WebP (auto-optimized) or PDF up to 380 KB
                      </span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>

                    {uploadError && (
                      <p className="text-xs text-[#B91C1C] mt-2">{uploadError}</p>
                    )}

                    {prescriptionFile && (
                      <div className="mt-3 p-3 rounded-xl border border-[#8DC63F] bg-[#F4F9F4] flex items-center gap-3">
                        {prescriptionFile.dataUrl.startsWith('data:image/') ? (
                          <img
                            src={prescriptionFile.dataUrl}
                            alt="Uploaded prescription preview"
                            className="w-12 h-12 rounded-lg object-cover border border-[#DCE5DF]"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-white border border-[#DCE5DF] flex items-center justify-center text-[#1F5E3B]">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#132A1E] truncate">
                            {prescriptionFile.fileName}
                          </p>
                          <p className="text-[11px] font-mono text-[#1F5E3B]">
                            Verified ready · {prescriptionFile.sizeLabel}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPrescriptionFile(null)}
                          className="text-xs text-[#4E6157] hover:text-[#B91C1C] cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Payment Option Selector */}
                  <div className="pt-3 border-t border-[#E6EDE8] space-y-3">
                    <label className="block text-xs font-medium text-[#132A1E]">
                      Select Payment Option *
                    </label>
                    <div className="space-y-2">
                      {PAYMENT_OPTIONS.map((opt) => {
                        const Icon = opt.Icon;
                        const selected = paymentMethod === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setPaymentMethod(opt.id)}
                            className={`w-full text-left p-3.5 rounded-xl border flex items-center gap-3 transition-colors cursor-pointer ${
                              selected
                                ? 'border-[#1F5E3B] bg-[#F3F9F5]'
                                : 'border-[#DCE5DF] bg-white hover:bg-[#F8FAF8]'
                            }`}
                          >
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                selected
                                  ? 'bg-[#1F5E3B] text-white'
                                  : 'bg-[#F1F5F2] text-[#4E6157]'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[#132A1E]">
                                {opt.title}
                              </p>
                              <p className="text-[11px] text-[#4E6157]">
                                {opt.subtitle}
                              </p>
                            </div>
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                selected
                                  ? 'border-[#1F5E3B] bg-[#1F5E3B]'
                                  : 'border-[#9CB3A6]'
                              }`}
                            >
                              {selected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {paymentMethod !== 'cod' && (
                      <div className="p-3.5 rounded-xl bg-[#F8FAF8] border border-[#DCE5DF] space-y-2">
                        <label className="block text-xs font-medium text-[#132A1E]">
                          {paymentMethod === 'upi'
                            ? 'UPI ID or Transaction Reference (Optional)'
                            : 'Cardholder Name / Authorization Note (Optional)'}
                        </label>
                        <input
                          type="text"
                          maxLength={FIELD_LIMITS.paymentRefMax}
                          value={paymentRef}
                          onChange={(e) => setPaymentRef(e.target.value)}
                          placeholder={
                            paymentMethod === 'upi'
                              ? 'e.g. name@okicici or UPI Ref #1234'
                              : 'e.g. Aarav Sharma · Visa ending 4242'
                          }
                          className="w-full h-9 px-3 rounded-lg border border-[#DCE5DF] bg-white text-xs font-mono focus:outline-none focus:border-[#1F5E3B]"
                        />
                        <p className="text-[11px] text-[#4E6157]">
                          {paymentMethod === 'upi'
                            ? 'Merchant UPI: wellnessforever.dharwad@upi · Payment settles upon pharmacist approval.'
                            : 'Card charge is authorized only after our pharmacist approves your uploaded prescription.'}
                        </p>
                      </div>
                    )}
                  </div>
                </form>
              )}
            </div>

            {cart.length > 0 && step !== 'confirmed' && (
              <div className="px-6 py-4 border-t border-[#DCE5DF] bg-[#F8FAF8] space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#4E6157]">Booking Subtotal</span>
                  <span className="font-mono text-base font-bold tabular-nums text-[#132A1E]">
                    ₹{cartSubtotal.toFixed(2)}
                  </span>
                </div>

                {step === 'bag' ? (
                  <button
                    type="button"
                    onClick={() => setStep('prescription')}
                    className="w-full py-3 rounded-lg bg-[#1F5E3B] text-white text-sm font-semibold hover:bg-[#17482D] transition-colors cursor-pointer"
                  >
                    Proceed to Prescription &amp; Payment
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStep('bag')}
                      className="px-4 py-3 rounded-lg border border-[#DCE5DF] bg-white text-sm font-medium text-[#132A1E] hover:bg-[#F1F5F2] cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      form="prescription-checkout-form"
                      disabled={submitting}
                      className="flex-1 py-3 rounded-lg bg-[#1F5E3B] text-white text-sm font-semibold hover:bg-[#17482D] disabled:opacity-60 transition-colors cursor-pointer"
                    >
                      {submitting
                        ? 'Submitting to Pharmacist...'
                        : 'Confirm Payment & Submit Booking'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
