import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { propertiesApi } from "@/api/properties";
import PropertyCard from "@/components/property/PropertyCard";

function SkeletonCard() {
  return (
    <div className="animate-pulse" style={{ background: "var(--surface)", borderRadius: "20px", overflow: "hidden", border: "1px solid var(--border)" }}>
      <div className="aspect-[4/3]" style={{ background: "var(--skeleton)" }} />
      <div className="p-5 space-y-3">
        <div className="h-3 rounded-full w-1/3" style={{ background: "var(--skeleton)" }} />
        <div className="h-4 rounded-full w-4/5" style={{ background: "var(--skeleton)" }} />
        <div className="h-3 rounded-full w-1/2" style={{ background: "var(--skeleton)" }} />
      </div>
    </div>
  );
}

export default function LatestProperties() {
  const { data, isLoading } = useQuery({
    queryKey: ["properties", "featured"],
    queryFn: () => propertiesApi.featured(6),
  });

  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <section style={{ background: "var(--surface-2)" }} className="py-20 lg:py-28">
      <div className="container">

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12 lg:mb-14">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.06 }}
              className="font-bold"
              style={{
                fontSize: "clamp(26px, 4vw, 52px)",
                color: "var(--ink)",
                letterSpacing: "-0.025em",
                lineHeight: 1.08,
              }}
            >
              Эксклюзивные объекты
            </motion.h2>
          </div>

          <Link
            to="/catalog"
            className="inline-flex items-center gap-1.5 text-[15px] font-semibold transition-colors group self-start sm:self-auto"
            style={{ color: "var(--ink)" }}
          >
            Все объекты
            <ArrowUpRight size={18} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : data?.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  <PropertyCard property={p} />
                </motion.div>
              ))}
        </div>
      </div>
    </section>
  );
}
