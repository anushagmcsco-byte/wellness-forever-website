'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  LogIn,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Send,
  Trash2,
} from 'lucide-react';
import { BRANCH_INFO } from '@/lib/branchInfo';
import { FIELD_LIMITS, type ContactEnquiry } from '@/lib/types';
import { usePharmacy } from './FirebaseContext';

export default function ContactView() {
  const {
    user,
    signInWithGoogle,
    submitEnquiry,
    updateMyEnquiry,
    deleteEnquiry,
    myEnquiries,
  } = usePharmacy();

  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Edit / Delete state for existing customer enquiries
  const [editingEnqId, setEditingEnqId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const effectiveName = name ?? user?.displayName ?? '';
  const effectiveEmail = email ?? user?.email ?? '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitted(false);

    if (!user || !user.emailVerified) {
      setError('Please sign in with Google so your enquiry syncs across all your devices.');
      return;
    }
    if (
      effectiveName.trim().length < 2 ||
      phone.trim().length < 6 ||
      subject.trim().length < 3 ||
      message.trim().length < 5
    ) {
      setError('Please fill out all required fields completely.');
      return;
    }

    setSubmitting(true);
    try {
      await submitEnquiry({
        name: effectiveName,
        email: effectiveEmail,
        phone,
        subject,
        message,
      });
      setSubject('');
      setMessage('');
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send enquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (enq: ContactEnquiry) => {
    setEditingEnqId(enq.id);
    setEditName(enq.name);
    setEditPhone(enq.phone);
    setEditSubject(enq.subject);
    setEditMessage(enq.message);
    setConfirmDeleteId(null);
  };

  const handleSaveEdit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      await updateMyEnquiry(id, {
        name: editName,
        phone: editPhone,
        subject: editSubject,
        message: editMessage,
      });
      setEditingEnqId(null);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteEnquiry(id);
    setConfirmDeleteId(null);
    if (editingEnqId === id) setEditingEnqId(null);
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Pharmacy Desk Information */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <p className="text-xs font-medium text-[#1F5E3B] mb-1.5">
              Hosayallapur, Dharwad · Clinical Support
            </p>
            <h1
              className="text-3xl font-semibold text-[#132A1E]"
              style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
            >
              Contact Wellness Forever
            </h1>
            <p className="text-sm text-[#4E6157] mt-2 leading-relaxed">
              Have a question about medicine availability, dosage guidance, or an uploaded prescription? Reach our Dharwad pharmacy directly or submit a synced enquiry.
            </p>
          </div>

          <div className="bg-white border border-[#DCE5DF] rounded-2xl p-6 space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-[#EAF3ED] text-[#1F5E3B] flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#132A1E]">
                  {BRANCH_INFO.branchName}
                </h2>
                <p className="text-xs text-[#4E6157] mt-1 leading-relaxed">
                  {BRANCH_INFO.address}
                </p>
                <a
                  href={BRANCH_INFO.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F5E3B] hover:underline mt-2"
                >
                  <span>View Store on Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3.5 pt-4 border-t border-[#EDF2EE]">
              <div className="w-9 h-9 rounded-lg bg-[#EAF3ED] text-[#1F5E3B] flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#132A1E]">
                  Store Phone Number
                </h2>
                <a
                  href={BRANCH_INFO.phoneHref}
                  className="text-sm font-mono font-semibold text-[#1F5E3B] hover:underline mt-1 inline-block"
                >
                  {BRANCH_INFO.phoneDisplay}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3.5 pt-4 border-t border-[#EDF2EE]">
              <div className="w-9 h-9 rounded-lg bg-[#EAF3ED] text-[#1F5E3B] flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#132A1E]">
                  Dispensary Desk Email
                </h2>
                <p className="text-xs font-mono text-[#4E6157] mt-1">
                  {BRANCH_INFO.email}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 pt-4 border-t border-[#EDF2EE]">
              <div className="w-9 h-9 rounded-lg bg-[#EAF3ED] text-[#1F5E3B] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#132A1E]">
                  Operating &amp; Rx Verification Hours
                </h2>
                <p className="text-xs text-[#4E6157] mt-1">
                  {BRANCH_INFO.hours}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Cloud-Synced Contact Enquiry Form */}
        <div className="lg:col-span-7 bg-white border border-[#DCE5DF] rounded-2xl p-6 sm:p-8">
          <h2
            className="text-xl font-semibold text-[#132A1E]"
            style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
          >
            Send a Pharmacist Enquiry
          </h2>
          <p className="text-xs text-[#4E6157] mt-1 mb-6">
            Create, view, edit, or delete your enquiries synced across all devices and reviewed in the Admin Panel.
          </p>

          {!user && (
            <div className="mb-6 p-4 rounded-xl border border-[#F59E0B] bg-[#FFFBEB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-[#78350F]">
                Sign in with Google to submit enquiries and view pharmacist replies across all devices.
              </p>
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

          {submitted && (
            <div className="mb-6 p-4 rounded-xl border border-[#8DC63F] bg-[#F3F9F5] flex items-start gap-2.5 text-xs text-[#132A1E]">
              <CheckCircle2 className="w-4 h-4 text-[#1F5E3B] shrink-0 mt-0.5" />
              <span>
                Your enquiry has been received and synced to the Admin Panel. You can edit or delete it below before review.
              </span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] text-xs text-[#991B1B]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#132A1E] mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength={FIELD_LIMITS.shortTextMax}
                  value={effectiveName}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full h-10 px-3 rounded-lg border border-[#DCE5DF] text-sm focus:outline-none focus:border-[#1F5E3B]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#132A1E] mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  maxLength={200}
                  value={effectiveEmail}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-10 px-3 rounded-lg border border-[#DCE5DF] text-sm focus:outline-none focus:border-[#1F5E3B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#132A1E] mb-1.5">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={FIELD_LIMITS.phoneMax}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full h-10 px-3 rounded-lg border border-[#DCE5DF] text-sm font-mono focus:outline-none focus:border-[#1F5E3B]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#132A1E] mb-1.5">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  maxLength={FIELD_LIMITS.enquirySubjectMax}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Medicine stock or dosage query"
                  className="w-full h-10 px-3 rounded-lg border border-[#DCE5DF] text-sm focus:outline-none focus:border-[#1F5E3B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#132A1E] mb-1.5">
                Message *
              </label>
              <textarea
                required
                rows={4}
                maxLength={FIELD_LIMITS.enquiryMessageMax}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your medicine enquiry or prescription question..."
                className="w-full p-3 rounded-lg border border-[#DCE5DF] text-sm focus:outline-none focus:border-[#1F5E3B]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#1F5E3B] text-white text-sm font-semibold hover:bg-[#17482D] disabled:opacity-60 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Sending...' : 'Submit Enquiry'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Synced User Enquiries History with Edit & Delete CRUD */}
      {user && myEnquiries.length > 0 && (
        <section className="pt-4">
          <h2
            className="text-xl font-semibold text-[#132A1E] mb-4"
            style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
          >
            Your Recent Enquiries ({myEnquiries.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myEnquiries.map((enq) => {
              const isEditing = editingEnqId === enq.id;
              return (
                <div
                  key={enq.id}
                  className="bg-white border border-[#DCE5DF] rounded-xl p-5 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-[#4E6157]">
                      {enq.createdAt?.toDate?.().toLocaleDateString() || 'Just now'}
                    </span>
                    <span
                      className={`font-semibold ${
                        enq.status === 'resolved'
                          ? 'text-[#1F5E3B]'
                          : enq.status === 'in_review'
                          ? 'text-[#B45309]'
                          : 'text-[#0369A1]'
                      }`}
                    >
                      {enq.status === 'resolved'
                        ? 'Resolved'
                        : enq.status === 'in_review'
                        ? 'In Review'
                        : 'Submitted'}
                    </span>
                  </div>

                  {isEditing ? (
                    <form
                      onSubmit={(e) => handleSaveEdit(e, enq.id)}
                      className="space-y-3 bg-[#F8FAF8] border border-[#DCE5DF] rounded-lg p-3.5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          required
                          minLength={2}
                          maxLength={FIELD_LIMITS.shortTextMax}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Name"
                          className="h-9 px-2.5 rounded-md border border-[#DCE5DF] bg-white text-xs"
                        />
                        <input
                          type="tel"
                          required
                          minLength={6}
                          maxLength={FIELD_LIMITS.phoneMax}
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="Phone"
                          className="h-9 px-2.5 rounded-md border border-[#DCE5DF] bg-white text-xs font-mono"
                        />
                      </div>
                      <input
                        type="text"
                        required
                        minLength={3}
                        maxLength={FIELD_LIMITS.enquirySubjectMax}
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        placeholder="Subject"
                        className="w-full h-9 px-2.5 rounded-md border border-[#DCE5DF] bg-white text-xs"
                      />
                      <textarea
                        rows={3}
                        required
                        minLength={5}
                        maxLength={FIELD_LIMITS.enquiryMessageMax}
                        value={editMessage}
                        onChange={(e) => setEditMessage(e.target.value)}
                        className="w-full p-2.5 rounded-md border border-[#DCE5DF] bg-white text-xs"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={savingEdit}
                          className="px-3 py-1.5 rounded-md bg-[#1F5E3B] text-white text-xs font-semibold cursor-pointer"
                        >
                          {savingEdit ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingEnqId(null)}
                          className="px-3 py-1.5 rounded-md border border-[#DCE5DF] bg-white text-xs text-[#4E6157] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <h3 className="text-sm font-semibold text-[#132A1E]">
                        {enq.subject}
                      </h3>
                      <p className="text-xs text-[#4E6157] leading-relaxed">
                        {enq.message}
                      </p>
                    </>
                  )}

                  {enq.adminReply && (
                    <div className="mt-2 pt-2.5 border-t border-[#EDF2EE] text-xs text-[#132A1E]">
                      <p className="font-semibold text-[#1F5E3B] inline-flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Pharmacist Response
                      </p>
                      <p className="mt-1 text-[#3D5245] leading-relaxed">
                        {enq.adminReply}
                      </p>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="pt-2 border-t border-[#F1F5F2] flex items-center justify-end gap-2">
                      {enq.status === 'new' && (
                        <button
                          type="button"
                          onClick={() => startEdit(enq)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#DCE5DF] text-xs font-medium text-[#1F5E3B] hover:bg-[#EAF3ED] cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                      )}
                      {confirmDeleteId === enq.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDelete(enq.id)}
                            className="px-2.5 py-1 rounded-md bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded-md border border-[#DCE5DF] text-xs text-[#4E6157] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(enq.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#FECACA] text-xs font-medium text-[#B91C1C] hover:bg-[#FEF2F2] cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
