import type { Timestamp } from 'firebase/firestore';

export type MedicineCategory =
  | 'Prescription Rx'
  | 'OTC & Pain Care'
  | 'Vitamins & Immunity'
  | 'Derma & Lifestyle';

export type MedicineImageKey = 'prescription' | 'vitamins' | 'derma';

export type OrderStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'dispatched';

export type PaymentMethod = 'upi' | 'card' | 'cod';

export type PaymentStatus =
  | 'paid_on_booking'
  | 'pay_on_delivery'
  | 'pending_verification';

export type BlogCategory =
  | 'Preventive Care'
  | 'Medication Safety'
  | 'Nutrition & Immunity'
  | 'Skin & Wellness';

export type BlogImageKey = 'pharmacist' | 'vitamins' | 'derma' | 'prescription';

export type EnquiryStatus = 'new' | 'in_review' | 'resolved';

export const MEDICINE_CATEGORIES: MedicineCategory[] = [
  'Prescription Rx',
  'OTC & Pain Care',
  'Vitamins & Immunity',
  'Derma & Lifestyle',
];

export const BLOG_CATEGORIES: BlogCategory[] = [
  'Preventive Care',
  'Medication Safety',
  'Nutrition & Immunity',
  'Skin & Wellness',
];

// Blueprint validation limits synchronized with firebase-blueprint.json & firestore.rules
export const FIELD_LIMITS = {
  idMax: 128,
  nameMin: 2,
  nameMax: 140,
  shortTextMax: 120,
  phoneMin: 6,
  phoneMax: 30,
  addressMin: 5,
  addressMax: 300,
  cityMin: 2,
  cityMax: 100,
  postalMin: 3,
  postalMax: 20,
  prescriptionDataMax: 550000,
  descriptionMax: 1000,
  adminNotesMax: 500,
  paymentRefMax: 80,
  blogTitleMax: 180,
  blogExcerptMax: 400,
  blogContentMax: 12000,
  enquirySubjectMax: 160,
  enquiryMessageMax: 2000,
  enquiryReplyMax: 1000,
  maxOrderItems: 25,
};

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: MedicineCategory;
  price: number;
  packSize: string;
  stock: number;
  requiresPrescription: boolean;
  description: string;
  imageKey: MedicineImageKey;
  active: boolean;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  isStarterFallback?: boolean;
}

export interface CartItem {
  medicineId: string;
  name: string;
  genericName: string;
  price: number;
  packSize: string;
  quantity: number;
  requiresPrescription: boolean;
  imageKey: MedicineImageKey;
}

export interface OrderItem {
  medicineId: string;
  name: string;
  price: number;
  packSize: string;
  quantity: number;
  requiresPrescription: boolean;
}

export interface MedicineOrder {
  id: string;
  userId: string;
  userEmail: string;
  patientName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  doctorName: string;
  prescriptionDate: string;
  prescriptionFileName: string;
  prescriptionDataUrl: string;
  hasPrescriptionItems: boolean;
  items: OrderItem[];
  itemCount: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentRef?: string;
  adminNotes?: string;
  reviewedBy?: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface AppNotification {
  id: string;
  recipientUid: string;
  targetRole: 'admin' | 'customer';
  title: string;
  message: string;
  orderId: string;
  read: boolean;
  createdByUid: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface BlogPost {
  id: string;
  title: string;
  category: BlogCategory;
  excerpt: string;
  content: string;
  authorName: string;
  readTime: string;
  imageKey: BlogImageKey;
  published: boolean;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  isStarterFallback?: boolean;
}

export interface ContactEnquiry {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: EnquiryStatus;
  adminReply?: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}
