import { useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Grid2x2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { PropertyImage } from "@/types";
import { getImageUrl } from "@/utils/format";

interface PropertyGalleryProps {
  images: PropertyImage[];
  title: string;
}

export default function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const prev = useCallback(() =>
    setLightboxIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : null)),
    [images.length]
  );
  const next = useCallback(() =>
    setLightboxIndex((i) => (i !== null ? (i + 1) % images.length : null)),
    [images.length]
  );

  const onKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft")  prev();
    if (e.key === "ArrowRight") next();
    if (e.key === "Escape")     setLightboxIndex(null);
  }, [prev, next]);

  if (images.length === 0) {
    return (
      <div
        className="aspect-video rounded-[20px] flex items-center justify-center"
        style={{ background: "#F0F0F2" }}
      >
        <span className="text-[14px]" style={{ color: "#AEAEB2" }}>Фотографии не добавлены</span>
      </div>
    );
  }

  const shown = images.slice(0, 5);
  const remaining = images.length - 5;

  return (
    <>
      {/* ── Grid: 1 big + up to 4 small ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5 rounded-[20px] overflow-hidden" style={{ maxHeight: "520px" }}>
        {/* Main photo */}
        <div
          className="relative cursor-pointer overflow-hidden"
          style={{ background: "#1A1A1A", aspectRatio: "4/3" }}
          onClick={() => setLightboxIndex(0)}
        >
          <img
            src={getImageUrl(shown[0].image_path)}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.03]"
          />
        </div>

        {/* 4 small thumbnails */}
        {shown.length > 1 && (
          <div className="grid grid-cols-2 gap-1.5">
            {shown.slice(1, 5).map((img, i) => (
              <div
                key={img.id}
                className="relative cursor-pointer overflow-hidden"
                style={{ background: "#1A1A1A", aspectRatio: "4/3" }}
                onClick={() => setLightboxIndex(i + 1)}
              >
                <img
                  src={getImageUrl(img.image_path)}
                  alt={`${title} ${i + 2}`}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                />
                {/* Last thumb — show "+N" overlay if more photos */}
                {i === 3 && remaining > 0 && (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer"
                    style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
                  >
                    <Grid2x2 size={22} className="text-white/70" />
                    <span className="text-white font-bold text-[22px]" style={{ letterSpacing: "-0.02em" }}>
                      +{remaining}
                    </span>
                    <span className="text-white/60 text-[12px]">фото</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* "All photos" button if more than 5 */}
      {remaining > 0 && (
        <button
          onClick={() => setLightboxIndex(0)}
          className="mt-3 inline-flex items-center gap-2 text-[13px] font-medium transition-colors"
          style={{ color: "#666" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#111")}
          onMouseLeave={e => (e.currentTarget.style.color = "#666")}
        >
          <Grid2x2 size={14} />
          Все {images.length} фото
        </button>
      )}

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.94)" }}
            onClick={() => setLightboxIndex(null)}
            onKeyDown={onKey}
            tabIndex={0}
          >
            {/* Close */}
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
              className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
            >
              <X size={20} />
            </button>

            {/* Prev */}
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
            >
              <ChevronLeft size={24} />
            </button>

            {/* Image */}
            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.18 }}
              src={getImageUrl(images[lightboxIndex].image_path)}
              alt={`${title} ${lightboxIndex + 1}`}
              className="max-h-[85vh] max-w-[88vw] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
              style={{ boxShadow: "0 8px 48px rgba(0,0,0,0.6)" }}
            />

            {/* Next */}
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
            >
              <ChevronRight size={24} />
            </button>

            {/* Counter + strip */}
            <div className="absolute bottom-0 left-0 right-0 pb-5 flex flex-col items-center gap-3">
              <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                {lightboxIndex + 1} / {images.length}
              </p>
              {/* Thumbnail strip */}
              <div className="flex gap-1.5 overflow-x-auto max-w-[90vw] px-4">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                    className="flex-shrink-0 w-12 h-9 rounded overflow-hidden transition-all"
                    style={{
                      opacity: i === lightboxIndex ? 1 : 0.45,
                      outline: i === lightboxIndex ? "2px solid #E31E24" : "none",
                      outlineOffset: "1px",
                    }}
                  >
                    <img src={getImageUrl(img.image_path)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
