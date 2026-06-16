import { Link } from "react-router-dom";
import { MapPin, Maximize2, Layers } from "lucide-react";
import { motion } from "framer-motion";
import type { Property } from "@/types";
import { PROPERTY_TYPE_LABELS } from "@/types";
import { formatPrice, formatArea, getImageUrl, pluralRooms } from "@/utils/format";

interface Props {
  property: Property;
  variant?: "default" | "featured";
}

export default function PropertyCard({ property, variant = "default" }: Props) {
  const img = property.images[0];
  const isFeatured = variant === "featured";

  return (
    <Link
      to={`/property/${property.slug}`}
      className="group block"
    >
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden"
        style={{
          borderRadius: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.08)",
        }}
      >
        {/* Image — portrait ratio */}
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
                <span className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.15)" }}>РР</span>
              </div>
              <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.2)" }}>Фото скоро</span>
            </div>
          )}

          {/* Full-image dark gradient overlay */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.72) 100%)" }}
          />

          {/* Property type badge — top left */}
          <div
            className="absolute top-4 left-4 px-2.5 py-1 rounded-full"
            style={{
              background: "rgba(227,30,36,0.55)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <span className="text-[11px] font-semibold text-white" style={{ letterSpacing: "0.04em" }}>
              {PROPERTY_TYPE_LABELS[property.property_type]}
              {property.rooms ? ` · ${pluralRooms(property.rooms)}` : ""}
            </span>
          </div>

          {/* Photo count — top right */}
          {property.images.length > 1 && (
            <div
              className="absolute top-4 right-4 px-2.5 py-1 rounded-full"
              style={{
                background: "rgba(0,0,0,0.4)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <span className="text-[11px] font-medium text-white/80">
                {property.images.length} фото
              </span>
            </div>
          )}

          {/* Bottom info — overlaid on image */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            {/* Price */}
            <p
              className="font-bold text-white mb-1.5"
              style={{ fontSize: "22px", letterSpacing: "-0.025em", lineHeight: 1, textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
            >
              {formatPrice(property.price)}
            </p>

            {/* Title */}
            <p
              className="font-medium text-white/90 line-clamp-1 mb-3"
              style={{ fontSize: "14px", lineHeight: 1.3 }}
            >
              {property.title}
            </p>

            {/* Location + area row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                <MapPin size={12} strokeWidth={1.8} />
                <span className="text-[12px] truncate max-w-[120px]">{property.district}</span>
              </div>
              <div className="flex items-center gap-3" style={{ color: "rgba(255,255,255,0.5)" }}>
                <span className="flex items-center gap-1 text-[12px]">
                  <Maximize2 size={11} strokeWidth={1.8} />
                  {formatArea(property.area)}
                </span>
                {property.floor && property.total_floors && (
                  <span className="flex items-center gap-1 text-[12px]">
                    <Layers size={11} strokeWidth={1.8} />
                    {property.floor}/{property.total_floors}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
