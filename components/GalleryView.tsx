'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ExternalLink,
  Film,
  Images,
  MapPin,
  Pause,
  Phone,
  Play,
  RotateCcw,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  DHARWAD_GALLERY_PHOTOS,
  type GalleryPhotoItem,
} from '@/lib/assets';
import { BRANCH_INFO } from '@/lib/branchInfo';

interface TourVideoSpec {
  id: string;
  title: string;
  subtitle: string;
  durationSeconds: number;
  scenes: {
    label: string;
    caption: string;
    imageSrc: string;
  }[];
}

const TOUR_VIDEOS: TourVideoSpec[] = [
  {
    id: 'tour-dharwad-branch',
    title: 'Wellness Forever Hosayallapur, Dharwad — Storefront & Aisles Tour',
    subtitle: 'Suvidha Matoshree Lifestyle Mall exterior, OTC aisles, and Lifestyle Wing',
    durationSeconds: 18,
    scenes: [
      {
        label: '01 · Exterior Storefront',
        caption: 'Suvidha Matoshree Lifestyle Mall, Hosayellapur, Dharwad',
        imageSrc: DHARWAD_GALLERY_PHOTOS[0].image.src,
      },
      {
        label: '02 · Organized Aisles',
        caption: 'OTC pain care, baby care & nutrition shelves',
        imageSrc: DHARWAD_GALLERY_PHOTOS[1].image.src,
      },
      {
        label: '03 · Derma & Lifestyle Wing',
        caption: 'Dermatological skincare & daily wellness supplements',
        imageSrc: DHARWAD_GALLERY_PHOTOS[3].image.src,
      },
    ],
  },
  {
    id: 'tour-rx-verification',
    title: 'Inside the 24/7 Prescription Verification & Counseling Desk',
    subtitle: 'Step-by-step look at pharmacist review and safe home dispensing',
    durationSeconds: 18,
    scenes: [
      {
        label: '01 · Prescription Desk',
        caption: 'Licensed pharmacists reviewing digital Rx uploads',
        imageSrc: DHARWAD_GALLERY_PHOTOS[2].image.src,
      },
      {
        label: '02 · Clinical Apothecary',
        caption: 'Temperature-controlled dispensary & apothecary counter',
        imageSrc: DHARWAD_GALLERY_PHOTOS[4].image.src,
      },
      {
        label: '03 · Patient Counseling',
        caption: 'Personal dosage guidance & medication safety check',
        imageSrc: DHARWAD_GALLERY_PHOTOS[5].image.src,
      },
    ],
  },
];

function StoreWalkthroughPlayer({ spec }: { spec: TourVideoSpec }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedImagesRef = useRef<HTMLImageElement[]>([]);
  const progressRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [imagesReady, setImagesReady] = useState(false);

  // Preload static image assets for smooth canvas video playback
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      spec.scenes.map(
        (scene) =>
          new Promise<HTMLImageElement>((resolve) => {
            const img = new window.Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(img);
            img.src = scene.imageSrc;
          })
      )
    ).then((imgs) => {
      if (!cancelled) {
        loadedImagesRef.current = imgs;
        setImagesReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [spec.scenes]);

  // Draw frame to canvas whenever progress or image readiness changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const totalScenes = spec.scenes.length;
    if (
      !canvas ||
      !imagesReady ||
      totalScenes === 0 ||
      loadedImagesRef.current.length === 0
    ) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const safeProgress = Number.isFinite(progress)
      ? Math.max(0, Math.min(1, progress))
      : 0;
    const scaled = Math.min(totalScenes - 0.0001, safeProgress * totalScenes);
    const sceneIdx = Math.max(0, Math.min(totalScenes - 1, Math.floor(scaled)));
    const sceneProgress = Math.max(0, Math.min(1, scaled - sceneIdx));

    const activeScene = spec.scenes[sceneIdx];
    if (!activeScene) return;

    const img = loadedImagesRef.current[sceneIdx];
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#0E2417';
    ctx.fillRect(0, 0, w, h);

    if (img && img.naturalWidth > 0) {
      // Smooth Ken Burns zoom & pan
      const zoom = 1 + sceneProgress * 0.08;
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = w / h;

      let drawW = w * zoom;
      let drawH = h * zoom;
      if (imgAspect > canvasAspect) {
        drawH = h * zoom;
        drawW = drawH * imgAspect;
      } else {
        drawW = w * zoom;
        drawH = drawW / imgAspect;
      }
      const offsetX = (w - drawW) / 2 - sceneProgress * 12;
      const offsetY = (h - drawH) / 2;
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
    }

    // Bottom measured scrim + scene label
    const grad = ctx.createLinearGradient(0, h * 0.58, 0, h);
    grad.addColorStop(0, 'rgba(14, 36, 23, 0)');
    grad.addColorStop(1, 'rgba(14, 36, 23, 0.88)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, h * 0.58, w, h * 0.42);

    ctx.fillStyle = '#D9E021';
    ctx.font = '600 13px sans-serif';
    ctx.fillText(activeScene.label, 22, h - 42);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '500 15px sans-serif';
    ctx.fillText(activeScene.caption, 22, h - 20);
  }, [progress, imagesReady, spec.scenes]);

  // Playback loop (guarded against negative RAF frame timestamp deltas)
  useEffect(() => {
    if (!isPlaying) return;
    let rafId = 0;
    let lastTime: number | null = null;

    const tick = (now: number) => {
      if (lastTime === null) {
        lastTime = now;
      }
      const dt = Math.max(0, (now - lastTime) / 1000);
      lastTime = now;

      const next = Math.min(
        1,
        progressRef.current + dt / Math.max(1, spec.durationSeconds)
      );
      progressRef.current = next;
      setProgress(next);

      if (next >= 1) {
        setIsPlaying(false);
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, spec.durationSeconds]);

  const currentSec = Math.round(
    Math.max(0, Math.min(1, progress)) * spec.durationSeconds
  );

  return (
    <div className="bg-white border border-[#DCE5DF] rounded-2xl overflow-hidden flex flex-col">
      <div className="relative aspect-video bg-[#0E2417]">
        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          className="w-full h-full block"
        />
        {!isPlaying && progress === 0 && (
          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            aria-label={`Play ${spec.title}`}
            className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/35 transition-colors cursor-pointer"
          >
            <span className="w-14 h-14 rounded-full bg-[#1F5E3B] text-white border-2 border-[#D9E021] flex items-center justify-center shadow-lg">
              <Play className="w-6 h-6 ml-0.5" />
            </span>
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#132A1E]">
              {spec.title}
            </h3>
            <p className="text-xs text-[#4E6157] mt-0.5">{spec.subtitle}</p>
          </div>
          <span className="font-mono text-xs tabular-nums text-[#4E6157] shrink-0">
            0:{String(currentSec).padStart(2, '0')} / 0:
            {String(spec.durationSeconds).padStart(2, '0')}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (progressRef.current >= 1) {
                progressRef.current = 0;
                setProgress(0);
              }
              setIsPlaying((p) => !p);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1F5E3B] text-white text-xs font-semibold hover:bg-[#17482D] cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>{progress >= 1 ? 'Replay' : 'Play Tour'}</span>
              </>
            )}
          </button>

          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(Math.max(0, Math.min(1, progress)) * 100)}
            onChange={(e) => {
              setIsPlaying(false);
              const nextVal = Math.max(0, Math.min(1, Number(e.target.value) / 100));
              progressRef.current = nextVal;
              setProgress(nextVal);
            }}
            aria-label="Scrub video timeline"
            className="flex-1 accent-[#1F5E3B] cursor-pointer"
          />

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              progressRef.current = 0;
              setProgress(0);
            }}
            aria-label="Restart tour"
            className="p-1.5 rounded-lg border border-[#DCE5DF] text-[#4E6157] hover:bg-[#F1F5F2] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GalleryView() {
  const [filter, setFilter] = useState<'All' | GalleryPhotoItem['category']>('All');
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhotoItem | null>(null);

  const filteredPhotos =
    filter === 'All'
      ? DHARWAD_GALLERY_PHOTOS
      : DHARWAD_GALLERY_PHOTOS.filter((p) => p.category === filter);

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header & Dharwad Branch Card */}
      <div className="bg-white border border-[#DCE5DF] rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-medium text-[#1F5E3B]">
            Store Showcase · Photos &amp; Virtual Tour Videos
          </p>
          <h1
            className="text-3xl font-semibold text-[#132A1E]"
            style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
          >
            {BRANCH_INFO.branchName}
          </h1>
          <p className="text-sm text-[#4E6157] flex items-start gap-2 leading-relaxed">
            <MapPin className="w-4 h-4 text-[#1F5E3B] shrink-0 mt-0.5" />
            <span>{BRANCH_INFO.address}</span>
          </p>
          <p className="text-sm font-mono font-semibold text-[#1F5E3B] flex items-center gap-2">
            <Phone className="w-4 h-4 shrink-0" />
            <a href={BRANCH_INFO.phoneHref} className="hover:underline">
              {BRANCH_INFO.phoneDisplay}
            </a>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <a
            href={BRANCH_INFO.googleSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1F5E3B] text-white text-xs font-semibold hover:bg-[#17482D] whitespace-nowrap"
          >
            <span>Google Search Listing</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href={BRANCH_INFO.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#DCE5DF] bg-[#F8FAF8] text-[#132A1E] text-xs font-semibold hover:bg-[#EDF2EE] whitespace-nowrap"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#1F5E3B]" />
          </a>
        </div>
      </div>

      {/* Store Video Tours Section */}
      <section className="space-y-5">
        <div className="flex items-center gap-2.5 border-b border-[#DCE5DF] pb-4">
          <Film className="w-5 h-5 text-[#1F5E3B]" />
          <div>
            <h2
              className="text-2xl font-semibold text-[#132A1E]"
              style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
            >
              Store Walkthrough Videos
            </h2>
            <p className="text-xs text-[#4E6157]">
              Interactive video tours of our Hosayallapur, Dharwad pharmacy and prescription counter
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {TOUR_VIDEOS.map((vid) => (
            <StoreWalkthroughPlayer key={vid.id} spec={vid} />
          ))}
        </div>
      </section>

      {/* Store Photos Grid */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#DCE5DF] pb-4">
          <div className="flex items-center gap-2.5">
            <Images className="w-5 h-5 text-[#1F5E3B]" />
            <div>
              <h2
                className="text-2xl font-semibold text-[#132A1E]"
                style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
              >
                Pharmacy Photo Gallery
              </h2>
              <p className="text-xs text-[#4E6157]">
                Click any photo to inspect in full resolution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#EDF2EE] rounded-lg overflow-x-auto max-w-full min-w-0">
            {(
              [
                'All',
                'Storefront',
                'Dispensary',
                'Wellness Aisles',
                'Lifestyle & Derma',
              ] as const
            ).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filter === cat
                    ? 'bg-white text-[#1F5E3B] shadow-sm font-semibold'
                    : 'text-[#4E6157] hover:text-[#132A1E]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((photo) => (
            <article
              key={photo.id}
              className="bg-white border border-[#DCE5DF] rounded-2xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <button
                type="button"
                onClick={() => setLightboxPhoto(photo)}
                className="relative aspect-[4/3] w-full bg-[#F1F5F2] overflow-hidden cursor-pointer"
              >
                <Image
                  src={photo.image}
                  alt={photo.title}
                  fill
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
              </button>
              <div className="p-5 space-y-1.5">
                <p className="text-xs text-[#4E6157]">
                  <span className="font-medium text-[#1F5E3B]">
                    {photo.category}
                  </span>{' '}
                  · {photo.locationLabel}
                </p>
                <h3 className="text-base font-semibold text-[#132A1E]">
                  {photo.title}
                </h3>
                <p className="text-xs text-[#4E6157] leading-relaxed">
                  {photo.caption}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxPhoto(null)}
              className="fixed inset-0 bg-[#0E2417]/75 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="relative z-10 max-w-4xl w-full bg-white border border-[#DCE5DF] rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="px-5 py-3.5 border-b border-[#DCE5DF] flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#132A1E]">
                    {lightboxPhoto.title}
                  </h3>
                  <p className="text-xs text-[#4E6157]">
                    {lightboxPhoto.locationLabel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLightboxPhoto(null)}
                  aria-label="Close photo preview"
                  className="w-8 h-8 rounded-lg border border-[#DCE5DF] flex items-center justify-center text-[#4E6157] hover:bg-[#F1F5F2] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="relative aspect-[16/10] w-full bg-[#0E2417]">
                <Image
                  src={lightboxPhoto.image}
                  alt={lightboxPhoto.title}
                  fill
                  referrerPolicy="no-referrer"
                  className="object-contain"
                />
              </div>
              <div className="px-5 py-3 bg-[#F8FAF8] text-xs text-[#4E6157]">
                {lightboxPhoto.caption}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
