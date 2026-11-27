'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore';
import {
  ADMIN_EMAIL,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testConnection,
} from '@/lib/firebase';
import { STARTER_BLOGS, STARTER_MEDICINES } from '@/lib/seedData';
import {
  FIELD_LIMITS,
  type AppNotification,
  type BlogPost,
  type CartItem,
  type ContactEnquiry,
  type EnquiryStatus,
  type Medicine,
  type MedicineOrder,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from '@/lib/types';

export type ActiveRoute =
  | 'storefront'
  | 'gallery'
  | 'blog'
  | 'bookings'
  | 'contact'
  | 'admin'
  | 'login';

export interface BookingFormPayload {
  patientName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  doctorName: string;
  prescriptionDate: string;
  prescriptionFileName: string;
  prescriptionDataUrl: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentRef?: string;
}

export interface EnquiryFormPayload {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface ToastBanner {
  id: string;
  title: string;
  message: string;
  targetRole?: 'admin' | 'customer';
}

interface FirebaseContextValue {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  activeRoute: ActiveRoute;
  setActiveRoute: (route: ActiveRoute) => void;
  medicines: Medicine[];
  allMedicinesAdmin: Medicine[];
  blogs: BlogPost[];
  allBlogsAdmin: BlogPost[];
  myOrders: MedicineOrder[];
  allOrders: MedicineOrder[];
  myEnquiries: ContactEnquiry[];
  allEnquiries: ContactEnquiry[];
  notifications: AppNotification[];
  unreadNotificationCount: number;
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  selectedAdminOrderId: string | null;
  setSelectedAdminOrderId: (id: string | null) => void;
  toastBanner: ToastBanner | null;
  dismissToast: () => void;
  signInWithGoogle: () => Promise<User | null>;
  signOutUser: () => Promise<void>;
  addToCart: (medicine: Medicine, quantity?: number) => void;
  updateCartQuantity: (medicineId: string, quantity: number) => void;
  removeFromCart: (medicineId: string) => void;
  clearCart: () => void;
  submitMedicineBooking: (payload: BookingFormPayload) => Promise<string>;
  updateMyBooking: (order: MedicineOrder, payload: BookingFormPayload) => Promise<void>;
  updateOrderStatus: (
    order: MedicineOrder,
    status: OrderStatus,
    adminNotes: string
  ) => Promise<void>;
  updateBookingAdmin: (
    order: MedicineOrder,
    updates: {
      patientName: string;
      phone: string;
      address: string;
      city: string;
      postalCode: string;
      paymentStatus: PaymentStatus;
      paymentRef?: string;
    }
  ) => Promise<void>;
  deleteBooking: (orderId: string) => Promise<void>;
  saveMedicine: (
    data: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt' | 'isStarterFallback'>,
    existingId?: string
  ) => Promise<void>;
  deleteMedicine: (id: string) => Promise<void>;
  saveBlogPost: (
    data: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'isStarterFallback'>,
    existingId?: string
  ) => Promise<void>;
  deleteBlogPost: (id: string) => Promise<void>;
  submitEnquiry: (payload: EnquiryFormPayload) => Promise<void>;
  updateMyEnquiry: (
    id: string,
    payload: { name: string; phone: string; subject: string; message: string }
  ) => Promise<void>;
  updateEnquiry: (
    id: string,
    status: EnquiryStatus,
    adminReply: string,
    subject?: string,
    message?: string
  ) => Promise<void>;
  deleteEnquiry: (id: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  seedStarterCatalog: (silent?: boolean) => Promise<void>;
  dataLoading: boolean;
  authError: string | null;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

function sortNewest<T extends { createdAt?: Timestamp | null }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const tA = a.createdAt?.toMillis?.() ?? 0;
    const tB = b.createdAt?.toMillis?.() ?? 0;
    return tB - tA;
  });
}

function makeDocId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${random}`;
}

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdminDoc, setIsAdminDoc] = useState(false);
  const [activeRoute, setActiveRoute] = useState<ActiveRoute>('storefront');
  const [authError, setAuthError] = useState<string | null>(null);

  const [firestoreMedicines, setFirestoreMedicines] = useState<Medicine[]>([]);
  const [allMedicinesAdmin, setAllMedicinesAdmin] = useState<Medicine[]>([]);
  const [firestoreBlogs, setFirestoreBlogs] = useState<BlogPost[]>([]);
  const [allBlogsAdmin, setAllBlogsAdmin] = useState<BlogPost[]>([]);
  const [myOrders, setMyOrders] = useState<MedicineOrder[]>([]);
  const [allOrders, setAllOrders] = useState<MedicineOrder[]>([]);
  const [myEnquiries, setMyEnquiries] = useState<ContactEnquiry[]>([]);
  const [allEnquiries, setAllEnquiries] = useState<ContactEnquiry[]>([]);
  const [customerNotifications, setCustomerNotifications] = useState<AppNotification[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<AppNotification[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedAdminOrderId, setSelectedAdminOrderId] = useState<string | null>(null);
  const [toastBanner, setToastBanner] = useState<ToastBanner | null>(null);

  const [adminMedsLoaded, setAdminMedsLoaded] = useState(false);
  const [adminBlogsLoaded, setAdminBlogsLoaded] = useState(false);

  const seenNotifIdsRef = useRef<Set<string>>(new Set());
  const initialNotifLoadedRef = useRef(false);
  const seededOnceRef = useRef(false);

  const isBootstrappedAdmin = Boolean(
    user &&
      user.emailVerified &&
      (user.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );
  const isAdmin = isBootstrappedAdmin || isAdminDoc;

  // Hydrate cart from localStorage without synchronous setState in effect body
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = window.localStorage.getItem('wf_booking_bag');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setCart(parsed.slice(0, FIELD_LIMITS.maxOrderItems));
          }
        }
      } catch {
        // ignore storage errors
      }
    });
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('wf_booking_bag', JSON.stringify(cart));
    } catch {
      // ignore storage errors
    }
  }, [cart]);

  // Test Firestore connection & listen to Auth state
  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      setAuthError(null);

      if (nextUser && nextUser.emailVerified) {
        try {
          const userRef = doc(db, 'users', nextUser.uid);
          const snap = await getDoc(userRef);
          const displayName = (nextUser.displayName || nextUser.email || 'Customer').slice(0, 120);
          const email = (nextUser.email || '').slice(0, 200);
          const photoURL = (nextUser.photoURL || '').slice(0, 500);

          if (!snap.exists()) {
            await setDoc(userRef, {
              uid: nextUser.uid,
              displayName,
              email,
              ...(photoURL ? { photoURL } : {}),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else {
            await updateDoc(userRef, {
              displayName,
              email,
              ...(photoURL ? { photoURL } : {}),
              updatedAt: serverTimestamp(),
            });
          }
        } catch {
          // Profile sync is best-effort during boot
        }

        try {
          const adminSnap = await getDoc(doc(db, 'admins', nextUser.uid));
          setIsAdminDoc(adminSnap.exists());
        } catch {
          setIsAdminDoc(false);
        }
      } else {
        setIsAdminDoc(false);
        setAdminMedsLoaded(false);
        setAdminBlogsLoaded(false);
        setMyOrders([]);
        setMyEnquiries([]);
        setCustomerNotifications([]);
        setAllOrders([]);
        setAllEnquiries([]);
        setAllMedicinesAdmin([]);
        setAllBlogsAdmin([]);
        setAdminNotifications([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Public Catalog & Blogs real-time listeners (all devices)
  useEffect(() => {
    const medQ = query(collection(db, 'medicines'), where('active', '==', true));
    const unsubMed = onSnapshot(
      medQ,
      (snap) => {
        const rows = snap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as Omit<Medicine, 'id'>) })
        );
        setFirestoreMedicines(sortNewest(rows));
        setDataLoading(false);
      },
      (error) => {
        setDataLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'medicines');
      }
    );

    const blogQ = query(collection(db, 'blogs'), where('published', '==', true));
    const unsubBlog = onSnapshot(
      blogQ,
      (snap) => {
        const rows = snap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as Omit<BlogPost, 'id'>) })
        );
        setFirestoreBlogs(sortNewest(rows));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'blogs');
      }
    );

    return () => {
      unsubMed();
      unsubBlog();
    };
  }, []);

  // User-specific real-time listeners (orders, enquiries, notifications)
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      return;
    }

    const ordersQ = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );
    const unsubOrders = onSnapshot(
      ordersQ,
      (snap) => {
        const rows = snap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as Omit<MedicineOrder, 'id'>) })
        );
        setMyOrders(sortNewest(rows));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    );

    const enquiriesQ = query(
      collection(db, 'enquiries'),
      where('userId', '==', user.uid)
    );
    const unsubEnquiries = onSnapshot(
      enquiriesQ,
      (snap) => {
        const rows = snap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as Omit<ContactEnquiry, 'id'>) })
        );
        setMyEnquiries(sortNewest(rows));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'enquiries');
      }
    );

    const notifQ = query(
      collection(db, 'notifications'),
      where('recipientUid', '==', user.uid)
    );
    const unsubNotif = onSnapshot(
      notifQ,
      (snap) => {
        const rows = snap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as Omit<AppNotification, 'id'>) })
        );
        setCustomerNotifications(sortNewest(rows));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'notifications');
      }
    );

    return () => {
      unsubOrders();
      unsubEnquiries();
      unsubNotif();
    };
  }, [authReady, user]);

  // Admin real-time listeners (all orders, all enquiries, all medicines, all blogs, admin notifications)
  useEffect(() => {
    if (!authReady || !isAdmin) {
      return;
    }

    const unsubAllMeds = onSnapshot(
      collection(db, 'medicines'),
      (snap) => {
        const rows = snap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as Omit<Medicine, 'id'>) })
        );
        setAllMedicinesAdmin(sortNewest(rows));
        setAdminMedsLoaded(true);
      },
      (error) => {
        setAdminMedsLoaded(true);
        handleFirestoreError(error, OperationType.LIST, 'medicines');
      }
    );

    const unsubAllBlogs = onSnapshot(
      collection(db, 'blogs'),
      (snap) => {
        const rows = snap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as Omit<BlogPost, 'id'>) })
        );
        setAllBlogsAdmin(sortNewest(rows));
        setAdminBlogsLoaded(true);
      },
      (error) => {
        setAdminBlogsLoaded(true);
        handleFirestoreError(error, OperationType.LIST, 'blogs');
      }
    );

    const unsubAllOrders = onSnapshot(
      collection(db, 'orders'),
      (snap) => {
        const rows = snap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as Omit<MedicineOrder, 'id'>) })
        );
        setAllOrders(sortNewest(rows));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    );

    const unsubAllEnquiries = onSnapshot(
      collection(db, 'enquiries'),
      (snap) => {
        const rows = snap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as Omit<ContactEnquiry, 'id'>) })
        );
        setAllEnquiries(sortNewest(rows));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'enquiries');
      }
    );

    const adminNotifQ = query(
      collection(db, 'notifications'),
      where('targetRole', '==', 'admin')
    );
    const unsubAdminNotif = onSnapshot(
      adminNotifQ,
      (snap) => {
        const rows = snap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as Omit<AppNotification, 'id'>) })
        );
        setAdminNotifications(sortNewest(rows));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'notifications');
      }
    );

    return () => {
      unsubAllMeds();
      unsubAllBlogs();
      unsubAllOrders();
      unsubAllEnquiries();
      unsubAdminNotif();
    };
  }, [authReady, isAdmin]);

  const seedStarterCatalog = useCallback(async (silent = false) => {
    if (!isAdmin) return;
    try {
      const medSnaps = await Promise.all(
        STARTER_MEDICINES.map((med) => getDoc(doc(db, 'medicines', med.id)))
      );
      const blogSnaps = await Promise.all(
        STARTER_BLOGS.map((blog) => getDoc(doc(db, 'blogs', blog.id)))
      );

      const batch = writeBatch(db);
      let writeCount = 0;

      STARTER_MEDICINES.forEach((med, idx) => {
        if (!medSnaps[idx].exists()) {
          batch.set(doc(db, 'medicines', med.id), {
            name: med.name,
            genericName: med.genericName,
            category: med.category,
            price: med.price,
            packSize: med.packSize,
            stock: med.stock,
            requiresPrescription: med.requiresPrescription,
            description: med.description,
            imageKey: med.imageKey,
            active: med.active,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          writeCount += 1;
        }
      });

      STARTER_BLOGS.forEach((blog, idx) => {
        if (!blogSnaps[idx].exists()) {
          batch.set(doc(db, 'blogs', blog.id), {
            title: blog.title,
            category: blog.category,
            excerpt: blog.excerpt,
            content: blog.content,
            authorName: blog.authorName,
            readTime: blog.readTime,
            imageKey: blog.imageKey,
            published: blog.published,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          writeCount += 1;
        }
      });

      if (writeCount > 0) {
        await batch.commit();
        if (!silent) {
          setToastBanner({
            id: `seed_${Date.now()}`,
            title: 'Starter Catalog Synced',
            message: `${writeCount} starter item(s) synced to Cloud Firestore.`,
            targetRole: 'admin',
          });
        }
      } else if (!silent) {
        setToastBanner({
          id: `seed_ok_${Date.now()}`,
          title: 'Starter Catalog Up to Date',
          message: 'All starter medicines and blogs are already synced in Cloud Firestore.',
          targetRole: 'admin',
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'medicines');
    }
  }, [isAdmin]);

  // Automatically seed Firestore starter catalog & blogs when Admin signs in for the first time
  useEffect(() => {
    if (
      !authReady ||
      !isAdmin ||
      seededOnceRef.current ||
      dataLoading ||
      !adminMedsLoaded ||
      !adminBlogsLoaded
    ) {
      return;
    }
    if (allMedicinesAdmin.length === 0 && allBlogsAdmin.length === 0) {
      seededOnceRef.current = true;
      queueMicrotask(() => {
        void seedStarterCatalog(true).catch(() => {
          // Error already structured and logged by handleFirestoreError
        });
      });
    }
  }, [
    authReady,
    isAdmin,
    dataLoading,
    adminMedsLoaded,
    adminBlogsLoaded,
    allMedicinesAdmin.length,
    allBlogsAdmin.length,
    seedStarterCatalog,
  ]);

  // Merge notifications & trigger live cross-device toast banner for incoming unread alerts
  const notifications = useMemo(() => {
    const map = new Map<string, AppNotification>();
    for (const n of customerNotifications) map.set(n.id, n);
    if (isAdmin) {
      for (const n of adminNotifications) map.set(n.id, n);
    }
    return sortNewest(Array.from(map.values()));
  }, [customerNotifications, adminNotifications, isAdmin]);

  useEffect(() => {
    if (!user) {
      seenNotifIdsRef.current.clear();
      initialNotifLoadedRef.current = false;
      return;
    }
    if (!initialNotifLoadedRef.current) {
      for (const n of notifications) {
        seenNotifIdsRef.current.add(n.id);
      }
      if (notifications.length > 0) {
        initialNotifLoadedRef.current = true;
      }
      return;
    }
    const fresh = notifications.find(
      (n) => !n.read && !seenNotifIdsRef.current.has(n.id)
    );
    for (const n of notifications) {
      seenNotifIdsRef.current.add(n.id);
    }
    if (fresh) {
      setToastBanner({
        id: fresh.id,
        title: fresh.title,
        message: fresh.message,
        targetRole: fresh.targetRole,
      });
    }
  }, [notifications, user]);

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const medicines = useMemo(() => {
    if (firestoreMedicines.length > 0) return firestoreMedicines;
    return STARTER_MEDICINES;
  }, [firestoreMedicines]);

  const blogs = useMemo(() => {
    if (firestoreBlogs.length > 0) return firestoreBlogs;
    return STARTER_BLOGS;
  }, [firestoreBlogs]);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Unable to sign in with Google.';
      setAuthError(msg);
      return null;
    }
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
    if (activeRoute === 'admin') {
      setActiveRoute('storefront');
    }
  }, [activeRoute]);

  const addToCart = useCallback((medicine: Medicine, quantity = 1) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.medicineId === medicine.id);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: Math.min(100, next[existingIdx].quantity + quantity),
        };
        return next;
      }
      if (prev.length >= FIELD_LIMITS.maxOrderItems) return prev;
      return [
        ...prev,
        {
          medicineId: medicine.id,
          name: medicine.name,
          genericName: medicine.genericName,
          price: medicine.price,
          packSize: medicine.packSize,
          quantity: Math.max(1, quantity),
          requiresPrescription: medicine.requiresPrescription,
          imageKey: medicine.imageKey,
        },
      ];
    });
  }, []);

  const updateCartQuantity = useCallback((medicineId: string, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        return prev.filter((i) => i.medicineId !== medicineId);
      }
      return prev.map((i) =>
        i.medicineId === medicineId
          ? { ...i, quantity: Math.min(100, quantity) }
          : i
      );
    });
  }, []);

  const removeFromCart = useCallback((medicineId: string) => {
    setCart((prev) => prev.filter((i) => i.medicineId !== medicineId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const submitMedicineBooking = useCallback(
    async (payload: BookingFormPayload): Promise<string> => {
      if (!user || !user.emailVerified) {
        throw new Error('Please sign in with Google before completing your medicine booking.');
      }
      if (cart.length === 0) {
        throw new Error('Your booking bag is empty.');
      }

      const orderId = makeDocId('ord');
      const items = cart.slice(0, FIELD_LIMITS.maxOrderItems).map((item) => ({
        medicineId: item.medicineId,
        name: item.name.slice(0, FIELD_LIMITS.nameMax),
        price: Number(item.price),
        packSize: item.packSize.slice(0, 60),
        quantity: Math.max(1, Math.min(100, Math.round(item.quantity))),
        requiresPrescription: Boolean(item.requiresPrescription),
      }));

      const itemCount = items.reduce((s, i) => s + i.quantity, 0);
      const totalAmount = Number(
        items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)
      );
      const hasPrescriptionItems = items.some((i) => i.requiresPrescription);

      try {
        const batch = writeBatch(db);
        const orderRef = doc(db, 'orders', orderId);

        batch.set(orderRef, {
          userId: user.uid,
          userEmail: (user.email || '').slice(0, 200),
          patientName: payload.patientName.trim().slice(0, FIELD_LIMITS.shortTextMax),
          phone: payload.phone.trim().slice(0, FIELD_LIMITS.phoneMax),
          address: payload.address.trim().slice(0, FIELD_LIMITS.addressMax),
          city: payload.city.trim().slice(0, FIELD_LIMITS.cityMax),
          postalCode: payload.postalCode.trim().slice(0, FIELD_LIMITS.postalMax),
          doctorName: payload.doctorName.trim().slice(0, FIELD_LIMITS.shortTextMax),
          prescriptionDate: payload.prescriptionDate.trim().slice(0, 30),
          prescriptionFileName: payload.prescriptionFileName.trim().slice(0, 200),
          prescriptionDataUrl: payload.prescriptionDataUrl.slice(
            0,
            FIELD_LIMITS.prescriptionDataMax
          ),
          hasPrescriptionItems,
          items,
          itemCount,
          totalAmount,
          status: 'pending_approval',
          paymentMethod: payload.paymentMethod,
          paymentStatus: payload.paymentStatus,
          ...(payload.paymentRef?.trim()
            ? { paymentRef: payload.paymentRef.trim().slice(0, FIELD_LIMITS.paymentRefMax) }
            : {}),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        const adminNotifId = makeDocId('ntf_adm');
        batch.set(doc(db, 'notifications', adminNotifId), {
          recipientUid: 'ADMIN_BROADCAST',
          targetRole: 'admin',
          title: 'New Medicine Booking Requires Approval',
          message: `${payload.patientName.trim().slice(0, 60)} booked ${itemCount} item(s) (₹${totalAmount.toFixed(2)}) with prescription ${payload.prescriptionFileName.slice(0, 50)}.`,
          orderId,
          read: false,
          createdByUid: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        const customerNotifId = makeDocId('ntf_usr');
        batch.set(doc(db, 'notifications', customerNotifId), {
          recipientUid: user.uid,
          targetRole: 'customer',
          title: 'Booking Received — Pending Pharmacist Review',
          message: `Order ${orderId.slice(0, 14)} with ${itemCount} item(s) is queued for prescription verification.`,
          orderId,
          read: false,
          createdByUid: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        await batch.commit();
        setCart([]);
        setToastBanner({
          id: customerNotifId,
          title: 'Medicine Booking Submitted',
          message: 'Pharmacist notification sent. Track live approval across all your devices.',
          targetRole: 'customer',
        });
        return orderId;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `orders/${orderId}`);
      }
    },
    [cart, user]
  );

  const updateMyBooking = useCallback(
    async (order: MedicineOrder, payload: BookingFormPayload) => {
      if (!user || !user.emailVerified) {
        throw new Error('Please sign in with Google to update your booking.');
      }
      try {
        const batch = writeBatch(db);
        batch.update(doc(db, 'orders', order.id), {
          patientName: payload.patientName.trim().slice(0, FIELD_LIMITS.shortTextMax),
          phone: payload.phone.trim().slice(0, FIELD_LIMITS.phoneMax),
          address: payload.address.trim().slice(0, FIELD_LIMITS.addressMax),
          city: payload.city.trim().slice(0, FIELD_LIMITS.cityMax),
          postalCode: payload.postalCode.trim().slice(0, FIELD_LIMITS.postalMax),
          doctorName: payload.doctorName.trim().slice(0, FIELD_LIMITS.shortTextMax),
          prescriptionDate: payload.prescriptionDate.trim().slice(0, 30),
          prescriptionFileName: payload.prescriptionFileName.trim().slice(0, 200),
          prescriptionDataUrl: payload.prescriptionDataUrl.slice(
            0,
            FIELD_LIMITS.prescriptionDataMax
          ),
          paymentMethod: payload.paymentMethod,
          paymentStatus: payload.paymentStatus,
          ...(payload.paymentRef?.trim()
            ? { paymentRef: payload.paymentRef.trim().slice(0, FIELD_LIMITS.paymentRefMax) }
            : {}),
          status: 'pending_approval',
          updatedAt: serverTimestamp(),
        });

        const adminNotifId = makeDocId('ntf_upd');
        batch.set(doc(db, 'notifications', adminNotifId), {
          recipientUid: 'ADMIN_BROADCAST',
          targetRole: 'admin',
          title: 'Patient Updated Booking & Rx',
          message: `${payload.patientName.trim().slice(0, 60)} updated booking ${order.id.slice(0, 14)} for pharmacist review.`,
          orderId: order.id,
          read: false,
          createdByUid: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${order.id}`);
      }
    },
    [user]
  );

  const updateOrderStatus = useCallback(
    async (order: MedicineOrder, status: OrderStatus, adminNotes: string) => {
      if (!user || !isAdmin) return;
      const cleanNotes = adminNotes.trim().slice(0, FIELD_LIMITS.adminNotesMax);
      const reviewer = (user.email || user.displayName || 'Pharmacist Admin').slice(
        0,
        200
      );

      try {
        const batch = writeBatch(db);
        batch.update(doc(db, 'orders', order.id), {
          status,
          adminNotes: cleanNotes,
          reviewedBy: reviewer,
          ...(order.paymentMethod ? {} : { paymentMethod: 'cod' as PaymentMethod }),
          ...(order.paymentStatus
            ? {}
            : { paymentStatus: 'pay_on_delivery' as PaymentStatus }),
          updatedAt: serverTimestamp(),
        });

        const statusLabels: Record<OrderStatus, string> = {
          pending_approval: 'Returned to Pharmacist Review',
          approved: 'Medicine Booking Approved by Pharmacist',
          dispatched: 'Medicine Order Dispatched',
          rejected: 'Prescription Requires Revision',
        };

        const notifId = makeDocId('ntf_res');
        batch.set(doc(db, 'notifications', notifId), {
          recipientUid: order.userId,
          targetRole: 'customer',
          title: statusLabels[status],
          message: cleanNotes
            ? `Order for ${order.patientName}: ${cleanNotes}`.slice(0, 500)
            : `Your booking (${order.itemCount} items, ₹${order.totalAmount.toFixed(2)}) status is now ${status.replace('_', ' ')}.`,
          orderId: order.id,
          read: false,
          createdByUid: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${order.id}`);
      }
    },
    [isAdmin, user]
  );

  const updateBookingAdmin = useCallback(
    async (
      order: MedicineOrder,
      updates: {
        patientName: string;
        phone: string;
        address: string;
        city: string;
        postalCode: string;
        paymentStatus: PaymentStatus;
        paymentRef?: string;
      }
    ) => {
      if (!user || !isAdmin) return;
      try {
        await updateDoc(doc(db, 'orders', order.id), {
          patientName: updates.patientName.trim().slice(0, FIELD_LIMITS.shortTextMax),
          phone: updates.phone.trim().slice(0, FIELD_LIMITS.phoneMax),
          address: updates.address.trim().slice(0, FIELD_LIMITS.addressMax),
          city: updates.city.trim().slice(0, FIELD_LIMITS.cityMax),
          postalCode: updates.postalCode.trim().slice(0, FIELD_LIMITS.postalMax),
          ...(order.paymentMethod ? {} : { paymentMethod: 'cod' as PaymentMethod }),
          paymentStatus: updates.paymentStatus,
          ...(updates.paymentRef?.trim()
            ? { paymentRef: updates.paymentRef.trim().slice(0, FIELD_LIMITS.paymentRefMax) }
            : {}),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${order.id}`);
      }
    },
    [isAdmin, user]
  );

  const deleteBooking = useCallback(async (orderId: string) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `orders/${orderId}`);
    }
  }, []);

  const saveMedicine = useCallback(
    async (
      data: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt' | 'isStarterFallback'>,
      existingId?: string
    ) => {
      if (!isAdmin) return;
      const docId = existingId || makeDocId('med');
      const cleanName = data.name.trim().slice(0, FIELD_LIMITS.nameMax);
      const cleanGeneric = data.genericName.trim().slice(0, FIELD_LIMITS.nameMax);
      const cleanPack = data.packSize.trim().slice(0, 60);
      const cleanDesc = data.description.trim().slice(0, FIELD_LIMITS.descriptionMax);
      if (cleanName.length < 2 || cleanGeneric.length < 2 || cleanPack.length < 1 || cleanDesc.length < 5) {
        throw new Error('Please fill in Medicine Name (min 2 chars), Generic Name (min 2 chars), Pack Size, and Description (min 5 chars).');
      }

      const payload = {
        name: cleanName,
        genericName: cleanGeneric,
        category: data.category,
        price: Math.max(1, Number(data.price) || 1),
        packSize: cleanPack,
        stock: Math.max(0, Math.round(Number(data.stock) || 0)),
        requiresPrescription: Boolean(data.requiresPrescription),
        description: cleanDesc,
        imageKey: data.imageKey,
        active: Boolean(data.active),
        updatedAt: serverTimestamp(),
      };

      try {
        const ref = doc(db, 'medicines', docId);
        const existingSnap = existingId ? await getDoc(ref) : null;
        if (existingSnap && existingSnap.exists()) {
          await updateDoc(ref, payload);
        } else {
          await setDoc(ref, {
            ...payload,
            createdAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(
          error,
          existingId ? OperationType.UPDATE : OperationType.CREATE,
          `medicines/${docId}`
        );
      }
    },
    [isAdmin]
  );

  const deleteMedicine = useCallback(
    async (id: string) => {
      if (!isAdmin) return;
      try {
        const ref = doc(db, 'medicines', id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          await deleteDoc(ref);
        } else if (allMedicinesAdmin.length === 0) {
          // Materialize remaining starter medicines to Firestore when deleting a starter item
          const remaining = STARTER_MEDICINES.filter((med) => med.id !== id);
          const remainingSnaps = await Promise.all(
            remaining.map((med) => getDoc(doc(db, 'medicines', med.id)))
          );
          const batch = writeBatch(db);
          let writeCount = 0;
          remaining.forEach((med, idx) => {
            if (!remainingSnaps[idx].exists()) {
              batch.set(doc(db, 'medicines', med.id), {
                name: med.name,
                genericName: med.genericName,
                category: med.category,
                price: med.price,
                packSize: med.packSize,
                stock: med.stock,
                requiresPrescription: med.requiresPrescription,
                description: med.description,
                imageKey: med.imageKey,
                active: med.active,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
              writeCount += 1;
            }
          });
          if (writeCount > 0) {
            await batch.commit();
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `medicines/${id}`);
      }
    },
    [allMedicinesAdmin.length, isAdmin]
  );

  const saveBlogPost = useCallback(
    async (
      data: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'isStarterFallback'>,
      existingId?: string
    ) => {
      if (!isAdmin) return;
      const docId = existingId || makeDocId('blog');
      const cleanTitle = data.title.trim().slice(0, FIELD_LIMITS.blogTitleMax);
      const cleanExcerpt = data.excerpt.trim().slice(0, FIELD_LIMITS.blogExcerptMax);
      const cleanContent = data.content.trim().slice(0, FIELD_LIMITS.blogContentMax);
      const cleanAuthor = data.authorName.trim().slice(0, 100);
      const cleanReadTime = data.readTime.trim().slice(0, 30);

      if (
        cleanTitle.length < 2 ||
        cleanExcerpt.length < 3 ||
        cleanContent.length < 5 ||
        cleanAuthor.length < 2 ||
        cleanReadTime.length < 2
      ) {
        throw new Error(
          'Please enter a Title (min 2 chars), Summary Excerpt (min 3 chars), Article Body (min 5 chars), Author Name, and Read Time.'
        );
      }

      const payload = {
        title: cleanTitle,
        category: data.category,
        excerpt: cleanExcerpt,
        content: cleanContent,
        authorName: cleanAuthor,
        readTime: cleanReadTime,
        imageKey: data.imageKey,
        published: Boolean(data.published),
        updatedAt: serverTimestamp(),
      };

      try {
        const ref = doc(db, 'blogs', docId);
        const existingSnap = existingId ? await getDoc(ref) : null;
        if (existingSnap && existingSnap.exists()) {
          await updateDoc(ref, payload);
        } else {
          await setDoc(ref, {
            ...payload,
            createdAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(
          error,
          existingId ? OperationType.UPDATE : OperationType.CREATE,
          `blogs/${docId}`
        );
      }
    },
    [isAdmin]
  );

  const deleteBlogPost = useCallback(
    async (id: string) => {
      if (!isAdmin) return;
      try {
        const ref = doc(db, 'blogs', id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          await deleteDoc(ref);
        } else if (allBlogsAdmin.length === 0) {
          // Materialize remaining starter blog posts to Firestore when deleting a starter item
          const remaining = STARTER_BLOGS.filter((post) => post.id !== id);
          const remainingSnaps = await Promise.all(
            remaining.map((post) => getDoc(doc(db, 'blogs', post.id)))
          );
          const batch = writeBatch(db);
          let writeCount = 0;
          remaining.forEach((post, idx) => {
            if (!remainingSnaps[idx].exists()) {
              batch.set(doc(db, 'blogs', post.id), {
                title: post.title,
                category: post.category,
                excerpt: post.excerpt,
                content: post.content,
                authorName: post.authorName,
                readTime: post.readTime,
                imageKey: post.imageKey,
                published: post.published,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
              writeCount += 1;
            }
          });
          if (writeCount > 0) {
            await batch.commit();
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `blogs/${id}`);
      }
    },
    [allBlogsAdmin.length, isAdmin]
  );

  const submitEnquiry = useCallback(
    async (payload: EnquiryFormPayload) => {
      if (!user || !user.emailVerified) {
        throw new Error('Please sign in with Google to submit and sync your enquiry.');
      }
      const enquiryId = makeDocId('enq');
      try {
        await setDoc(doc(db, 'enquiries', enquiryId), {
          userId: user.uid,
          name: payload.name.trim().slice(0, FIELD_LIMITS.shortTextMax),
          email: payload.email.trim().slice(0, 200),
          phone: payload.phone.trim().slice(0, FIELD_LIMITS.phoneMax),
          subject: payload.subject.trim().slice(0, FIELD_LIMITS.enquirySubjectMax),
          message: payload.message.trim().slice(0, FIELD_LIMITS.enquiryMessageMax),
          status: 'new',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `enquiries/${enquiryId}`);
      }
    },
    [user]
  );

  const updateMyEnquiry = useCallback(
    async (
      id: string,
      payload: { name: string; phone: string; subject: string; message: string }
    ) => {
      if (!user || !user.emailVerified) {
        throw new Error('Please sign in with Google to update your enquiry.');
      }
      try {
        await updateDoc(doc(db, 'enquiries', id), {
          name: payload.name.trim().slice(0, FIELD_LIMITS.shortTextMax),
          phone: payload.phone.trim().slice(0, FIELD_LIMITS.phoneMax),
          subject: payload.subject.trim().slice(0, FIELD_LIMITS.enquirySubjectMax),
          message: payload.message.trim().slice(0, FIELD_LIMITS.enquiryMessageMax),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `enquiries/${id}`);
      }
    },
    [user]
  );

  const updateEnquiry = useCallback(
    async (
      id: string,
      status: EnquiryStatus,
      adminReply: string,
      subject?: string,
      message?: string
    ) => {
      if (!isAdmin) return;
      try {
        await updateDoc(doc(db, 'enquiries', id), {
          status,
          adminReply: adminReply.trim().slice(0, FIELD_LIMITS.enquiryReplyMax),
          ...(subject !== undefined
            ? { subject: subject.trim().slice(0, FIELD_LIMITS.enquirySubjectMax) }
            : {}),
          ...(message !== undefined
            ? { message: message.trim().slice(0, FIELD_LIMITS.enquiryMessageMax) }
            : {}),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `enquiries/${id}`);
      }
    },
    [isAdmin]
  );

  const deleteEnquiry = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'enquiries', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `enquiries/${id}`);
    }
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), {
        read: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    try {
      const batch = writeBatch(db);
      for (const n of unread.slice(0, 50)) {
        batch.update(doc(db, 'notifications', n.id), {
          read: true,
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'notifications');
    }
  }, [notifications]);

  const dismissToast = useCallback(() => setToastBanner(null), []);

  const value: FirebaseContextValue = {
    user,
    authReady,
    isAdmin,
    activeRoute,
    setActiveRoute,
    medicines,
    allMedicinesAdmin:
      allMedicinesAdmin.length > 0 ? allMedicinesAdmin : STARTER_MEDICINES,
    blogs,
    allBlogsAdmin: allBlogsAdmin.length > 0 ? allBlogsAdmin : STARTER_BLOGS,
    myOrders,
    allOrders,
    myEnquiries,
    allEnquiries,
    notifications,
    unreadNotificationCount,
    cart,
    cartCount,
    cartSubtotal,
    isCartOpen,
    setIsCartOpen,
    isNotificationsOpen,
    setIsNotificationsOpen,
    selectedAdminOrderId,
    setSelectedAdminOrderId,
    toastBanner,
    dismissToast,
    signInWithGoogle,
    signOutUser,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    submitMedicineBooking,
    updateMyBooking,
    updateOrderStatus,
    updateBookingAdmin,
    deleteBooking,
    saveMedicine,
    deleteMedicine,
    saveBlogPost,
    deleteBlogPost,
    submitEnquiry,
    updateMyEnquiry,
    updateEnquiry,
    deleteEnquiry,
    markNotificationRead,
    markAllNotificationsRead,
    seedStarterCatalog,
    dataLoading,
    authError,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function usePharmacy() {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('usePharmacy must be used inside FirebaseProvider');
  }
  return ctx;
}
