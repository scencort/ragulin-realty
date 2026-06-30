import { lazy, Suspense } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  MapPin, ChevronRight, Star,
  Phone, ArrowLeft,
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import SEOMeta from "@/components/ui/SEOMeta";
import PropertyGallery from "@/components/property/PropertyGallery";
import { PageLoader } from "@/components/ui/Loader";
import { propertiesApi } from "@/api/properties";
import { PROPERTY_TYPE_LABELS } from "@/types";
import { formatPrice, formatPriceFull, formatArea, pluralRooms } from "@/utils/format";

const PropertyMap = lazy(() => import("@/components/property/PropertyMap"));

export default function PropertyDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: property, isLoading, isError } = useQuery({
    queryKey: ["property", slug],
    queryFn: () => propertiesApi.getBySlug(slug!),
    enabled: !!slug,
  });

  if (isLoading) return <Layout><PageLoader /></Layout>;
  if (isError || !property) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <h1 className="font-bold mb-4" style={{ fontSize: "28px", color: "var(--ink)" }}>Объект не найден</h1>
          <Link to="/catalog" className="btn-primary">← Вернуться в каталог</Link>
        </div>
      </Layout>
    );
  }

  const pricePerM2 = property.area
    ? Math.round(Number(property.price) / Number(property.area)).toLocaleString("ru-RU")
    : null;

  const waText = encodeURIComponent(
    `Здравствуйте, Роман! Интересует объект: ${property.title}. ${typeof window !== "undefined" ? window.location.href : ""}`
  );

  return (
    <Layout>
      <SEOMeta
        title={property.title}
        description={`${PROPERTY_TYPE_LABELS[property.property_type]} ${property.area} м² в ${property.district}. ${formatPrice(property.price)}`}
      />

      {/* Breadcrumb */}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <div className="container py-3">
          <nav className="flex items-center gap-1.5 text-[13px]" style={{ color: "var(--ink-4)" }}>
            <Link to="/" className="transition-colors hover:text-[var(--ink)]">Главная</Link>
            <ChevronRight size={12} />
            <Link to="/catalog" className="transition-colors hover:text-[var(--ink)]">Объекты</Link>
            <ChevronRight size={12} />
            <span className="truncate max-w-[240px]" style={{ color: "var(--ink-2)" }}>{property.title}</span>
          </nav>
        </div>
      </div>

      <div className="container py-10 lg:py-14">

        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-[14px] font-semibold transition-all duration-200 hover:-translate-x-0.5"
          style={{ background: "var(--surface-3)", color: "var(--ink-2)" }}
        >
          <ArrowLeft size={15} />
          Вернуться к каталогу
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span
              className="text-[11px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full"
              style={{ background: "rgba(227,30,36,0.1)", color: "#a20d0f" }}
            >
              {PROPERTY_TYPE_LABELS[property.property_type]}
            </span>
            {property.is_featured === 1 && (
              <span
                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "var(--ink)", color: "var(--bg)" }}
              >
                <Star size={10} fill="currentColor" stroke="none" />
                Эксклюзив
              </span>
            )}
          </div>
          <h1
            className="font-bold mb-3"
            style={{ fontSize: "clamp(22px, 3.5vw, 40px)", color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: 1.2 }}
          >
            {property.title}
          </h1>
          <div className="flex items-center gap-1.5" style={{ color: "var(--ink-3)" }}>
            <MapPin size={14} strokeWidth={1.8} />
            <span style={{ fontSize: "15px" }}>{property.address}</span>
          </div>
        </motion.div>

        {/* Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <PropertyGallery images={property.images} title={property.title} />
        </motion.div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">

          {/* Left — details */}
          <div className="lg:col-span-2 space-y-10">

            {/* Key stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Цена", value: formatPriceFull(property.price), accent: true },
                { label: "Площадь", value: formatArea(property.area) },
                property.rooms ? { label: "Комнат", value: pluralRooms(property.rooms) } : null,
                property.floor && property.total_floors
                  ? { label: "Этаж", value: `${property.floor} из ${property.total_floors}` }
                  : null,
              ].filter((s): s is { label: string; value: string; accent?: boolean } => Boolean(s)).map((s) => (
                <div
                  key={s.label}
                  className="p-5 rounded-[16px]"
                  style={{
                    background: s.accent ? "linear-gradient(135deg, #a20d0f, #C41A20)" : "var(--bg-2)",
                    boxShadow: s.accent ? "0 4px 20px rgba(227,30,36,0.25)" : "none",
                  }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5"
                     style={{ color: s.accent ? "rgba(255,255,255,0.7)" : "var(--ink-4)" }}>
                    {s.label}
                  </p>
                  <p className="font-bold" style={{ fontSize: "17px", color: s.accent ? "#fff" : "var(--ink)", letterSpacing: "-0.015em" }}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Characteristic table */}
            <div className="rounded-[20px] overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              {[
                property.district && { label: "Район", value: property.district },
                property.address  && { label: "Адрес", value: property.address },
                property.rooms    && { label: "Комнат", value: String(property.rooms) },
                property.area     && { label: "Общая площадь", value: formatArea(Number(property.area)) },
                property.floor && property.total_floors && { label: "Этаж", value: `${property.floor} из ${property.total_floors}` },
                { label: "Тип", value: PROPERTY_TYPE_LABELS[property.property_type] },
                pricePerM2 && { label: "Цена за м²", value: `${pricePerM2} ₽/м²` },
                property.renovation && { label: "Ремонт", value: property.renovation },
                property.year_built && { label: "Год постройки", value: String(property.year_built) },
              ].filter((row): row is { label: string; value: string } => Boolean(row)).map((row, i, arr) => (
                <div
                  key={row.label}
                  className="flex items-start justify-between gap-4 px-5 py-3.5"
                  style={{
                    background: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)",
                    borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <span className="flex-shrink-0" style={{ fontSize: "14px", color: "var(--ink-4)" }}>{row.label}</span>
                  <span className="text-right" style={{ fontSize: "14px", color: "var(--ink)", fontWeight: 500 }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            {property.description && (
              <div>
                <h2 className="font-bold mb-5" style={{ fontSize: "22px", color: "var(--ink)", letterSpacing: "-0.015em" }}>
                  Описание
                </h2>
                <p style={{ fontSize: "15px", color: "var(--ink-3)", lineHeight: 1.75, whiteSpace: "pre-line" }}>
                  {property.description}
                </p>
              </div>
            )}

            {/* Map */}
            {property.latitude && property.longitude && (
              <div>
                <h2 className="font-bold mb-5" style={{ fontSize: "22px", color: "var(--ink)", letterSpacing: "-0.015em" }}>
                  На карте
                </h2>
                <Suspense fallback={<div className="h-[360px] rounded-[20px] animate-pulse" style={{ background: "var(--skeleton)" }} />}>
                  <PropertyMap
                    lat={Number(property.latitude)}
                    lng={Number(property.longitude)}
                    address={property.address}
                  />
                </Suspense>
              </div>
            )}

            {/* Back link */}
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-semibold transition-all duration-200 hover:-translate-x-0.5"
              style={{ background: "var(--surface-3)", color: "var(--ink-2)" }}
            >
              <ArrowLeft size={15} />
              Вернуться к каталогу
            </Link>
          </div>

          {/* Right — contact sidebar */}
          <div>
            <div
              className="sticky top-24 rounded-[24px] overflow-hidden"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "0 4px 32px rgba(0,0,0,0.07)",
              }}
            >
              {/* Price block */}
              <div className="p-7 pb-6" style={{ borderBottom: "1px solid var(--border)" }}>
                <p className="font-bold mb-1" style={{ fontSize: "28px", color: "var(--ink)", letterSpacing: "-0.025em" }}>
                  {formatPriceFull(property.price)}
                </p>
                {pricePerM2 && (
                  <p style={{ fontSize: "13px", color: "var(--ink-4)" }}>{pricePerM2} ₽/м²</p>
                )}
              </div>

              {/* CTA buttons */}
              <div className="p-7 space-y-3">
                <a
                  href={`https://wa.me/79102775212?text=${waText}`}
                  target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-[15px] transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: "#25D366", color: "#fff", boxShadow: "0 4px 16px rgba(37,211,102,0.3)" }}
                >
                  <WAIcon />
                  WhatsApp
                </a>
                <a
                  href={`https://t.me/+79102775212?text=${waText}`}
                  target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-[15px] transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: "#0088cc", color: "#fff", boxShadow: "0 4px 16px rgba(0,136,204,0.3)" }}
                >
                  <TGIcon />
                  Telegram
                </a>
                <a
                  href="https://max.ru/u/79102775212"
                  target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-[15px] transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: "#0077FF", color: "#fff", boxShadow: "0 4px 16px rgba(0,119,255,0.3)" }}
                >
                  <MaxIcon />
                  MAX
                </a>
                <a
                  href="tel:+79102775212"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-[15px] transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: "var(--surface-2)", color: "var(--ink)", border: "1px solid var(--border)" }}
                >
                  <Phone size={15} strokeWidth={2} />
                  +7 910 277-52-12
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function WAIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function TGIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

function MaxIcon() {
  return <img src="https://maxicons.ru/icons/Max_logo.svg" alt="MAX" width={16} height={16} />;
}
