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
    { Icon: Building2, label: "Всего объектов", value: props?.total ?? 0, sub: `${forSale} на продажу · ${forRent} аренда`, href: "/admin/properties", color: "bg-blue-50 text-blue-600" },
    { Icon: MessageSquare, label: "Отзывы", value: reviews?.length ?? 0, sub: `${pendingReviews} ожидают публикации`, href: "/admin/reviews", color: "bg-yellow-50 text-yellow-600" },
    { Icon: Star, label: "Средний рейтинг", value: avgRating, sub: "По всем отзывам", href: "/admin/reviews", color: "bg-red-50 text-red-600" },
    { Icon: TrendingUp, label: "Избранных объектов", value: props?.items.filter((p) => p.is_featured).length ?? 0, sub: "Показываются на главной", href: "/admin/properties", color: "bg-green-50 text-green-600" },
  ];

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-graphite">Панель управления</h1>
          <p className="text-sm text-text-secondary mt-1">
            Платформа персонального бренда · Рагулин Роман
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
          {stats.map(({ Icon, label, value, sub, href, color }) => (
            <Link
              key={label}
              to={href}
              className="bg-white p-6 card-shadow hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 flex items-center justify-center rounded mb-4 ${color}`}>
                <Icon size={18} />
              </div>
              <p className="text-2xl font-bold text-graphite">{value}</p>
              <p className="text-sm font-medium text-graphite mt-0.5">{label}</p>
              <p className="text-xs text-text-muted mt-1">{sub}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-graphite">Последние объекты</h2>
              <Link to="/admin/properties" className="text-xs text-brand-red hover:underline">Все →</Link>
            </div>
            {props?.items.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-border-gray last:border-0">
                <div>
                  <p className="text-sm font-medium text-graphite truncate max-w-[240px]">{p.title}</p>
                  <p className="text-xs text-text-muted">{p.district}</p>
                </div>
                <Link
                  to={`/admin/properties/${p.id}`}
                  className="text-xs text-brand-red hover:underline ml-4 flex-shrink-0"
                >
                  Изменить
                </Link>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-graphite">Ожидают публикации</h2>
              <Link to="/admin/reviews" className="text-xs text-brand-red hover:underline">Все →</Link>
            </div>
            {reviews?.filter((r) => !r.is_published).slice(0, 5).map((r) => (
              <div key={r.id} className="py-2.5 border-b border-border-gray last:border-0">
                <p className="text-sm font-medium text-graphite">{r.client_name}</p>
                <p className="text-xs text-text-muted truncate">{r.text}</p>
              </div>
            ))}
            {pendingReviews === 0 && (
              <p className="text-sm text-text-muted py-4 text-center">Нет отзывов на проверке</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
