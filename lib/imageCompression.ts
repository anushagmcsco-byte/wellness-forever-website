import { FIELD_LIMITS } from './types';

export interface ProcessedPrescription {
  fileName: string;
  dataUrl: string;
  sizeLabel: string;
}

export async function processPrescriptionFile(
  file: File
): Promise<ProcessedPrescription> {
  const safeName = file.name.slice(0, 180) || 'prescription-upload';
  const isPdf = file.type === 'application/pdf' || safeName.toLowerCase().endsWith('.pdf');
  const isImage = file.type.startsWith('image/');

  if (!isPdf && !isImage) {
    throw new Error('Please upload a JPG, PNG, WebP image or a PDF prescription document.');
  }

  if (isPdf) {
    if (file.size > 380 * 1024) {
      throw new Error(
        'PDF prescriptions must be under 380 KB for cloud verification. Please upload a smaller PDF or a photo/scan (JPG/PNG).'
      );
    }
    const dataUrl = await readFileAsDataUrl(file);
    if (dataUrl.length > FIELD_LIMITS.prescriptionDataMax) {
      throw new Error('Prescription file exceeds cloud storage limit. Please upload an image scan instead.');
    }
    return {
      fileName: safeName,
      dataUrl,
      sizeLabel: `${Math.max(1, Math.round(file.size / 1024))} KB PDF`,
    };
  }

  // Image: compress via canvas so it fits comfortably inside Firestore (< 350 KB)
  const rawDataUrl = await readFileAsDataUrl(file);
  const compressed = await compressImageDataUrl(rawDataUrl, 1100, 0.74);

  if (compressed.length > FIELD_LIMITS.prescriptionDataMax) {
    const strongerCompression = await compressImageDataUrl(rawDataUrl, 800, 0.56);
    if (strongerCompression.length > FIELD_LIMITS.prescriptionDataMax) {
      throw new Error('Prescription image is too large even after compression. Please choose a clearer, smaller file.');
    }
    return {
      fileName: safeName,
      dataUrl: strongerCompression,
      sizeLabel: `${Math.round((strongerCompression.length * 0.75) / 1024)} KB Image`,
    };
  }

  return {
    fileName: safeName,
    dataUrl: compressed,
    sizeLabel: `${Math.round((compressed.length * 0.75) / 1024)} KB Image`,
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read uploaded file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read prescription file.'));
    reader.readAsDataURL(file);
  });
}

function compressImageDataUrl(
  src: string,
  maxWidth: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      const targetWidth = Math.max(1, Math.round(img.width * scale));
      const targetHeight = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable for image compression.'));
        return;
      }
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Invalid image file selected.'));
    img.src = src;
  });
}
