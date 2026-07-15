import { Link } from "react-router-dom";
import { Heart, Layers, MapPin, Maximize2 } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Property } from "@/types";
import { PROPERTY_BADGE_LABELS, PROPERTY_TYPE_LABELS } from "@/types";
import { formatArea, formatPrice, getImageUrl, pluralRooms } from "@/utils/format";
import { isFavorite, toggleFavorite } from "@/utils/favorites";

interface Props {
  property: Property;
  variant?: "default" | "featured";
}

export default function PropertyCard({ property, variant = "default" }: Props) {
  const img = property.images[0];
  const isFeatured = variant === "featured";
  const [favorite, setFavorite] = useState(() => isFavorite(property.id));

  useEffect(() => {
    const sync = () => setFavorite(isFavorite(property.id));
    window.addEventListener("favorites-updated", sync);
    return () => window.removeEventListener("favorites-updated", sync);
  }, [property.id]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setFavorite(toggleFavorite(property.id));
        }}
        aria-label={favorite ? "Убрать из избранного" : "Добавить в избранное"}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
        style={{
          background: favorite ? "rgba(162,13,15,0.94)" : "rgba(0,0,0,0.42)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          color: "#fff",
          boxShadow: favorite ? "0 6px 18px rgba(162,13,15,0.3)" : "none",
        }}
      >
        <Heart size={16} fill={favorite ? "currentColor" : "none"} strokeWidth={2} />
      </button>

      <Link to={`/property/${property.slug}`} className="group block">
        <motion.div
          whileHover={{ y: -6 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden"
          style={{
            borderRadius: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.08)",
          }}
        >
          <div
            className="relative overflow-hidden"
            style={{ aspectRatio: isFeatured ? "3/4" : "4/5", background: "#1A1A1A" }}
          >
            {img ? (
              <img
                src={getImageUrl(img.image_path)}
                alt={property.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              />
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center gap-3"
                style={{ background: "linear-gradient(160deg, #1A1A1A, #111)" }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <span className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.15)" }}>RR</span>
                </div>
                <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.2)" }}>Фото скоро</span>
              </div>
            )}

            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.72) 100%)" }}
            />

            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex flex-col items-start gap-1.5 max-w-[72%]">
              <div
                className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full"
                style={{
                  background: "rgba(162,13,15,0.55)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }}
              >
                <span className="text-[10px] sm:text-[11px] font-semibold text-white" style={{ letterSpacing: "0.04em" }}>
                  {PROPERTY_TYPE_LABELS[property.property_type]}
                  {property.rooms ? ` · ${pluralRooms(property.rooms)}` : ""}
                </span>
              </div>

              {(property.badges ?? []).map((badge) => (
                <span
                  key={badge}
                  className="px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold text-white"
                  style={{
                    background:
                      badge === "urgent"
                        ? "rgba(185, 28, 28, 0.84)"
                        : badge === "price_reduced"
                          ? "rgba(22, 163, 74, 0.84)"
                          : badge === "new"
                            ? "rgba(37, 99, 235, 0.82)"
                            : "rgba(17,17,17,0.58)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                >
                  {PROPERTY_BADGE_LABELS[badge as keyof typeof PROPERTY_BADGE_LABELS] ?? badge}
                </span>
              ))}
            </div>

            {property.images.length > 1 && (
              <div
                className="absolute top-12 right-2 sm:top-16 sm:right-4 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full"
                style={{
                  background: "rgba(0,0,0,0.4)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
              >
                <span className="text-[10px] sm:text-[11px] font-medium text-white/80">
                  {property.images.length} фото
                </span>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5">
              <p
                className="font-bold text-white mb-1"
                style={{ fontSize: "clamp(14px, 4vw, 22px)", letterSpacing: "-0.025em", lineHeight: 1, textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
              >
                {formatPrice(property.price)}
              </p>

              <p
                className="font-medium text-white/90 line-clamp-1 mb-2"
                style={{ fontSize: "clamp(11px, 2.5vw, 14px)", lineHeight: 1.3 }}
              >
                {property.title}
              </p>

              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-0.5 min-w-0" style={{ color: "rgba(255,255,255,0.75)" }}>
                  <MapPin size={11} strokeWidth={1.8} className="flex-shrink-0" />
                  <span className="text-[11px] sm:text-[13px] truncate">{property.district}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.65)" }}>
                  <span className="flex items-center gap-0.5 text-[11px] sm:text-[13px]">
                    <Maximize2 size={10} strokeWidth={1.8} />
                    {formatArea(property.area)}
                  </span>
                  {["house", "townhouse", "land"].includes(property.property_type)
                    ? property.total_floors && (
                      <span className="flex items-center gap-0.5 text-[11px] sm:text-[13px] whitespace-nowrap">
                        <Layers size={10} strokeWidth={1.8} />
                        {property.total_floors} эт.
                      </span>
                    )
                    : property.floor && property.total_floors && (
                      <span className="flex items-center gap-0.5 text-[11px] sm:text-[13px] whitespace-nowrap">
                        <Layers size={10} strokeWidth={1.8} />
                        {property.floor}/{property.total_floors}
                      </span>
                    )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </div>
  );
}
