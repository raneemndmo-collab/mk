import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import SafeImage from "./SafeImage";

/**
 * PhotoGallery — Property detail photo grid + full-screen lightbox carousel.
 *
 * Grid layout:
 *   - 1 photo: single full-width
 *   - 2 photos: 60/40 split
 *   - 3+ photos: 1 large + 2 small grid, with "Show all X photos" button
 *
 * Lightbox:
 *   - Full-screen overlay with keyboard navigation
 *   - Swipe support for mobile
 *   - Counter badge
 */

interface Photo {
  url: string;
  alt_text_en?: string | null;
  alt_text_ar?: string | null;
}

interface PhotoGalleryProps {
  photos: Photo[];
  locale: "ar" | "en";
  propertyTitle: string;
}

export default function PhotoGallery({ photos, locale, propertyTitle }: PhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
  };

  const goNext = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const goPrev = useCallback(() => {
    setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") locale === "ar" ? goPrev() : goNext();
      if (e.key === "ArrowLeft") locale === "ar" ? goNext() : goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen, goNext, goPrev, locale]);

  if (!photos || photos.length === 0) {
    return (
      <SafeImage
        src={null}
        alt={propertyTitle}
        aspectRatio="16/9"
        className="rounded-2xl"
        showBadge={false}
      />
    );
  }

  const getAlt = (photo: Photo, i: number) =>
    (locale === "ar" ? photo.alt_text_ar : photo.alt_text_en) || `${propertyTitle} - ${i + 1}`;

  return (
    <>
      {/* ── Grid Layout ── */}
      <div className="rounded-2xl overflow-hidden">
        {photos.length === 1 && (
          <div className="cursor-pointer" onClick={() => openLightbox(0)}>
            <SafeImage
              src={photos[0].url}
              alt={getAlt(photos[0], 0)}
              aspectRatio="16/9"
              showBadge={false}
            />
          </div>
        )}

        {photos.length === 2 && (
          <div className="grid grid-cols-5 gap-1 h-[300px] md:h-[400px]">
            <div className="col-span-3 cursor-pointer" onClick={() => openLightbox(0)}>
              <SafeImage
                src={photos[0].url}
                alt={getAlt(photos[0], 0)}
                aspectRatio="auto"
                className="h-full"
                showBadge={false}
              />
            </div>
            <div className="col-span-2 cursor-pointer" onClick={() => openLightbox(1)}>
              <SafeImage
                src={photos[1].url}
                alt={getAlt(photos[1], 1)}
                aspectRatio="auto"
                className="h-full"
                showBadge={false}
              />
            </div>
          </div>
        )}

        {photos.length >= 3 && (
          <div className="grid grid-cols-4 grid-rows-2 gap-1 h-[280px] md:h-[400px]">
            {/* Main large photo */}
            <div
              className="col-span-2 row-span-2 cursor-pointer relative"
              onClick={() => openLightbox(0)}
            >
              <SafeImage
                src={photos[0].url}
                alt={getAlt(photos[0], 0)}
                aspectRatio="auto"
                className="h-full"
                showBadge={false}
              />
            </div>
            {/* Top right */}
            <div className="cursor-pointer" onClick={() => openLightbox(1)}>
              <SafeImage
                src={photos[1].url}
                alt={getAlt(photos[1], 1)}
                aspectRatio="auto"
                className="h-full"
                showBadge={false}
              />
            </div>
            {/* Top far right */}
            <div className="cursor-pointer" onClick={() => openLightbox(2)}>
              <SafeImage
                src={photos[2].url}
                alt={getAlt(photos[2], 2)}
                aspectRatio="auto"
                className="h-full"
                showBadge={false}
              />
            </div>
            {/* Bottom right */}
            <div className="cursor-pointer" onClick={() => openLightbox(3)}>
              <SafeImage
                src={photos[3]?.url ?? photos[0].url}
                alt={getAlt(photos[3] ?? photos[0], 3)}
                aspectRatio="auto"
                className="h-full"
                showBadge={false}
              />
            </div>
            {/* Bottom far right — "show all" overlay */}
            <div
              className="cursor-pointer relative"
              onClick={() => openLightbox(4)}
            >
              <SafeImage
                src={photos[4]?.url ?? photos[1].url}
                alt={getAlt(photos[4] ?? photos[1], 4)}
                aspectRatio="auto"
                className="h-full"
                showBadge={false}
              />
              {photos.length > 5 && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-colors hover:bg-black/50">
                  <span className="text-white text-sm font-medium">
                    {t(`عرض الكل (${photos.length})`, `Show all (${photos.length})`)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 z-10 text-white/80 text-sm font-medium bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg">
            {lightboxIndex + 1} / {photos.length}
          </div>

          {/* Navigation arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  locale === "ar" ? goNext() : goPrev();
                }}
                className="absolute left-3 md:left-6 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  locale === "ar" ? goPrev() : goNext();
                }}
                className="absolute right-3 md:right-6 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Image */}
          <div
            className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchStart === null) return;
              const diff = e.changedTouches[0].clientX - touchStart;
              if (Math.abs(diff) > 50) {
                if (diff > 0) locale === "ar" ? goNext() : goPrev();
                else locale === "ar" ? goPrev() : goNext();
              }
              setTouchStart(null);
            }}
          >
            <img
              src={photos[lightboxIndex].url}
              alt={getAlt(photos[lightboxIndex], lightboxIndex)}
              className="max-w-full max-h-[85vh] object-contain rounded-lg select-none"
              draggable={false}
            />
          </div>

          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 max-w-[90vw] overflow-x-auto px-2 py-1.5 bg-black/40 backdrop-blur-sm rounded-lg">
              {photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(i);
                  }}
                  className={`shrink-0 w-12 h-9 rounded overflow-hidden border-2 transition-all ${
                    i === lightboxIndex
                      ? "border-white opacity-100 scale-105"
                      : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <img
                    src={photo.url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
