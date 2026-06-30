import { useQuery } from "@tanstack/react-query";
import { Building2, MessageSquare, TrendingUp, Star } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { propertiesApi } from "@/api/properties";
import { reviewsApi } from "@/api/reviews";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { data: props } = useQuery({
    queryKey: ["admin", "properties"],
    queryFn: () => propertiesApi.list({ limit: 100 }),
  });
  const { data: reviews } = useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: () => reviewsApi.adminList(),
  });

  const forSale = props?.items.filter((p) => p.status === "sale").length ?? 0;
  const forRent = props?.items.filter((p) => p.status === "rent").length ?? 0;
  const pendingReviews = reviews?.filter((r) => !r.is_published).length ?? 0;
  const avgRating = reviews?.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  const stats = [
    {
      Icon: Building2,
      label: "Всего объектов",
      value: props?.total ?? 0,
      sub: `${forSale} продажа · ${forRent} аренда`,
      href: "/admin/properties",
      accent: "#2563eb",
      accentBg: "rgba(37,99,235,0.08)",
    },
    {
      Icon: MessageSquare,
      label: "Отзывы",
      value: reviews?.length ?? 0,
      sub: `${pendingReviews} ожидают публикации`,
      href: "/admin/reviews",
      accent: "#d97706",
      accentBg: "rgba(217,119,6,0.08)",
    },
    {
      Icon: Star,
      label: "Средний рейтинг",
      value: avgRating,
      sub: "По всем отзывам",
      href: "/admin/reviews",
      accent: "#a20d0f",
      accentBg: "rgba(162,13,15,0.08)",
    },
    {
      Icon: TrendingUp,
      label: "На главной",
      value: props?.items.filter((p) => p.is_featured).length ?? 0,
      sub: "Избранных объектов",
      href: "/admin/properties",
      accent: "#16a34a",
      accentBg: "rgba(22,163,74,0.08)",
    },
  ];

  return (
    <AdminLayout>
      <div className="p-8 max-w-[1200px]">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="font-bold"
            style={{ fontSize: "26px", color: "var(--ink)", letterSpacing: "-0.02em" }}
          >
            Панель управления
          </h1>
          <p className="text-[14px] mt-1" style={{ color: "var(--ink-4)" }}>
            Рагулин Роман · Эксперт по недвижимости
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {stats.map(({ Icon, label, value, sub, href, accent, accentBg }) => (
            <Link
              key={label}
              to={href}
              className="block p-6 rounded-[20px] transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border-lg)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
              }}
            >
              <div
                className="w-10 h-10 flex items-center justify-center rounded-xl mb-4"
                style={{ background: accentBg, color: accent }}
              >
                <Icon size={18} strokeWidth={2} />
              </div>
              <p
                className="font-bold"
                style={{ fontSize: "28px", color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: 1 }}
              >
                {value}
              </p>
              <p className="text-[14px] font-semibold mt-1" style={{ color: "var(--ink-2)" }}>{label}</p>
              <p className="text-[12px] mt-1" style={{ color: "var(--ink-4)" }}>{sub}</p>
            </Link>
          ))}
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Recent properties */}
          <div
            className="rounded-[20px] overflow-hidden"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-lg)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
            }}
          >
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <h2 className="text-[14px] font-bold" style={{ color: "var(--ink)" }}>Последние объекты</h2>
              <Link to="/admin/properties" className="text-[13px] font-medium" style={{ color: "#a20d0f" }}>
                Все →
              </Link>
            </div>
            <div className="px-6">
              {props?.items.slice(0, 6).map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-3"
                  style={{ borderBottom: i < 5 ? "1px solid var(--border)" : "none" }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium truncate" style={{ color: "var(--ink)" }}>{p.title}</p>
                    <p className="text-[12px] mt-0.5" style={{ color: "var(--ink-4)" }}>{p.district}</p>
                  </div>
                  <Link
                    to={`/admin/properties/${p.id}`}
                    className="text-[12px] font-medium ml-4 flex-shrink-0"
                    style={{ color: "#a20d0f" }}
                  >
                    Изменить
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Pending reviews */}
          <div
            className="rounded-[20px] overflow-hidden"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-lg)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
            }}
          >
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2.5">
                <h2 className="text-[14px] font-bold" style={{ color: "var(--ink)" }}>На проверке</h2>
                {pendingReviews > 0 && (
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ background: "#a20d0f" }}
                  >
                    {pendingReviews}
                  </span>
                )}
              </div>
              <Link to="/admin/reviews" className="text-[13px] font-medium" style={{ color: "#a20d0f" }}>
                Все →
              </Link>
            </div>
            <div className="px-6">
              {pendingReviews === 0 ? (
                <p className="text-[14px] py-8 text-center" style={{ color: "var(--ink-4)" }}>
                  Нет отзывов на проверке
                </p>
              ) : (
                reviews?.filter((r) => !r.is_published).slice(0, 6).map((r, i, arr) => (
                  <div
                    key={r.id}
                    className="py-3"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}
                  >
                    <p className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>{r.client_name}</p>
                    <p className="text-[12px] mt-0.5 line-clamp-1" style={{ color: "var(--ink-4)" }}>{r.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
