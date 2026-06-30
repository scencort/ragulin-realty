import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Phone, Star } from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay },
});

export default function Hero() {
  return (
    <section className="relative pt-8 lg:pt-12 pb-16 lg:pb-24 overflow-hidden" style={{ background: "var(--surface)" }}>

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.12, 0.22, 0.12] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(227,30,36,0.14) 0%, transparent 65%)" }}
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.06, 0.12, 0.06] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(17,17,17,0.07) 0%, transparent 65%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "radial-gradient(circle, var(--ink) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="container relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* Left */}
          <div className="lg:col-span-7 max-w-2xl">
            <motion.div
              {...fadeUp(0)}
              className="inline-flex items-center gap-2 mb-7 px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(227,30,36,0.07)",
                border: "1px solid rgba(227,30,36,0.18)",
                boxShadow: "0 0 20px rgba(227,30,36,0.08)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red animate-pulse" />
              <span className="text-[12px] font-semibold text-red tracking-wide">Эксперт по недвижимости · Москва</span>
            </motion.div>

            <motion.h1
              {...fadeUp(0.08)}
              className="font-bold leading-[1.02] mb-7"
              style={{
                color: "var(--ink)",
                fontSize: "clamp(34px, 6.5vw, 88px)",
                letterSpacing: "-0.035em",
                fontWeight: 700,
              }}
            >
              10 лет помогаю<br />
              купить и продать<br />
              <span style={{ color: "var(--ink-5)" }}>любую недвижимость</span>
            </motion.h1>

            <motion.p
              {...fadeUp(0.18)}
              className="leading-relaxed mb-10 max-w-lg"
              style={{ fontSize: "19px", color: "var(--ink-3)", fontWeight: 400 }}
            >
              Рагулин Роман — покупка, продажа и аренда квартир, загородной
              и коммерческой недвижимости в Москве и по всему миру.
            </motion.p>

            <motion.div {...fadeUp(0.26)} className="flex flex-col sm:flex-row gap-3 mb-12">
              <Link
                to="/catalog"
                className="btn-red group"
                style={{ boxShadow: "0 4px 20px rgba(227,30,36,0.35), 0 1px 3px rgba(227,30,36,0.2)" }}
              >
                Смотреть объекты
                <ArrowRight size={17} strokeWidth={2.2} className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
              <a href="tel:+79102775212" className="btn-glass">
                <Phone size={16} strokeWidth={2.2} />
                +7 910 277-52-12
              </a>
            </motion.div>

            <motion.div {...fadeUp(0.34)} className="grid grid-cols-3 gap-6 max-w-lg pt-8" style={{ borderTop: "1px solid var(--border)" }}>
              {[
                { v: "500+", l: "сделок" },
                { v: "10+",  l: "лет на рынке" },
                { v: "4.9",  l: "рейтинг" },
              ].map(({ v, l }) => (
                <div key={l}>
                  <p className="font-bold" style={{ fontSize: "28px", color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1 }}>{v}</p>
                  <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-4)" }}>{l}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Premium dark card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="lg:col-span-5"
          >
            <div className="relative">
              <div
                className="relative aspect-[4/5] rounded-[32px] overflow-hidden"
                style={{
                  background: "#f0eeec",
                  boxShadow: "0 32px 80px -20px rgba(0,0,0,0.5), 0 8px 32px -8px rgba(0,0,0,0.3)",
                }}
              >
                <img
                  src="/roman.jpg"
                  alt="Рагулин Роман"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ objectPosition: "center 10%" }}
                />

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="absolute top-6 left-6 flex gap-1"
                >
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={20} fill="rgba(162,13,15,0.9)" stroke="none" />
                  ))}
                </motion.div>

                <div
                  className="absolute bottom-5 left-5 right-5 p-5 rounded-2xl"
                  style={{
                    background: "rgba(10,10,10,0.72)",
                    backdropFilter: "blur(24px) saturate(180%)",
                    WebkitBackdropFilter: "blur(24px) saturate(180%)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderTopColor: "rgba(255,255,255,0.15)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[16px] font-semibold text-white" style={{ letterSpacing: "-0.01em" }}>
                        Рагулин Роман
                      </p>
                      <p className="text-[13px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                        Ведущий эксперт по недвижимости
                      </p>
                    </div>
                    <a
                      href="tel:+79102775212"
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:scale-110"
                      style={{ background: "#a20d0f", boxShadow: "0 4px 16px rgba(227,30,36,0.5)" }}
                    >
                      <Phone size={15} className="text-white" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Badge — top right */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute -top-4 -right-4 px-5 py-3 rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, #a20d0f 0%, #C41A20 100%)",
                  boxShadow: "0 8px 32px rgba(227,30,36,0.4), 0 2px 8px rgba(227,30,36,0.3)",
                }}
              >
                <p className="text-[11px] font-medium text-white/70 leading-none mb-1">С 2014 года</p>
                <p className="text-[20px] font-bold text-white leading-none">500+ сделок</p>
              </motion.div>

              {/* Badge — bottom left */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.85, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute -bottom-8 -left-4 px-4 py-3 rounded-2xl"
                style={{
                  background: "var(--surface)",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(227,30,36,0.1)" }}>
                    <Star size={13} fill="#a20d0f" stroke="none" />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold leading-none" style={{ color: "var(--ink)", letterSpacing: "-0.01em" }}>4.9 / 5.0</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-4)" }}>Оценка клиентов</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
