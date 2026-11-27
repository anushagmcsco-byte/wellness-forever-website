import type { Metadata } from 'next';
import { Fraunces, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Wellness Forever — Chemists & Lifestyle Store',
  description:
    'End-to-end digital pharmacy and lifestyle apothecary with prescription verification, online medicine booking, real-time pharmacist approvals, health editorial blog, and cross-device cloud sync.',
  openGraph: {
    title: 'Wellness Forever — Chemists & Lifestyle Store',
    description:
      'Online medicine booking, prescription verification, pharmacist approvals, health blog, and cross-device synchronization.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wellness Forever — Chemists & Lifestyle Store',
    description:
      'Online medicine booking, prescription verification, pharmacist approvals, health blog, and cross-device synchronization.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#F8FAF8] text-[#132A1E] antialiased selection:bg-[#1F5E3B] selection:text-white"
        style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}
      >
        {children}
      </body>
    </html>
  );
}
