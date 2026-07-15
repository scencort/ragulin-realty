import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SEOMeta from "@/components/ui/SEOMeta";
import PropertyCard from "@/components/property/PropertyCard";
import PropertyFiltersComponent from "@/components/property/PropertyFilters";
import { propertiesApi } from "@/api/properties";
import type { PropertyFilters } from "@/types";
import { getFavoriteIds } from "@/utils/favorites";
import { buildCanonical } from "@/utils/site";

function SkeletonCard() {
  return (
    <div
      className="rounded-[16px] animate-pulse overflow-hidden"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <div className="aspect-[4/3]" style={{ background: "var(--skeleton)" }} />
      <div className="p-5 space-y-3">
        <div className="h-3 rounded-full w-1/3" style={{ background: "var(--skeleton)" }} />
        <div className="h-4 rounded-full w-4/5" style={{ background: "var(--skeleton)" }} />
        <div className="h-3 rounded-full w-1/2" style={{ background: "var(--skeleton)" }} />
        <div className="h-5 rounded-full w-2/5" style={{ background: "var(--skeleton)" }} />
      </div>
    </div>
  );
}

function plural(n: number): string {
  const a = Math.abs(n) % 100;
  const n1 = a % 10;
  if (a > 10 && a < 20) return "объектов";
  if (n1 > 1 && n1 < 5) return "объекта";
  if (n1 === 1) return "объект";
  return "объектов";
}

export default function Catalog() {
  const [filters, setFilters] = useState<PropertyFilters>({ skip: 0, limit: 12 });
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() => getFavoriteIds());
  const limit = filters.limit ?? 12;

  useEffect(() => {
    const sync = () => setFavoriteIds(getFavoriteIds());
    window.addEventListener("favorites-updated", sync);
    return () => window.removeEventListener("favorites-updated", sync);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["properties", filters],
    queryFn: () => propertiesApi.list(filters),
    placeholderData: (prev) => prev,
  });

  const visibleItems = favoritesOnly
    ? (data?.items ?? []).filter((item) => favoriteIds.includes(item.id))
    : (data?.items ?? []);

  const totalForView = favoritesOnly ? visibleItems.length : (data?.total ?? 0);
  const totalPages = data ? Math.ceil(data.total / limit) : 0;
  const currentPage = Math.floor((filters.skip ?? 0) / limit) + 1;

  const goTo = (page: number) => {
    setFilters((f) => ({ ...f, skip: (page - 1) * limit }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetEmptyState = () => {
    if (favoritesOnly) {
      setFavoritesOnly(false);
      return;
    }
    setFilters({ skip: 0, limit });
  };

  return (
    <Layout>
      <SEOMeta
        title="Объекты в продаже"
        description="Квартиры, дома и коммерческая недвижимость в Москве. Актуальные предложения от эксперта Рагулина Романа."
        canonical={buildCanonical("/catalog")}
      />

      <div
        style={{ background: "var(--glass-bg)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="container pt-2 pb-4">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06 }}
            className="section-title"
          >
            Объекты в продаже
          </motion.h1>
          {data && (
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <p className="text-[14px]" style={{ color: "var(--ink-3)" }}>
                {totalForView} {plural(totalForView)}
              </p>
              <button
                type="button"
                onClick={() => setFavoritesOnly((value) => !value)}
                className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200"
                style={{
                  background: favoritesOnly ? "rgba(162,13,15,0.1)" : "var(--surface-2)",
                  color: favoritesOnly ? "#a20d0f" : "var(--ink-3)",
                  border: favoritesOnly ? "1px solid rgba(162,13,15,0.18)" : "1px solid var(--border)",
                }}
              >
                {favoritesOnly ? "Показать все" : "Только избранное"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="container py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="sticky top-24">
              <PropertyFiltersComponent
                filters={filters}
                onChange={(f) => setFilters({ ...f, limit })}
              />
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
                {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : visibleItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div
                  className="w-16 h-16 rounded-[20px] flex items-center justify-center mb-5"
                  style={{ background: "rgba(227,30,36,0.08)" }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a20d0f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
                    <path d="M9 21V12h6v9" />
                  </svg>
                </div>
                <h3 className="text-title-2 font-bold mb-2" style={{ color: "var(--ink)" }}>
                  {favoritesOnly ? "В избранном пока пусто" : "Объекты не найдены"}
                </h3>
                <p className="text-body mb-6" style={{ color: "var(--ink-3)" }}>
                  {favoritesOnly
                    ? "Сохраняйте понравившиеся объекты, чтобы быстро к ним вернуться."
                    : "Попробуйте изменить параметры"}
                </p>
                <button onClick={resetEmptyState} className="btn-outline btn-sm">
                  {favoritesOnly ? "Показать все объекты" : "Сбросить фильтры"}
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
                  {visibleItems.map((p) => <PropertyCard key={p.id} property={p} />)}
                </div>

                {!favoritesOnly && totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <button
                      onClick={() => goTo(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-30 transition-colors"
                      style={{ border: "1px solid var(--border-md)", color: "var(--ink)" }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => goTo(page)}
                          className="w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-medium transition-all duration-200"
                          style={{
                            background: currentPage === page ? "var(--ink)" : "transparent",
                            color: currentPage === page ? "var(--bg)" : "var(--ink-3)",
                            border: currentPage === page ? "none" : "1px solid var(--border-md)",
                          }}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => goTo(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-30 transition-colors"
                      style={{ border: "1px solid var(--border-md)", color: "var(--ink)" }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
