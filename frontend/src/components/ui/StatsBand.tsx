import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export type StatsBandItem = {
  Icon: LucideIcon;
  raw: number;
  suffix: string;
  label: string;
  sub: string;
  decimals?: number;
};

function useCountUp(end: number, duration = 2.5, shouldStart: boolean, decimals = 0) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!shouldStart) return;
    const startTime = Date.now();
    const step = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // gentle ease-out: slow start, smooth finish
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const value = eased * end;
      setCount(decimals > 0 ? Math.round(value * 10) / 10 : Math.round(value));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [shouldStart, end, duration, decimals]);

  return count;
}

function StatItem({ Icon, raw, suffix, label, sub, decimals = 0, index }: StatsBandItem & { index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const count = useCountUp(raw, 2.5, inView, decimals);

  const shown = decimals > 0
    ? `${count.toFixed(1)}${suffix}`
    : `${count}${suffix}`;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col items-start p-5 sm:p-7 rounded-[20px]"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4 sm:mb-5"
        style={{ background: "rgba(227,30,36,0.1)" }}
      >
        <Icon size={18} style={{ color: "#E31E24" }} strokeWidth={1.8} />
      </div>

      <p
        className="font-bold mb-2 tabular-nums"
        style={{
          fontSize: "clamp(28px, 6vw, 64px)",
          color: "#FFFFFF",
          letterSpacing: "-0.04em",
          lineHeight: 1,
          textShadow: "0 0 60px rgba(227,30,36,0.2)",
        }}
      >
        {shown}
      </p>
      <p className="text-[14px] sm:text-[15px] font-medium mb-1" style={{ color: "rgba(255,255,255,0.85)" }}>{label}</p>
      <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.35)" }}>{sub}</p>
    </motion.div>
  );
}

export default function StatsBand({ items }: { items: StatsBandItem[] }) {
  return (
    <section
      className="relative py-20 lg:py-28 overflow-hidden"
      style={{ background: "linear-gradient(160deg, #1A1A1A 0%, #161616 50%, #1F0E0E 100%)" }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(227,30,36,0.08) 0%, transparent 60%)",
        }}
      />
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="container relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {items.map((s, i) => (
            <StatItem key={s.label} {...s} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
