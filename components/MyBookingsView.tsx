'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  FileText,
  LogIn,
  PackageCheck,
  Pencil,
  ShoppingBag,
  Trash2,
  Truck,
  UploadCloud,
  X,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { processPrescriptionFile } from '@/lib/imageCompression';
import {
  FIELD_LIMITS,
  type MedicineOrder,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from '@/lib/types';
import { usePharmacy } from './FirebaseContext';

const STATUS_META: Record<
  OrderStatus,
  { label: string; colorClass: string; Icon: React.ElementType }
> = {
  pending_approval: {
    label: 'Pending Pharmacist Approval',
    colorClass: 'text-[#B45309] bg-[#FEF3C7] border-[#FDE68A]',
    Icon: Clock,
  },
  approved: {
    label: 'Approved by Pharmacist',
    colorClass: 'text-[#1F5E3B] bg-[#EAF3ED] border-[#BBD8C5]',
    Icon: CheckCircle2,
  },
  dispatched: {
    label: 'Dispatched for Delivery',
    colorClass: 'text-[#0369A1] bg-[#E0F2FE] border-[#BAE6FD]',
    Icon: Truck,
  },
  rejected: {
    label: 'Prescription Revision Needed',
    colorClass: 'text-[#B91C1C] bg-[#FEE2E2] border-[#FECACA]',
    Icon: XCircle,
  },
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  upi: 'UPI / QR Instant Pay',
  card: 'Credit / Debit Card',
  cod: 'Cash / UPI on Delivery',
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid_on_booking: 'Paid on Booking',
  pay_on_delivery: 'Pay on Delivery',
  pending_verification: 'Pending Verification',
};

export default function MyBookingsView() {
  const {
    user,
    myOrders,
    signInWithGoogle,
    setActiveRoute,
    updateMyBooking,
    deleteBooking,
  } = usePharmacy();

  const [previewOrder, setPreviewOrder] = useState<MedicineOrder | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Edit Booking Modal state
  const [editingOrder, setEditingOrder] = useState<MedicineOrder | null>(null);
  const [editPatientName, setEditPatientName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editPostalCode, setEditPostalCode] = useState('');
  const [editDoctorName, setEditDoctorName] = useState('');
  const [editRxDate, setEditRxDate] = useState('');
  const [editRxFileName, setEditRxFileName] = useState('');
  const [editRxDataUrl, setEditRxDataUrl] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('upi');
  const [editPaymentRef, setEditPaymentRef] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const openEditModal = (order: MedicineOrder) => {
    setEditingOrder(order);
    setEditPatientName(order.patientName);
    setEditPhone(order.phone);
    setEditAddress(order.address);
    setEditCity(order.city);
    setEditPostalCode(order.postalCode);
    setEditDoctorName(order.doctorName);
    setEditRxDate(order.prescriptionDate);
    setEditRxFileName(order.prescriptionFileName);
    setEditRxDataUrl(order.prescriptionDataUrl);
    setEditPaymentMethod(order.paymentMethod || 'cod');
    setEditPaymentRef(order.paymentRef || '');
    setEditError(null);
  };

  const handleEditRxFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditError(null);
    try {
      const processed = await processPrescriptionFile(file);
      setEditRxFileName(processed.fileName);
      setEditRxDataUrl(processed.dataUrl);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : 'Unable to process selected prescription.'
      );
    }
  };

  const handleSaveBookingEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    setEditError(null);

    const paymentStatus: PaymentStatus =
      editPaymentMethod === 'cod'
        ? 'pay_on_delivery'
        : editPaymentRef.trim()
        ? 'paid_on_booking'
        : 'pending_verification';

    setSavingEdit(true);
    try {
      await updateMyBooking(editingOrder, {
        patientName: editPatientName,
        phone: editPhone,
        address: editAddress,
        city: editCity,
        postalCode: editPostalCode,
        doctorName: editDoctorName,
        prescriptionDate: editRxDate,
        prescriptionFileName: editRxFileName,
        prescriptionDataUrl: editRxDataUrl,
        paymentMethod: editPaymentMethod,
        paymentStatus,
        paymentRef: editPaymentRef,
      });
      setEditingOrder(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Unable to update booking.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteBooking = async (orderId: string) => {
    await deleteBooking(orderId);
    setConfirmDeleteId(null);
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-[#DCE5DF] rounded-2xl p-8">
          <PackageCheck className="w-10 h-10 text-[#1F5E3B] mx-auto mb-3" />
          <h1
            className="text-2xl font-semibold text-[#132A1E]"
            style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
          >
            Sign in to view your Medicine Bookings
          </h1>
          <p className="text-sm text-[#4E6157] mt-2 mb-6 leading-relaxed">
            Your uploaded prescriptions, pharmacist approval status, and order history synchronize automatically across every device when signed in.
          </p>
          <button
            type="button"
            onClick={signInWithGoogle}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#1F5E3B] text-white text-sm font-semibold hover:bg-[#17482D] cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#DCE5DF]">
        <div>
          <p className="text-xs font-medium text-[#1F5E3B] mb-1.5">
            Cloud-Synchronized Patient Portal
          </p>
          <h1
            className="text-3xl font-semibold text-[#132A1E]"
            style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
          >
            My Medicine Bookings
          </h1>
          <p className="text-sm text-[#4E6157] mt-1">
            Create, review, update pending prescriptions, or cancel bookings for {user.email}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveRoute('storefront')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1F5E3B] text-white text-xs font-semibold hover:bg-[#17482D] whitespace-nowrap self-start sm:self-auto cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          Book More Medicines
        </button>
      </div>

      {myOrders.length === 0 ? (
        <div className="mt-8 bg-white border border-[#DCE5DF] rounded-2xl p-12 text-center">
          <PackageCheck className="w-8 h-8 text-[#6E8276] mx-auto mb-3" />
          <h2 className="text-base font-semibold text-[#132A1E]">
            No medicine bookings yet
          </h2>
          <p className="text-sm text-[#4E6157] mt-1 mb-5">
            Select medicines from the catalog and upload your prescription to place your first booking.
          </p>
          <button
            type="button"
            onClick={() => setActiveRoute('storefront')}
            className="px-5 py-2.5 rounded-lg bg-[#1F5E3B] text-white text-xs font-semibold hover:bg-[#17482D] cursor-pointer"
          >
            Browse Pharmacy Catalog
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {myOrders.map((order) => {
            const meta = STATUS_META[order.status];
            const StatusIcon = meta.Icon;
            const createdStr = order.createdAt?.toDate?.().toLocaleString() || 'Just now';
            const canModify =
              order.status === 'pending_approval' || order.status === 'rejected';

            return (
              <div
                key={order.id}
                className="bg-white border border-[#DCE5DF] rounded-2xl p-4 sm:p-6 space-y-4 min-w-0"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#EDF2EE]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#4E6157]">
                      <span className="font-mono font-semibold text-[#132A1E] break-all">
                        {order.id}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{createdStr}</span>
                      <span aria-hidden="true">·</span>
                      <span>Dr. {order.doctorName}</span>
                    </div>
                    <h2 className="text-base font-semibold text-[#132A1E] mt-1 break-words">
                      Patient: {order.patientName} ({order.city} {order.postalCode})
                    </h2>
                  </div>

                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold self-start md:self-auto shrink-0 ${meta.colorClass}`}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span>{meta.label}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-7 min-w-0 space-y-2">
                    <p className="text-xs font-semibold text-[#4E6157]">
                      Booked Medicines ({order.itemCount} items)
                    </p>
                    <div className="divide-y divide-[#EDF2EE] border border-[#EDF2EE] rounded-xl">
                      {order.items.map((item, idx) => (
                        <div
                          key={`${item.medicineId}-${idx}`}
                          className="px-4 py-2.5 flex items-center justify-between gap-4 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-[#132A1E] truncate">
                              {item.name}
                            </p>
                            <p className="text-[#4E6157]">
                              {item.packSize} × {item.quantity}
                            </p>
                          </div>
                          <span className="font-mono font-semibold tabular-nums text-[#132A1E] shrink-0">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-5 space-y-3 bg-[#F8FAF8] border border-[#E6EDE8] rounded-xl p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#4E6157]">Total Amount</span>
                      <span className="font-mono font-bold tabular-nums text-[#132A1E]">
                        ₹{order.totalAmount.toFixed(2)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#E6EDE8] space-y-1 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[#4E6157]">
                          <CreditCard className="w-3.5 h-3.5 text-[#1F5E3B]" />
                          Payment
                        </span>
                        <span className="font-medium text-[#132A1E]">
                          {order.paymentMethod
                            ? PAYMENT_METHOD_LABELS[order.paymentMethod]
                            : 'Pay at Branch / Standard'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[#4E6157]">Status</span>
                        <span
                          className={`font-medium ${
                            order.paymentStatus === 'paid_on_booking'
                              ? 'text-[#1F5E3B]'
                              : 'text-[#4E6157]'
                          }`}
                        >
                          {order.paymentStatus
                            ? PAYMENT_STATUS_LABELS[order.paymentStatus]
                            : 'Recorded'}
                        </span>
                      </div>
                      {order.paymentRef && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[#4E6157]">Reference</span>
                          <span className="font-mono text-[#132A1E] truncate max-w-[180px]">
                            {order.paymentRef}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#E6EDE8] flex items-center justify-between gap-3">
                      <div className="min-w-0 flex items-center gap-2 text-xs text-[#4E6157]">
                        <FileText className="w-4 h-4 text-[#1F5E3B] shrink-0" />
                        <span className="truncate">{order.prescriptionFileName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewOrder(order)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F5E3B] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Rx
                      </button>
                    </div>

                    {order.adminNotes && (
                      <div className="pt-2 border-t border-[#E6EDE8] text-xs">
                        <p className="font-semibold text-[#132A1E]">
                          Pharmacist Review Notes
                        </p>
                        <p className="text-[#3D5245] mt-1 leading-relaxed">
                          {order.adminNotes}
                        </p>
                      </div>
                    )}

                    {canModify && (
                      <div className="pt-3 border-t border-[#E6EDE8] flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DCE5DF] bg-white text-xs font-semibold text-[#1F5E3B] hover:bg-[#EAF3ED] cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit / Update Rx
                        </button>
                        {confirmDeleteId === order.id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDeleteBooking(order.id)}
                              className="px-3 py-1.5 rounded-lg bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer"
                            >
                              Confirm Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2.5 py-1.5 rounded-lg border border-[#DCE5DF] bg-white text-xs text-[#4E6157] cursor-pointer"
                            >
                              Keep
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(order.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#FECACA] bg-white text-xs font-semibold text-[#B91C1C] hover:bg-[#FEF2F2] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Cancel Booking
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Prescription Viewer Modal */}
      <AnimatePresence>
        {previewOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewOrder(null)}
              className="fixed inset-0 bg-[#0E2417]/45 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="relative z-10 max-w-2xl w-full max-h-[90vh] bg-white border border-[#DCE5DF] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-[#DCE5DF] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#132A1E]">
                    Uploaded Prescription · {previewOrder.prescriptionFileName}
                  </h3>
                  <p className="text-xs text-[#4E6157]">
                    Dr. {previewOrder.doctorName} · {previewOrder.prescriptionDate}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewOrder(null)}
                  className="w-8 h-8 rounded-lg border border-[#DCE5DF] flex items-center justify-center text-[#4E6157] hover:bg-[#F1F5F2] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto bg-[#F8FAF8] flex items-center justify-center">
                {previewOrder.prescriptionDataUrl.startsWith('data:application/pdf') ? (
                  <iframe
                    src={previewOrder.prescriptionDataUrl}
                    title="Uploaded PDF Prescription"
                    className="w-full h-[65vh] rounded-lg border border-[#DCE5DF] bg-white"
                  />
                ) : (
                  <img
                    src={previewOrder.prescriptionDataUrl}
                    alt={previewOrder.prescriptionFileName}
                    className="max-h-[65vh] w-auto rounded-lg border border-[#DCE5DF] object-contain"
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Booking / Update Prescription Modal */}
      <AnimatePresence>
        {editingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingOrder(null)}
              className="fixed inset-0 bg-[#0E2417]/45 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="relative z-10 max-w-2xl w-full max-h-[90vh] bg-white border border-[#DCE5DF] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-[#DCE5DF] flex items-center justify-between">
                <div>
                  <h3
                    className="text-lg font-semibold text-[#132A1E]"
                    style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
                  >
                    Update Medicine Booking
                  </h3>
                  <p className="text-xs font-mono text-[#4E6157]">
                    {editingOrder.id} · Re-submits for pharmacist verification
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="w-8 h-8 rounded-lg border border-[#DCE5DF] flex items-center justify-center text-[#4E6157] hover:bg-[#F1F5F2] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={handleSaveBookingEdit}
                className="p-6 overflow-y-auto space-y-4"
              >
                {editError && (
                  <div className="p-3 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] text-xs text-[#991B1B]">
                    {editError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#132A1E] mb-1">
                      Patient Name *
                    </label>
                    <input
                      type="text"
                      required
                      minLength={FIELD_LIMITS.nameMin}
                      maxLength={FIELD_LIMITS.shortTextMax}
                      value={editPatientName}
                      onChange={(e) => setEditPatientName(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#DCE5DF] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#132A1E] mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      minLength={FIELD_LIMITS.phoneMin}
                      maxLength={FIELD_LIMITS.phoneMax}
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#DCE5DF] text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#132A1E] mb-1">
                    Delivery Address *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={FIELD_LIMITS.addressMin}
                    maxLength={FIELD_LIMITS.addressMax}
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#DCE5DF] text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#132A1E] mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      minLength={FIELD_LIMITS.cityMin}
                      maxLength={FIELD_LIMITS.cityMax}
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#DCE5DF] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#132A1E] mb-1">
                      PIN / Postal Code *
                    </label>
                    <input
                      type="text"
                      required
                      minLength={FIELD_LIMITS.postalMin}
                      maxLength={FIELD_LIMITS.postalMax}
                      value={editPostalCode}
                      onChange={(e) => setEditPostalCode(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#DCE5DF] text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#132A1E] mb-1">
                      Prescribing Doctor *
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={FIELD_LIMITS.shortTextMax}
                      value={editDoctorName}
                      onChange={(e) => setEditDoctorName(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#DCE5DF] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#132A1E] mb-1">
                      Prescription Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={editRxDate}
                      onChange={(e) => setEditRxDate(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#DCE5DF] text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#132A1E] mb-1">
                      Payment Method
                    </label>
                    <select
                      value={editPaymentMethod}
                      onChange={(e) =>
                        setEditPaymentMethod(e.target.value as PaymentMethod)
                      }
                      className="w-full h-10 px-3 rounded-lg border border-[#DCE5DF] text-sm bg-white"
                    >
                      <option value="upi">UPI / QR Instant Pay</option>
                      <option value="card">Credit / Debit Card</option>
                      <option value="cod">Cash / UPI on Delivery</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#132A1E] mb-1">
                      Payment Ref / UPI ID (optional)
                    </label>
                    <input
                      type="text"
                      maxLength={FIELD_LIMITS.paymentRefMax}
                      value={editPaymentRef}
                      onChange={(e) => setEditPaymentRef(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#DCE5DF] text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-dashed border-[#9DB8A7] bg-[#F8FAF8] space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-[#132A1E]">
                      Current Prescription: {editRxFileName}
                    </span>
                    <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F5E3B] hover:underline cursor-pointer">
                      <UploadCloud className="w-3.5 h-3.5" />
                      Replace File
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleEditRxFile}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-5 py-2.5 rounded-lg bg-[#1F5E3B] text-white text-xs font-semibold hover:bg-[#17482D] disabled:opacity-60 cursor-pointer"
                  >
                    {savingEdit ? 'Saving Updates...' : 'Save & Re-submit for Approval'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    className="px-4 py-2.5 rounded-lg border border-[#DCE5DF] text-xs font-medium text-[#4E6157] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
