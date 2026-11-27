'use client';

import React from 'react';
import {
  Bell,
  CheckCheck,
  ChevronRight,
  LogIn,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { usePharmacy } from './FirebaseContext';

export default function NotificationDrawer() {
  const {
    user,
    isAdmin,
    notifications,
    unreadNotificationCount,
    isNotificationsOpen,
    setIsNotificationsOpen,
    markNotificationRead,
    markAllNotificationsRead,
    setActiveRoute,
    setSelectedAdminOrderId,
    signInWithGoogle,
  } = usePharmacy();

  const handleOpenRelated = async (
    notifId: string,
    targetRole: 'admin' | 'customer',
    orderId: string
  ) => {
    await markNotificationRead(notifId);
    setIsNotificationsOpen(false);
    if (targetRole === 'admin' && isAdmin) {
      setSelectedAdminOrderId(orderId);
      setActiveRoute('admin');
    } else {
      setActiveRoute('bookings');
    }
  };

  return (
    <AnimatePresence>
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => setIsNotificationsOpen(false)}
            className="fixed inset-0 bg-[#0E2417]/35 backdrop-blur-[2px]"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md bg-white h-full border-l border-[#DCE5DF] flex flex-col shadow-2xl"
          >
            <div className="px-6 py-5 border-b border-[#DCE5DF] flex items-center justify-between gap-4">
              <div>
                <h2
                  className="text-lg font-semibold text-[#132A1E]"
                  style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
                >
                  Pharmacy Notifications
                </h2>
                <p className="text-xs text-[#4E6157] mt-0.5">
                  Real-time booking &amp; prescription updates synced across devices
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(false)}
                aria-label="Close notifications"
                className="w-9 h-9 rounded-lg border border-[#DCE5DF] flex items-center justify-center text-[#4E6157] hover:bg-[#F1F5F2] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {user && unreadNotificationCount > 0 && (
              <div className="px-6 py-2.5 bg-[#F4F8F5] border-b border-[#DCE5DF] flex items-center justify-between text-xs">
                <span className="font-mono tabular-nums text-[#1F5E3B] font-medium">
                  {unreadNotificationCount} unread alert(s)
                </span>
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  className="inline-flex items-center gap-1.5 text-[#1F5E3B] font-medium hover:underline cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {!user ? (
                <div className="border border-[#DCE5DF] rounded-xl p-6 text-center bg-[#F8FAF8]">
                  <Bell className="w-8 h-8 text-[#1F5E3B] mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-[#132A1E] mb-1">
                    Sign in for live alerts
                  </h3>
                  <p className="text-xs text-[#4E6157] mb-4 leading-relaxed">
                    Receive instant pharmacist approval notifications and order dispatch updates across all your devices.
                  </p>
                  <button
                    type="button"
                    onClick={signInWithGoogle}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1F5E3B] text-white text-xs font-medium hover:bg-[#17482D] cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Sign in with Google
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="border border-[#DCE5DF] rounded-xl p-8 text-center bg-[#F8FAF8]">
                  <Bell className="w-7 h-7 text-[#6E8276] mx-auto mb-2" />
                  <p className="text-sm font-medium text-[#132A1E]">
                    No notifications yet
                  </p>
                  <p className="text-xs text-[#4E6157] mt-1">
                    Medicine booking confirmations and pharmacist approvals will appear here in real time.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const createdDate = notif.createdAt?.toDate?.();
                  const timeLabel = createdDate
                    ? createdDate.toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Just now';
                  return (
                    <div
                      key={notif.id}
                      className={`rounded-xl border p-4 transition-colors ${
                        notif.read
                          ? 'bg-white border-[#DCE5DF]'
                          : 'bg-[#F3F9F5] border-[#8DC63F]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-[11px] font-mono text-[#4E6157] tabular-nums">
                          {notif.targetRole === 'admin'
                            ? 'Admin Queue'
                            : 'Order Update'}{' '}
                          · {timeLabel}
                        </div>
                        {!notif.read && (
                          <span className="text-[11px] font-semibold text-[#1F5E3B]">
                            New
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-[#132A1E] mt-1">
                        {notif.title}
                      </h4>
                      <p className="text-xs text-[#4E6157] mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="mt-3 pt-2.5 border-t border-[#E6EDE8] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenRelated(
                              notif.id,
                              notif.targetRole,
                              notif.orderId
                            )
                          }
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F5E3B] hover:underline cursor-pointer"
                        >
                          <span>
                            {notif.targetRole === 'admin' && isAdmin
                              ? 'Review & Approve'
                              : 'View Booking'}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        {!notif.read && (
                          <button
                            type="button"
                            onClick={() => markNotificationRead(notif.id)}
                            className="text-xs text-[#4E6157] hover:text-[#132A1E] cursor-pointer"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
