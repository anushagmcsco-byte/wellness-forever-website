'use client';

import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Database,
  Eye,
  FileText,
  Lock,
  LogIn,
  MessageSquare,
  Pencil,
  Pill,
  Plus,
  Trash2,
  Truck,
  XCircle,
} from 'lucide-react';
import { ADMIN_EMAIL } from '@/lib/firebase';
import {
  BLOG_CATEGORIES,
  FIELD_LIMITS,
  MEDICINE_CATEGORIES,
  type BlogCategory,
  type BlogImageKey,
  type BlogPost,
  type ContactEnquiry,
  type EnquiryStatus,
  type Medicine,
  type MedicineCategory,
  type MedicineImageKey,
  type MedicineOrder,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from '@/lib/types';
import { usePharmacy } from './FirebaseContext';

type AdminTab = 'approvals' | 'inventory' | 'blogs' | 'enquiries';

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

export default function AdminPanelView() {
  const {
    user,
    isAdmin,
    signInWithGoogle,
    allOrders,
    allMedicinesAdmin,
    allBlogsAdmin,
    allEnquiries,
    selectedAdminOrderId,
    setSelectedAdminOrderId,
    updateOrderStatus,
    updateBookingAdmin,
    deleteBooking,
    saveMedicine,
    deleteMedicine,
    saveBlogPost,
    deleteBlogPost,
    submitEnquiry,
    updateEnquiry,
    deleteEnquiry,
    seedStarterCatalog,
    setActiveRoute,
  } = usePharmacy();

  const [tab, setTab] = useState<AdminTab>('approvals');
  const [orderFilter, setOrderFilter] = useState<'all' | OrderStatus>('all');
  const [manualActiveOrder, setManualActiveOrder] = useState<MedicineOrder | null>(null);
  const [manualOrderNotes, setManualOrderNotes] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState(false);
  const [syncingSeed, setSyncingSeed] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Admin booking details/payment edit & delete state
  const [editOrderOpen, setEditOrderOpen] = useState(false);
  const [editOrdName, setEditOrdName] = useState('');
  const [editOrdPhone, setEditOrdPhone] = useState('');
  const [editOrdAddress, setEditOrdAddress] = useState('');
  const [editOrdCity, setEditOrdCity] = useState('');
  const [editOrdPostal, setEditOrdPostal] = useState('');
  const [editOrdPayStatus, setEditOrdPayStatus] =
    useState<PaymentStatus>('pending_verification');
  const [editOrdPayRef, setEditOrdPayRef] = useState('');
  const [confirmDeleteOrderId, setConfirmDeleteOrderId] = useState<string | null>(null);

  // Medicine editor state
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);
  const [medFormOpen, setMedFormOpen] = useState(false);
  const [medName, setMedName] = useState('');
  const [medGeneric, setMedGeneric] = useState('');
  const [medCat, setMedCat] = useState<MedicineCategory>('Prescription Rx');
  const [medPrice, setMedPrice] = useState('150');
  const [medPack, setMedPack] = useState('10 Tablets Strip');
  const [medStock, setMedStock] = useState('40');
  const [medRx, setMedRx] = useState(true);
  const [medImage, setMedImage] = useState<MedicineImageKey>('prescription');
  const [medDesc, setMedDesc] = useState('');
  const [medActive, setMedActive] = useState(true);

  // Blog editor state
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [blogFormOpen, setBlogFormOpen] = useState(false);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogCat, setBlogCat] = useState<BlogCategory>('Medication Safety');
  const [blogAuthor, setBlogAuthor] = useState('Dr. Meera Kulkarni, Chief Pharmacist');
  const [blogReadTime, setBlogReadTime] = useState('4 min read');
  const [blogImg, setBlogImg] = useState<BlogImageKey>('pharmacist');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogPublished, setBlogPublished] = useState(true);

  // Enquiry create / edit / delete state
  const [activeEnquiry, setActiveEnquiry] = useState<ContactEnquiry | null>(null);
  const [enqStatus, setEnqStatus] = useState<EnquiryStatus>('resolved');
  const [enqSubject, setEnqSubject] = useState('');
  const [enqMessage, setEnqMessage] = useState('');
  const [enqReply, setEnqReply] = useState('');
  const [newEnqOpen, setNewEnqOpen] = useState(false);
  const [newEnqName, setNewEnqName] = useState('');
  const [newEnqEmail, setNewEnqEmail] = useState('');
  const [newEnqPhone, setNewEnqPhone] = useState('');
  const [newEnqSubject, setNewEnqSubject] = useState('');
  const [newEnqMessage, setNewEnqMessage] = useState('');
  const [confirmDeleteEnqId, setConfirmDeleteEnqId] = useState<string | null>(null);

  const activeOrder = useMemo(() => {
    if (manualActiveOrder) return manualActiveOrder;
    if (selectedAdminOrderId) {
      return allOrders.find((o) => o.id === selectedAdminOrderId) ?? null;
    }
    return null;
  }, [manualActiveOrder, selectedAdminOrderId, allOrders]);

  const orderNotes = manualOrderNotes ?? activeOrder?.adminNotes ?? '';
  const effectiveTab: AdminTab =
    selectedAdminOrderId && !manualActiveOrder ? 'approvals' : tab;

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') return allOrders;
    return allOrders.filter((o) => o.status === orderFilter);
  }, [allOrders, orderFilter]);

  const pendingCount = allOrders.filter((o) => o.status === 'pending_approval').length;
  const openEnquiryCount = allEnquiries.filter((e) => e.status !== 'resolved').length;

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-[#DCE5DF] rounded-2xl p-8">
          <Lock className="w-10 h-10 text-[#1F5E3B] mx-auto mb-3" />
          <h1
            className="text-2xl font-semibold text-[#132A1E]"
            style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
          >
            Pharmacist Admin Console
          </h1>
          <p className="text-sm text-[#4E6157] mt-2 mb-6 leading-relaxed">
            Sign in with your verified administrator Google account ({ADMIN_EMAIL}) to approve prescription bookings, manage medicines, publish blog articles, and reply to enquiries.
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

  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-[#DCE5DF] rounded-2xl p-8">
          <Lock className="w-10 h-10 text-[#B45309] mx-auto mb-3" />
          <h1
            className="text-2xl font-semibold text-[#132A1E]"
            style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
          >
            Admin Authorization Required
          </h1>
          <p className="text-sm text-[#4E6157] mt-2 leading-relaxed">
            Signed in as <span className="font-mono">{user.email}</span>. Pharmacist Admin access is restricted to <span className="font-mono font-semibold text-[#132A1E]">{ADMIN_EMAIL}</span>.
          </p>
          <button
            type="button"
            onClick={signInWithGoogle}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1F5E3B] text-white text-xs font-semibold hover:bg-[#17482D] cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            Switch to Admin Google Account
          </button>
        </div>
      </div>
    );
  }

  const handleOrderDecision = async (status: OrderStatus) => {
    if (!activeOrder) return;
    setUpdatingOrder(true);
    try {
      await updateOrderStatus(activeOrder, status, orderNotes);
      setManualActiveOrder({ ...activeOrder, status, adminNotes: orderNotes });
      setManualOrderNotes(orderNotes);
    } finally {
      setUpdatingOrder(false);
    }
  };

  const openOrderEditor = (order: MedicineOrder) => {
    setEditOrdName(order.patientName);
    setEditOrdPhone(order.phone);
    setEditOrdAddress(order.address);
    setEditOrdCity(order.city);
    setEditOrdPostal(order.postalCode);
    setEditOrdPayStatus(order.paymentStatus || 'pending_verification');
    setEditOrdPayRef(order.paymentRef || '');
    setEditOrderOpen(true);
  };

  const handleSaveOrderDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    setUpdatingOrder(true);
    try {
      await updateBookingAdmin(activeOrder, {
        patientName: editOrdName,
        phone: editOrdPhone,
        address: editOrdAddress,
        city: editOrdCity,
        postalCode: editOrdPostal,
        paymentStatus: editOrdPayStatus,
        paymentRef: editOrdPayRef,
      });
      setManualActiveOrder({
        ...activeOrder,
        patientName: editOrdName,
        phone: editOrdPhone,
        address: editOrdAddress,
        city: editOrdCity,
        postalCode: editOrdPostal,
        paymentStatus: editOrdPayStatus,
        paymentRef: editOrdPayRef,
      });
      setEditOrderOpen(false);
    } finally {
      setUpdatingOrder(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    await deleteBooking(orderId);
    setConfirmDeleteOrderId(null);
    if (manualActiveOrder?.id === orderId) setManualActiveOrder(null);
    if (selectedAdminOrderId === orderId) setSelectedAdminOrderId(null);
  };

  const openNewMedicine = () => {
    setEditingMed(null);
    setMedName('');
    setMedGeneric('');
    setMedCat('Prescription Rx');
    setMedPrice('150');
    setMedPack('10 Tablets Strip');
    setMedStock('40');
    setMedRx(true);
    setMedImage('prescription');
    setMedDesc('');
    setMedActive(true);
    setMedFormOpen(true);
  };

  const openEditMedicine = (med: Medicine) => {
    setEditingMed(med);
    setMedName(med.name);
    setMedGeneric(med.genericName);
    setMedCat(med.category);
    setMedPrice(String(med.price));
    setMedPack(med.packSize);
    setMedStock(String(med.stock));
    setMedRx(med.requiresPrescription);
    setMedImage(med.imageKey);
    setMedDesc(med.description);
    setMedActive(med.active);
    setMedFormOpen(true);
  };

  const handleSaveMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    try {
      await saveMedicine(
        {
          name: medName,
          genericName: medGeneric,
          category: medCat,
          price: Number(medPrice) || 1,
          packSize: medPack,
          stock: Number(medStock) || 0,
          requiresPrescription: medRx,
          imageKey: medImage,
          description: medDesc,
          active: medActive,
        },
        editingMed?.id
      );
      setMedFormOpen(false);
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'Unable to save medicine.');
    }
  };

  const openNewBlog = () => {
    setAdminError(null);
    setEditingBlog(null);
    setBlogTitle('');
    setBlogCat('Medication Safety');
    setBlogAuthor('Dr. Meera Kulkarni, Chief Pharmacist');
    setBlogReadTime('4 min read');
    setBlogImg('pharmacist');
    setBlogExcerpt('');
    setBlogContent('');
    setBlogPublished(true);
    setBlogFormOpen(true);
  };

  const openEditBlog = (post: BlogPost) => {
    setAdminError(null);
    setEditingBlog(post);
    setBlogTitle(post.title);
    setBlogCat(post.category);
    setBlogAuthor(post.authorName);
    setBlogReadTime(post.readTime);
    setBlogImg(post.imageKey);
    setBlogExcerpt(post.excerpt);
    setBlogContent(post.content);
    setBlogPublished(post.published);
    setBlogFormOpen(true);
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    try {
      await saveBlogPost(
        {
          title: blogTitle,
          category: blogCat,
          authorName: blogAuthor,
          readTime: blogReadTime,
          imageKey: blogImg,
          excerpt: blogExcerpt,
          content: blogContent,
          published: blogPublished,
        },
        editingBlog?.id
      );
      setBlogFormOpen(false);
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'Unable to save article.');
    }
  };

  const handleSaveEnquiryReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEnquiry) return;
    setAdminError(null);
    try {
      await updateEnquiry(
        activeEnquiry.id,
        enqStatus,
        enqReply,
        enqSubject,
        enqMessage
      );
      setActiveEnquiry(null);
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'Unable to update enquiry.');
    }
  };

  const handleCreateAdminEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    try {
      await submitEnquiry({
        name: newEnqName,
        email: newEnqEmail,
        phone: newEnqPhone,
        subject: newEnqSubject,
        message: newEnqMessage,
      });
      setNewEnqOpen(false);
      setNewEnqName('');
      setNewEnqEmail('');
      setNewEnqPhone('');
      setNewEnqSubject('');
      setNewEnqMessage('');
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'Unable to create enquiry.');
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar Navigation (SaaS Dashboard Contract) */}
        <aside className="lg:col-span-3 min-w-0 bg-white border border-[#DCE5DF] rounded-2xl p-4 space-y-2">
          <div className="px-3 py-2 border-b border-[#EDF2EE]">
            <p className="text-xs font-medium text-[#1F5E3B]">
              Pharmacist Admin Panel
            </p>
            <p className="text-xs font-mono text-[#4E6157] truncate mt-0.5">
              {user.email}
            </p>
          </div>

          {(
            [
              {
                id: 'approvals',
                label: 'Medicine Approvals',
                count: pendingCount,
                Icon: ClipboardCheck,
              },
              {
                id: 'inventory',
                label: 'Medicine Catalog',
                count: allMedicinesAdmin.length,
                Icon: Pill,
              },
              {
                id: 'blogs',
                label: 'Health Blog CMS',
                count: allBlogsAdmin.length,
                Icon: BookOpen,
              },
              {
                id: 'enquiries',
                label: 'Contact Enquiries',
                count: openEnquiryCount,
                Icon: MessageSquare,
              },
            ] as const
          ).map((item) => {
            const Icon = item.Icon;
            const active = effectiveTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedAdminOrderId(null);
                  setTab(item.id);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#1F5E3B] text-white'
                    : 'text-[#3D5245] hover:bg-[#F1F5F2]'
                }`}
              >
                <span className="inline-flex items-center gap-2.5 whitespace-nowrap">
                  <Icon className="w-4 h-4" />
                  {item.label}
                </span>
                <span className="font-mono text-xs tabular-nums opacity-85">
                  {item.count}
                </span>
              </button>
            );
          })}

          <div className="pt-3 border-t border-[#EDF2EE]">
            <button
              type="button"
              disabled={syncingSeed}
              onClick={async () => {
                setAdminError(null);
                setSyncingSeed(true);
                try {
                  await seedStarterCatalog();
                } catch (err) {
                  setAdminError(
                    err instanceof Error
                      ? err.message
                      : 'Unable to sync starter catalog.'
                  );
                } finally {
                  setSyncingSeed(false);
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#DCE5DF] text-xs font-medium text-[#132A1E] hover:bg-[#F1F5F2] disabled:opacity-60 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-[#1F5E3B]" />
              {syncingSeed ? 'Syncing Catalog...' : 'Sync Starter Catalog & Blogs'}
            </button>
          </div>
        </aside>

        {/* Main Admin Workspace */}
        <section className="lg:col-span-9 min-w-0 space-y-6">
          {/* Top Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-[#DCE5DF] rounded-xl p-4">
              <p className="text-xs text-[#4E6157]">Pending Rx Approvals</p>
              <p className="font-mono text-2xl font-bold tabular-nums text-[#B45309] mt-1">
                {pendingCount}
              </p>
            </div>
            <div className="bg-white border border-[#DCE5DF] rounded-xl p-4">
              <p className="text-xs text-[#4E6157]">Total Bookings</p>
              <p className="font-mono text-2xl font-bold tabular-nums text-[#132A1E] mt-1">
                {allOrders.length}
              </p>
            </div>
            <div className="bg-white border border-[#DCE5DF] rounded-xl p-4">
              <p className="text-xs text-[#4E6157]">Published Articles</p>
              <p className="font-mono text-2xl font-bold tabular-nums text-[#1F5E3B] mt-1">
                {allBlogsAdmin.filter((b) => b.published).length}
              </p>
            </div>
            <div className="bg-white border border-[#DCE5DF] rounded-xl p-4">
              <p className="text-xs text-[#4E6157]">Open Enquiries</p>
              <p className="font-mono text-2xl font-bold tabular-nums text-[#132A1E] mt-1">
                {openEnquiryCount}
              </p>
            </div>
          </div>

          {adminError && (
            <div className="p-3.5 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] text-xs text-[#991B1B] flex items-center justify-between gap-3">
              <span>{adminError}</span>
              <button
                type="button"
                onClick={() => setAdminError(null)}
                className="font-semibold underline shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* TAB 1: MEDICINE BOOKINGS & PRESCRIPTION APPROVALS */}
          {effectiveTab === 'approvals' && (
            <div className="bg-white border border-[#DCE5DF] rounded-2xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2
                    className="text-xl font-semibold text-[#132A1E]"
                    style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
                  >
                    Prescription Review &amp; Booking Approvals
                  </h2>
                  <p className="text-xs text-[#4E6157] mt-0.5">
                    Create, inspect, edit delivery/payment details, approve, or delete medicine bookings
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveRoute('storefront')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1F5E3B] text-white text-xs font-semibold hover:bg-[#17482D] self-start sm:self-auto whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Book a Medicine
                </button>
              </div>
              <div className="flex items-center justify-start sm:justify-end min-w-0">

                <div className="flex items-center gap-1 p-1 bg-[#EDF2EE] rounded-lg overflow-x-auto max-w-full min-w-0">
                  {(
                    [
                      'all',
                      'pending_approval',
                      'approved',
                      'dispatched',
                      'rejected',
                    ] as const
                  ).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setOrderFilter(st)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer ${
                        orderFilter === st
                          ? 'bg-white text-[#1F5E3B] shadow-sm font-semibold'
                          : 'text-[#4E6157]'
                      }`}
                    >
                      {st === 'all'
                        ? 'All'
                        : st === 'pending_approval'
                        ? 'Pending'
                        : st.charAt(0).toUpperCase() + st.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="border border-[#EDF2EE] rounded-xl p-10 text-center bg-[#F8FAF8]">
                  <p className="text-sm font-medium text-[#132A1E]">
                    No medicine bookings in this queue
                  </p>
                  <p className="text-xs text-[#4E6157] mt-1">
                    New customer bookings with uploaded prescriptions appear here automatically in real time.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#DCE5DF] text-xs text-[#4E6157]">
                        <th className="py-2.5 pr-4 font-medium">Patient &amp; Order</th>
                        <th className="py-2.5 pr-4 font-medium">Doctor / Rx</th>
                        <th className="py-2.5 pr-4 font-medium text-right">Amount</th>
                        <th className="py-2.5 pr-4 font-medium">Status</th>
                        <th className="py-2.5 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDF2EE] text-sm">
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-[#F8FAF8]">
                          <td className="py-3 pr-4">
                            <p className="font-semibold text-[#132A1E]">
                              {order.patientName}
                            </p>
                            <p className="text-xs font-mono text-[#4E6157]">
                              {order.id} · {order.itemCount} items
                            </p>
                          </td>
                          <td className="py-3 pr-4">
                            <p className="text-xs text-[#132A1E]">
                              Dr. {order.doctorName}
                            </p>
                            <p className="text-xs text-[#4E6157] truncate max-w-[180px]">
                              {order.prescriptionFileName}
                            </p>
                          </td>
                          <td className="py-3 pr-4 text-right">
                            <p className="font-mono tabular-nums font-semibold text-[#132A1E]">
                              ₹{order.totalAmount.toFixed(2)}
                            </p>
                            <p className="text-[11px] text-[#4E6157]">
                              {order.paymentMethod
                                ? order.paymentMethod.toUpperCase()
                                : 'STD'}
                            </p>
                          </td>
                          <td className="py-3 pr-4 text-xs font-semibold">
                            <span
                              className={
                                order.status === 'pending_approval'
                                  ? 'text-[#B45309]'
                                  : order.status === 'approved'
                                  ? 'text-[#1F5E3B]'
                                  : order.status === 'dispatched'
                                  ? 'text-[#0369A1]'
                                  : 'text-[#B91C1C]'
                              }
                            >
                              {order.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setManualActiveOrder(order);
                                setManualOrderNotes(order.adminNotes || '');
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DCE5DF] text-xs font-semibold text-[#1F5E3B] hover:bg-[#EAF3ED] whitespace-nowrap cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Inspect &amp; Approve
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Order Prescription Review Inspector */}
              {activeOrder && (
                <div className="mt-6 pt-6 border-t border-[#DCE5DF] grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[#132A1E]">
                        Prescription Document Preview
                      </h3>
                      <span className="text-xs font-mono text-[#4E6157]">
                        {activeOrder.prescriptionDate}
                      </span>
                    </div>
                    <div className="border border-[#DCE5DF] rounded-xl bg-[#F8FAF8] p-3 flex items-center justify-center min-h-[260px]">
                      {activeOrder.prescriptionDataUrl.startsWith(
                        'data:application/pdf'
                      ) ? (
                        <iframe
                          src={activeOrder.prescriptionDataUrl}
                          title="Customer Prescription PDF"
                          className="w-full h-72 rounded bg-white"
                        />
                      ) : (
                        <img
                          src={activeOrder.prescriptionDataUrl}
                          alt={activeOrder.prescriptionFileName}
                          className="max-h-72 w-auto rounded object-contain"
                        />
                      )}
                    </div>
                    <div className="text-xs text-[#4E6157] flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-[#1F5E3B]" />
                      <span>
                        {activeOrder.prescriptionFileName} · Dr.{' '}
                        {activeOrder.doctorName}
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-6 space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[#132A1E]">
                        Order Details &amp; Pharmacist Decision
                      </h3>
                      <p className="text-xs text-[#4E6157] mt-1">
                        {activeOrder.patientName} · {activeOrder.phone} ·{' '}
                        {activeOrder.address}, {activeOrder.city}{' '}
                        {activeOrder.postalCode}
                      </p>
                    </div>

                    <div className="border border-[#EDF2EE] rounded-xl divide-y divide-[#EDF2EE]">
                      {activeOrder.items.map((it, i) => (
                        <div
                          key={`${it.medicineId}-${i}`}
                          className="px-3.5 py-2 flex items-center justify-between text-xs"
                        >
                          <span>
                            {it.name} × {it.quantity}
                          </span>
                          <span className="font-mono font-semibold tabular-nums">
                            ₹{(it.price * it.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-[#F8FAF8] border border-[#E6EDE8] rounded-xl p-3.5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[#4E6157] font-medium">
                          <CreditCard className="w-3.5 h-3.5 text-[#1F5E3B]" />
                          Payment Option
                        </span>
                        <span className="font-semibold text-[#132A1E]">
                          {activeOrder.paymentMethod
                            ? PAYMENT_METHOD_LABELS[activeOrder.paymentMethod]
                            : 'Standard / Legacy'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[#4E6157]">Payment Status</span>
                        <span
                          className={`font-semibold ${
                            activeOrder.paymentStatus === 'paid_on_booking'
                              ? 'text-[#1F5E3B]'
                              : 'text-[#4E6157]'
                          }`}
                        >
                          {activeOrder.paymentStatus
                            ? PAYMENT_STATUS_LABELS[activeOrder.paymentStatus]
                            : 'Recorded'}
                        </span>
                      </div>
                      {activeOrder.paymentRef && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[#4E6157]">Payment Ref</span>
                          <span className="font-mono text-[#132A1E] truncate max-w-[220px]">
                            {activeOrder.paymentRef}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#132A1E] mb-1.5">
                        Pharmacist Notes (sent to customer notification)
                      </label>
                      <textarea
                        rows={3}
                        maxLength={FIELD_LIMITS.adminNotesMax}
                        value={orderNotes}
                        onChange={(e) => setManualOrderNotes(e.target.value)}
                        placeholder="e.g. Prescription verified. Ready for express dispatch."
                        className="w-full p-2.5 rounded-lg border border-[#DCE5DF] text-xs focus:outline-none focus:border-[#1F5E3B]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        disabled={updatingOrder}
                        onClick={() => handleOrderDecision('approved')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1F5E3B] text-white text-xs font-semibold hover:bg-[#17482D] cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve Medicine
                      </button>
                      <button
                        type="button"
                        disabled={updatingOrder}
                        onClick={() => handleOrderDecision('dispatched')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0369A1] text-white text-xs font-semibold hover:bg-[#075985] cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Mark Dispatched
                      </button>
                      <button
                        type="button"
                        disabled={updatingOrder}
                        onClick={() => handleOrderDecision('rejected')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#FCA5A5] text-[#B91C1C] text-xs font-semibold hover:bg-[#FEF2F2] cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject Rx
                      </button>
                      <button
                        type="button"
                        onClick={() => openOrderEditor(activeOrder)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#DCE5DF] text-[#132A1E] text-xs font-semibold hover:bg-[#F1F5F2] cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#1F5E3B]" />
                        Edit Details / Payment
                      </button>
                      {confirmDeleteOrderId === activeOrder.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(activeOrder.id)}
                            className="px-3 py-2 rounded-lg bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteOrderId(null)}
                            className="px-2.5 py-2 rounded-lg border border-[#DCE5DF] text-xs text-[#4E6157] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteOrderId(activeOrder.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#FECACA] text-[#B91C1C] text-xs font-semibold hover:bg-[#FEF2F2] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      )}
                    </div>

                    {editOrderOpen && (
                      <form
                        onSubmit={handleSaveOrderDetails}
                        className="p-4 rounded-xl border border-[#DCE5DF] bg-[#F8FAF8] space-y-3"
                      >
                        <p className="text-xs font-semibold text-[#132A1E]">
                          Edit Patient Delivery &amp; Payment Status
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            required
                            minLength={2}
                            value={editOrdName}
                            onChange={(e) => setEditOrdName(e.target.value)}
                            placeholder="Patient Name"
                            className="h-9 px-2.5 rounded-lg border border-[#DCE5DF] bg-white text-xs"
                          />
                          <input
                            type="tel"
                            required
                            minLength={6}
                            value={editOrdPhone}
                            onChange={(e) => setEditOrdPhone(e.target.value)}
                            placeholder="Phone"
                            className="h-9 px-2.5 rounded-lg border border-[#DCE5DF] bg-white text-xs font-mono"
                          />
                          <input
                            type="text"
                            required
                            minLength={5}
                            value={editOrdAddress}
                            onChange={(e) => setEditOrdAddress(e.target.value)}
                            placeholder="Address"
                            className="sm:col-span-2 h-9 px-2.5 rounded-lg border border-[#DCE5DF] bg-white text-xs"
                          />
                          <input
                            type="text"
                            required
                            minLength={2}
                            value={editOrdCity}
                            onChange={(e) => setEditOrdCity(e.target.value)}
                            placeholder="City"
                            className="h-9 px-2.5 rounded-lg border border-[#DCE5DF] bg-white text-xs"
                          />
                          <input
                            type="text"
                            required
                            minLength={3}
                            value={editOrdPostal}
                            onChange={(e) => setEditOrdPostal(e.target.value)}
                            placeholder="PIN Code"
                            className="h-9 px-2.5 rounded-lg border border-[#DCE5DF] bg-white text-xs font-mono"
                          />
                          <select
                            value={editOrdPayStatus}
                            onChange={(e) =>
                              setEditOrdPayStatus(e.target.value as PaymentStatus)
                            }
                            className="h-9 px-2.5 rounded-lg border border-[#DCE5DF] bg-white text-xs"
                          >
                            <option value="paid_on_booking">Paid on Booking</option>
                            <option value="pay_on_delivery">Pay on Delivery</option>
                            <option value="pending_verification">Pending Verification</option>
                          </select>
                          <input
                            type="text"
                            value={editOrdPayRef}
                            onChange={(e) => setEditOrdPayRef(e.target.value)}
                            placeholder="Payment Ref / UTR"
                            className="h-9 px-2.5 rounded-lg border border-[#DCE5DF] bg-white text-xs font-mono"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            disabled={updatingOrder}
                            className="px-3.5 py-1.5 rounded-lg bg-[#1F5E3B] text-white text-xs font-semibold cursor-pointer"
                          >
                            Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditOrderOpen(false)}
                            className="px-3 py-1.5 rounded-lg border border-[#DCE5DF] bg-white text-xs text-[#4E6157] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MEDICINE INVENTORY CRUD */}
          {effectiveTab === 'inventory' && (
            <div className="bg-white border border-[#DCE5DF] rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2
                    className="text-xl font-semibold text-[#132A1E]"
                    style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
                  >
                    Medicine Catalog Management
                  </h2>
                  <p className="text-xs text-[#4E6157] mt-0.5">
                    Add or update pharmacy medicines synchronized across all customer devices
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openNewMedicine}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1F5E3B] text-white text-xs font-semibold hover:bg-[#17482D] whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Medicine
                </button>
              </div>

              {medFormOpen && (
                <form
                  onSubmit={handleSaveMedicine}
                  className="border border-[#DCE5DF] rounded-xl p-5 bg-[#F8FAF8] space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Medicine Name *
                      </label>
                      <input
                        type="text"
                        required
                        minLength={2}
                        maxLength={FIELD_LIMITS.nameMax}
                        value={medName}
                        onChange={(e) => setMedName(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-[#DCE5DF] bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Generic Composition *
                      </label>
                      <input
                        type="text"
                        required
                        minLength={2}
                        maxLength={FIELD_LIMITS.nameMax}
                        value={medGeneric}
                        onChange={(e) => setMedGeneric(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-[#DCE5DF] bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Category
                      </label>
                      <select
                        value={medCat}
                        onChange={(e) =>
                          setMedCat(e.target.value as MedicineCategory)
                        }
                        className="w-full h-9 px-3 rounded-lg border border-[#DCE5DF] bg-white text-sm"
                      >
                        {MEDICINE_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Pack Size *
                      </label>
                      <input
                        type="text"
                        required
                        value={medPack}
                        onChange={(e) => setMedPack(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-[#DCE5DF] bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Price (₹) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        value={medPrice}
                        onChange={(e) => setMedPrice(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-[#DCE5DF] bg-white text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={medStock}
                        onChange={(e) => setMedStock(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-[#DCE5DF] bg-white text-sm font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Product Visual
                      </label>
                      <select
                        value={medImage}
                        onChange={(e) =>
                          setMedImage(e.target.value as MedicineImageKey)
                        }
                        className="w-full h-9 px-3 rounded-lg border border-[#DCE5DF] bg-white text-sm"
                      >
                        <option value="prescription">Prescription Care</option>
                        <option value="vitamins">Vitamins &amp; Supplements</option>
                        <option value="derma">Derma &amp; Skincare</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-medium pt-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={medRx}
                        onChange={(e) => setMedRx(e.target.checked)}
                      />
                      Requires Prescription (Rx)
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium pt-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={medActive}
                        onChange={(e) => setMedActive(e.target.checked)}
                      />
                      Active on Storefront
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Clinical Description *
                    </label>
                    <textarea
                      rows={2}
                      required
                      minLength={5}
                      maxLength={FIELD_LIMITS.descriptionMax}
                      value={medDesc}
                      onChange={(e) => setMedDesc(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#DCE5DF] bg-white text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-[#1F5E3B] text-white text-xs font-semibold cursor-pointer"
                    >
                      Save Medicine
                    </button>
                    <button
                      type="button"
                      onClick={() => setMedFormOpen(false)}
                      className="px-4 py-2 rounded-lg border border-[#DCE5DF] bg-white text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#DCE5DF] text-xs text-[#4E6157]">
                      <th className="py-2.5 pr-4 font-medium">Medicine</th>
                      <th className="py-2.5 pr-4 font-medium">Category</th>
                      <th className="py-2.5 pr-4 font-medium text-right">Price</th>
                      <th className="py-2.5 pr-4 font-medium text-right">Stock</th>
                      <th className="py-2.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDF2EE] text-sm">
                    {allMedicinesAdmin.map((med) => (
                      <tr key={med.id} className="hover:bg-[#F8FAF8]">
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-[#132A1E]">
                            {med.name}
                          </p>
                          <p className="text-xs text-[#4E6157]">
                            {med.packSize} · {med.requiresPrescription ? 'Rx' : 'OTC'}
                          </p>
                        </td>
                        <td className="py-3 pr-4 text-xs text-[#4E6157]">
                          {med.category}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono tabular-nums font-semibold">
                          ₹{med.price.toFixed(2)}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono tabular-nums">
                          {med.stock}
                        </td>
                        <td className="py-3 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEditMedicine(med)}
                            className="text-xs font-semibold text-[#1F5E3B] hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteMedicine(med.id)}
                            aria-label={`Delete ${med.name}`}
                            className="text-xs text-[#B91C1C] hover:underline inline-flex items-center cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: HEALTH BLOG CMS */}
          {effectiveTab === 'blogs' && (
            <div className="bg-white border border-[#DCE5DF] rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2
                    className="text-xl font-semibold text-[#132A1E]"
                    style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
                  >
                    Health Blog Publisher
                  </h2>
                  <p className="text-xs text-[#4E6157] mt-0.5">
                    Write, edit, and publish health articles directly to the public journal
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openNewBlog}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1F5E3B] text-white text-xs font-semibold hover:bg-[#17482D] whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Article
                </button>
              </div>

              {blogFormOpen && (
                <form
                  onSubmit={handleSaveBlog}
                  className="border border-[#DCE5DF] rounded-xl p-5 bg-[#F8FAF8] space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium mb-1">
                        Article Title *
                      </label>
                      <input
                        type="text"
                        required
                        minLength={2}
                        maxLength={FIELD_LIMITS.blogTitleMax}
                        value={blogTitle}
                        onChange={(e) => setBlogTitle(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-[#DCE5DF] bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Category
                      </label>
                      <select
                        value={blogCat}
                        onChange={(e) =>
                          setBlogCat(e.target.value as BlogCategory)
                        }
                        className="w-full h-9 px-3 rounded-lg border border-[#DCE5DF] bg-white text-sm"
                      >
                        {BLOG_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Author Name *
                      </label>
                      <input
                        type="text"
                        required
                        minLength={2}
                        maxLength={100}
                        value={blogAuthor}
                        onChange={(e) => setBlogAuthor(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-[#DCE5DF] bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Read Time *
                      </label>
                      <input
                        type="text"
                        required
                        minLength={2}
                        maxLength={30}
                        value={blogReadTime}
                        onChange={(e) => setBlogReadTime(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-[#DCE5DF] bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Cover Image
                      </label>
                      <select
                        value={blogImg}
                        onChange={(e) =>
                          setBlogImg(e.target.value as BlogImageKey)
                        }
                        className="w-full h-9 px-3 rounded-lg border border-[#DCE5DF] bg-white text-sm"
                      >
                        <option value="pharmacist">Pharmacist Consultation</option>
                        <option value="vitamins">Nutrition &amp; Vitamins</option>
                        <option value="derma">Skin &amp; Wellness</option>
                        <option value="prescription">Medication Safety</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Summary Excerpt *
                    </label>
                    <input
                      type="text"
                      required
                      minLength={3}
                      maxLength={FIELD_LIMITS.blogExcerptMax}
                      value={blogExcerpt}
                      onChange={(e) => setBlogExcerpt(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-[#DCE5DF] bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Article Body *
                    </label>
                    <textarea
                      rows={5}
                      required
                      minLength={5}
                      maxLength={FIELD_LIMITS.blogContentMax}
                      value={blogContent}
                      onChange={(e) => setBlogContent(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#DCE5DF] bg-white text-sm"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={blogPublished}
                      onChange={(e) => setBlogPublished(e.target.checked)}
                    />
                    Published on Health Blog
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-[#1F5E3B] text-white text-xs font-semibold cursor-pointer"
                    >
                      Save Article
                    </button>
                    <button
                      type="button"
                      onClick={() => setBlogFormOpen(false)}
                      className="px-4 py-2 rounded-lg border border-[#DCE5DF] bg-white text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="divide-y divide-[#EDF2EE] border border-[#EDF2EE] rounded-xl">
                {allBlogsAdmin.map((post) => (
                  <div
                    key={post.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs text-[#4E6157]">
                        {post.category} · {post.readTime} ·{' '}
                        <span
                          className={
                            post.published ? 'text-[#1F5E3B] font-semibold' : 'text-[#B45309]'
                          }
                        >
                          {post.published ? 'Published' : 'Draft'}
                        </span>
                      </p>
                      <h3 className="text-sm font-semibold text-[#132A1E] mt-0.5">
                        {post.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditBlog(post)}
                        className="text-xs font-semibold text-[#1F5E3B] hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteBlogPost(post.id)}
                        className="text-xs font-semibold text-[#B91C1C] hover:underline cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CONTACT ENQUIRIES INBOX & FULL CRUD */}
          {effectiveTab === 'enquiries' && (
            <div className="bg-white border border-[#DCE5DF] rounded-2xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2
                    className="text-xl font-semibold text-[#132A1E]"
                    style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
                  >
                    Customer Contact Enquiries
                  </h2>
                  <p className="text-xs text-[#4E6157] mt-0.5">
                    Create, review, edit, respond to, or delete customer enquiries synced across devices
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewEnqOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1F5E3B] text-white text-xs font-semibold hover:bg-[#17482D] self-start sm:self-auto whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Enquiry
                </button>
              </div>

              {newEnqOpen && (
                <form
                  onSubmit={handleCreateAdminEnquiry}
                  className="border border-[#DCE5DF] rounded-xl p-5 bg-[#F8FAF8] space-y-3"
                >
                  <h3 className="text-sm font-semibold text-[#132A1E]">
                    Log New Customer Enquiry
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      minLength={2}
                      value={newEnqName}
                      onChange={(e) => setNewEnqName(e.target.value)}
                      placeholder="Customer Name *"
                      className="h-9 px-3 rounded-lg border border-[#DCE5DF] bg-white text-xs"
                    />
                    <input
                      type="email"
                      required
                      value={newEnqEmail}
                      onChange={(e) => setNewEnqEmail(e.target.value)}
                      placeholder="Email *"
                      className="h-9 px-3 rounded-lg border border-[#DCE5DF] bg-white text-xs"
                    />
                    <input
                      type="tel"
                      required
                      minLength={6}
                      value={newEnqPhone}
                      onChange={(e) => setNewEnqPhone(e.target.value)}
                      placeholder="Phone *"
                      className="h-9 px-3 rounded-lg border border-[#DCE5DF] bg-white text-xs font-mono"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    minLength={3}
                    value={newEnqSubject}
                    onChange={(e) => setNewEnqSubject(e.target.value)}
                    placeholder="Enquiry Subject *"
                    className="w-full h-9 px-3 rounded-lg border border-[#DCE5DF] bg-white text-xs"
                  />
                  <textarea
                    rows={3}
                    required
                    minLength={5}
                    value={newEnqMessage}
                    onChange={(e) => setNewEnqMessage(e.target.value)}
                    placeholder="Customer question or walk-in note *"
                    className="w-full p-2.5 rounded-lg border border-[#DCE5DF] bg-white text-xs"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-[#1F5E3B] text-white text-xs font-semibold cursor-pointer"
                    >
                      Save Enquiry
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewEnqOpen(false)}
                      className="px-4 py-2 rounded-lg border border-[#DCE5DF] bg-white text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {allEnquiries.length === 0 ? (
                <div className="border border-[#EDF2EE] rounded-xl p-10 text-center bg-[#F8FAF8]">
                  <p className="text-sm font-medium text-[#132A1E]">
                    No contact enquiries yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allEnquiries.map((enq) => (
                    <div
                      key={enq.id}
                      className="border border-[#DCE5DF] rounded-xl p-4 space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-[#132A1E]">
                            {enq.subject}
                          </p>
                          <p className="text-xs text-[#4E6157]">
                            {enq.name} · {enq.email} ·{' '}
                            <span className="font-mono">{enq.phone}</span>
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 self-start">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveEnquiry(enq);
                              setEnqStatus(
                                enq.status === 'new' ? 'resolved' : enq.status
                              );
                              setEnqSubject(enq.subject);
                              setEnqMessage(enq.message);
                              setEnqReply(enq.adminReply || '');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#DCE5DF] text-xs font-semibold text-[#1F5E3B] hover:bg-[#EAF3ED] cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" />
                            {enq.adminReply ? 'Edit / Reply' : 'Edit & Reply'}
                          </button>
                          {confirmDeleteEnqId === enq.id ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={async () => {
                                  await deleteEnquiry(enq.id);
                                  setConfirmDeleteEnqId(null);
                                  if (activeEnquiry?.id === enq.id) {
                                    setActiveEnquiry(null);
                                  }
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteEnqId(null)}
                                className="px-2 py-1.5 rounded-lg border border-[#DCE5DF] text-xs text-[#4E6157] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteEnqId(enq.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#FECACA] text-xs font-semibold text-[#B91C1C] hover:bg-[#FEF2F2] cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-[#3D5245] leading-relaxed">
                        {enq.message}
                      </p>
                      <p className="text-[11px] font-mono text-[#4E6157]">
                        Status: {enq.status}
                        {enq.adminReply ? ` · Reply: ${enq.adminReply}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {activeEnquiry && (
                <form
                  onSubmit={handleSaveEnquiryReply}
                  className="border border-[#DCE5DF] rounded-xl p-5 bg-[#F8FAF8] space-y-3"
                >
                  <h3 className="text-sm font-semibold text-[#132A1E]">
                    Edit &amp; Respond to {activeEnquiry.name}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Subject *
                      </label>
                      <input
                        type="text"
                        required
                        minLength={3}
                        maxLength={FIELD_LIMITS.enquirySubjectMax}
                        value={enqSubject}
                        onChange={(e) => setEnqSubject(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-[#DCE5DF] bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Status
                      </label>
                      <select
                        value={enqStatus}
                        onChange={(e) =>
                          setEnqStatus(e.target.value as EnquiryStatus)
                        }
                        className="w-full h-9 px-3 rounded-lg border border-[#DCE5DF] bg-white text-sm"
                      >
                        <option value="new">New</option>
                        <option value="in_review">In Review</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Customer Message *
                    </label>
                    <textarea
                      rows={2}
                      required
                      minLength={5}
                      maxLength={FIELD_LIMITS.enquiryMessageMax}
                      value={enqMessage}
                      onChange={(e) => setEnqMessage(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#DCE5DF] bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Pharmacist / Admin Reply
                    </label>
                    <textarea
                      rows={3}
                      maxLength={FIELD_LIMITS.enquiryReplyMax}
                      value={enqReply}
                      onChange={(e) => setEnqReply(e.target.value)}
                      placeholder="Write your reply to the customer..."
                      className="w-full p-2.5 rounded-lg border border-[#DCE5DF] bg-white text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-[#1F5E3B] text-white text-xs font-semibold cursor-pointer"
                    >
                      Save Updates
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveEnquiry(null)}
                      className="px-4 py-2 rounded-lg border border-[#DCE5DF] bg-white text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
