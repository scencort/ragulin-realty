import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Star, Clock, ChevronLeft, ChevronRight, Quote, X, List } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SEOMeta from "@/components/ui/SEOMeta";
import { PageLoader } from "@/components/ui/Loader";
import { reviewsApi } from "@/api/reviews";
import { formatDate } from "@/utils/format";

const AUTOPLAY_MS = 6000;

export default function ReviewsPage() {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ["reviews", "published"],
    queryFn: () => reviewsApi.list(true),
  });

  const sorted = useMemo(() => {
    if (!reviews) return [];
    return [...reviews].sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [reviews]);

  const avgRating = useMemo(() => {
    if (!reviews?.length) return 0;
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  }, [reviews]);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (paused || sorted.length < 2) return;
    const t = setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % sorted.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused, sorted.length]);

  const go = (dir: 1 | -1) => {
    setDirection(dir);
    setIndex((i) => (i + dir + sorted.length) % sorted.length);
  };

  const current = sorted[index];

  return (
    <Layout>
      <SEOMeta
        title="Отзывы клиентов — Рагулин Роман"
        description="Отзывы о работе с Рагулиным Романом Александровичем. Покупка, продажа и аренда недвижимости в Москве."
      />

      {/* Header */}
      <div
        className="pt-[68px] lg:pt-[76px]"
        style={{ background: "rgba(255,255,255,0.9)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="container py-10">
          <p className="eyebrow mb-3">Мнения клиентов</p>
          <h1 className="section-title mb-5">Отзывы</h1>

          {!!reviews?.length && (
            <div className="flex items-center gap-3">
              <span className="font-bold" style={{ fontSize: "26px", color: "#111", letterSpacing: "-0.02em" }}>
                {avgRating.toFixed(1)}
              </span>
              <Star size={16} fill="#E31E24" stroke="#E31E24" />
              <span className="text-[14px]" style={{ color: "#888" }}>
                {reviews.length} {reviews.length === 1 ? "отзыв" : "отзывов"} с Циан
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="container py-16 lg:py-24">
        {isLoading ? (
          <PageLoader />
        ) : !sorted.length ? (
          <div className="max-w-lg mx-auto text-center py-20">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: "rgba(227,30,36,0.08)", border: "1px solid rgba(227,30,36,0.1)" }}
            >
              <Clock size={24} style={{ color: "#E31E24" }} strokeWidth={1.6} />
            </div>
            <h2 className="font-bold mb-3" style={{ fontSize: "24px", color: "#111", letterSpacing: "-0.02em" }}>
              Отзывы скоро появятся
            </h2>
            <p style={{ fontSize: "15px", color: "#666", lineHeight: 1.65 }}>
              Собираем отзывы с независимых площадок — Яндекс.Карты, 2ГИС и сайта Этажи.
              Скоро здесь будет живая лента мнений клиентов.
            </p>
          </div>
        ) : (
          <div
            className="max-w-3xl mx-auto"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="relative flex items-center gap-4 sm:gap-8">
              <NavButton onClick={() => go(-1)} dir="left" />

              <div
                className="relative flex-1 rounded-[28px] px-8 sm:px-14 py-12 sm:py-16 text-center overflow-hidden"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(0,0,0,0.05)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.05)",
                  minHeight: "320px",
                }}
              >
                <Quote size={32} style={{ color: "#E31E24", margin: "0 auto 22px" }} fill="#E31E24" strokeWidth={0} />

                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={current.id}
                    custom={direction}
                    initial={{ opacity: 0, x: direction * 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction * -24 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p
                      className="font-medium mb-8"
                      style={{
                        fontSize: "clamp(17px, 2vw, 21px)",
                        lineHeight: 1.6,
                        letterSpacing: "-0.01em",
                        color: "#222",
                      }}
                    >
                      «{current.text}»
                    </p>

                    <div className="flex items-center justify-center gap-0.5 mb-5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} size={14} fill={j < current.rating ? "#E31E24" : "none"} stroke={j < current.rating ? "#E31E24" : "rgba(0,0,0,0.15)"} />
                      ))}
                    </div>

                    <div className="flex items-center justify-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-[13px]"
                        style={{ background: "rgba(227,30,36,0.08)", color: "#E31E24" }}
                      >
                        {current.client_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <div className="text-[14px] font-semibold" style={{ color: "#111" }}>{current.client_name}</div>
                        <div className="text-[12px]" style={{ color: "#999" }}>{formatDate(current.created_at)}</div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <NavButton onClick={() => go(1)} dir="right" />
            </div>

            {/* Counter + progress */}
            <div className="flex flex-col items-center gap-3 mt-8">
              <span className="text-[13px] font-medium" style={{ color: "#999" }}>
                {index + 1} / {sorted.length}
              </span>
              <div className="w-full max-w-[200px] h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.08)" }}>
                <motion.div
                  key={index}
                  className="h-full"
                  style={{ background: "#E31E24" }}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: paused ? 0 : AUTOPLAY_MS / 1000, ease: "linear" }}
                />
              </div>

            </div>

            <div className="flex justify-center mt-10">
              <button onClick={() => setShowAll(true)} className="btn btn-outline btn-sm">
                <List size={15} />
                Посмотреть все отзывы
              </button>
            </div>
          </div>
        )}
      </div>

      {/* All-reviews modal */}
      <AnimatePresence>
        {showAll && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-5"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setShowAll(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full sm:max-w-2xl bg-white rounded-t-[24px] sm:rounded-[24px] flex flex-col"
              style={{ maxHeight: "85vh" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 sm:px-8 pt-6 sm:pt-7 pb-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <div>
                  <h3 className="font-bold" style={{ fontSize: "20px", color: "#111", letterSpacing: "-0.02em" }}>Все отзывы</h3>
                  <p className="text-[13px] mt-0.5" style={{ color: "#999" }}>{sorted.length} отзывов с Циан</p>
                </div>
                <button
                  onClick={() => setShowAll(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "#F4F4F4", color: "#666" }}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="overflow-y-auto px-6 sm:px-8 py-5 flex flex-col gap-4">
                {sorted.map((r) => (
                  <div key={r.id} className="p-5 rounded-2xl" style={{ background: "#FAFAFA", border: "1px solid rgba(0,0,0,0.05)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-[13px]"
                          style={{ background: "#EDEDED", color: "#777" }}
                        >
                          {r.client_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[14px] font-semibold" style={{ color: "#111" }}>{r.client_name}</span>
                      </div>
                      <span className="text-[12px] flex-shrink-0" style={{ color: "#AAA" }}>{formatDate(r.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-0.5 mb-3">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} size={13} fill={j < r.rating ? "#E31E24" : "none"} stroke={j < r.rating ? "#E31E24" : "rgba(0,0,0,0.15)"} />
                      ))}
                    </div>
                    <p style={{ fontSize: "14.5px", color: "#444", lineHeight: 1.65 }}>{r.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}

function NavButton({ onClick, dir }: { onClick: () => void; dir: "left" | "right" }) {
  return (
    <button
      onClick={onClick}
      aria-label={dir === "left" ? "Предыдущий отзыв" : "Следующий отзыв"}
      className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "#FFFFFF",
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
        color: "#333",
      }}
    >
      {dir === "left" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
    </button>
  );
}
