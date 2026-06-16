import { Link } from "react-router-dom";
import { Star, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { reviewsApi } from "@/api/reviews";
import { formatDate } from "@/utils/format";

export default function ReviewsSection() {
  const { data } = useQuery({
    queryKey: ["reviews", "published"],
    queryFn: () => reviewsApi.list(true),
  });

  const shown = data?.slice(0, 3);
  if (!shown?.length) return null;

  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="container">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12 lg:mb-14">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="text-[12px] font-semibold uppercase tracking-[0.12em] text-red mb-5"
            >
              Отзывы
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.06 }}
              className="font-bold"
              style={{ fontSize: "clamp(32px, 4vw, 52px)", color: "#111111", letterSpacing: "-0.025em", lineHeight: 1.08 }}
            >
              Клиенты обо мне
            </motion.h2>
          </div>
          <Link
            to="/reviews"
            className="inline-flex items-center gap-1.5 text-[15px] font-semibold transition-colors group self-start sm:self-auto"
            style={{ color: "#111111" }}
          >
            Все отзывы
            <ArrowUpRight size={18} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {shown.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="p-8 flex flex-col"
              style={{
                background: "#FAFAFA",
                borderRadius: "20px",
                border: "1px solid rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-center gap-0.5 mb-5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} size={13} className={j < r.rating ? "fill-red text-red" : ""} style={j >= r.rating ? { color: "#D1D1D6" } : undefined} />
                ))}
              </div>
              <p
                className="flex-1 mb-6 line-clamp-5"
                style={{ fontSize: "15.5px", color: "#333333", lineHeight: 1.65, letterSpacing: "-0.005em" }}
              >
                «{r.text}»
              </p>
              <div className="flex items-center justify-between pt-5" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                <span className="text-[14px] font-semibold" style={{ color: "#111111" }}>{r.client_name}</span>
                <span className="text-[12px]" style={{ color: "#999999" }}>{formatDate(r.created_at)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
