import type { StaticImageData } from 'next/image';
import logoHqImg from '@/src/assets/images/wellness_forever_logo_tight.png';
import heroPharmacyImg from '@/src/assets/images/hero_pharmacy_apothecary_1795762279897.jpg';
import prescriptionCareImg from '@/src/assets/images/product_prescription_care_1795762280799.jpg';
import vitaminsSupplementsImg from '@/src/assets/images/product_vitamins_supplements_1795762281588.jpg';
import dermaSkincareImg from '@/src/assets/images/product_derma_skincare_1795762281805.jpg';
import pharmacistBlogImg from '@/src/assets/images/blog_pharmacist_consultation_1795762281740.jpg';
import storefrontDharwadBgImg from '@/src/assets/images/storefront_dharwad_bg_1795762918858.jpg';
import dharwadAislesImg from '@/src/assets/images/gallery_dharwad_interior_aisles_1795762919110.jpg';
import dharwadRxCounterImg from '@/src/assets/images/gallery_dharwad_rx_counter_1795762919300.jpg';
import dharwadLifestyleImg from '@/src/assets/images/gallery_dharwad_lifestyle_corner_1795762920678.jpg';
import type { BlogImageKey, MedicineImageKey } from './types';

export const BRAND_LOGO_HQ = logoHqImg;
export const HERO_PHARMACY_IMAGE = heroPharmacyImg;
export const STOREFRONT_DHARWAD_BG = storefrontDharwadBgImg;

export const MEDICINE_IMAGES: Record<MedicineImageKey, StaticImageData> = {
  prescription: prescriptionCareImg,
  vitamins: vitaminsSupplementsImg,
  derma: dermaSkincareImg,
};

export const BLOG_IMAGES: Record<BlogImageKey, StaticImageData> = {
  pharmacist: pharmacistBlogImg,
  vitamins: vitaminsSupplementsImg,
  derma: dermaSkincareImg,
  prescription: prescriptionCareImg,
};

export interface GalleryPhotoItem {
  id: string;
  title: string;
  caption: string;
  category: 'Storefront' | 'Dispensary' | 'Wellness Aisles' | 'Lifestyle & Derma';
  image: StaticImageData;
  locationLabel: string;
}

export const DHARWAD_GALLERY_PHOTOS: GalleryPhotoItem[] = [
  {
    id: 'gal-storefront',
    title: 'Hosayallapur Flagship Storefront',
    caption:
      'Main entrance at Suvidha Matoshree Lifestyle Mall, Line Bazar Road, Hosayellapur, Dharwad.',
    category: 'Storefront',
    image: storefrontDharwadBgImg,
    locationLabel: 'Suvidha Matoshree Mall · G-4 & G-5',
  },
  {
    id: 'gal-aisles',
    title: 'Organized Pharmacy & OTC Aisles',
    caption:
      'Bright, climate-controlled aisles stocked with OTC pain care, baby essentials, and daily nutrition.',
    category: 'Wellness Aisles',
    image: dharwadAislesImg,
    locationLabel: 'Hosayellapur Branch · Floor G-4',
  },
  {
    id: 'gal-rx-desk',
    title: 'Licensed Pharmacist Verification Desk',
    caption:
      'Registered pharmacists verifying digital & uploaded prescriptions before every medicine dispatch.',
    category: 'Dispensary',
    image: dharwadRxCounterImg,
    locationLabel: '24/7 Rx Verification Counter',
  },
  {
    id: 'gal-lifestyle',
    title: 'Derma Care & Lifestyle Supplements',
    caption:
      'Curated dermatologist-tested skincare, ceramide moisturizers, and daily vitamin formulations.',
    category: 'Lifestyle & Derma',
    image: dharwadLifestyleImg,
    locationLabel: 'Lifestyle Wing · G-5',
  },
  {
    id: 'gal-apothecary',
    title: 'Main Dispensing & Apothecary Lounge',
    caption:
      'Warm travertine dispensing counter combining clinical precision with lifestyle wellness care.',
    category: 'Dispensary',
    image: heroPharmacyImg,
    locationLabel: 'Main Consultation Counter',
  },
  {
    id: 'gal-consultation',
    title: 'Personal Medication Counseling',
    caption:
      'One-on-one pharmacist consultations on dosage timing, drug interactions, and preventive health.',
    category: 'Dispensary',
    image: pharmacistBlogImg,
    locationLabel: 'Patient Advisory Desk',
  },
];
