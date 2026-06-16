import { motion } from "framer-motion";
import { Shield, Clock, FileCheck, TrendingUp, HeartHandshake, MapPin } from "lucide-react";

const items = [
  { Icon: Shield,         title: "Юридическая чистота",  text: "Полная проверка истории объекта, обременений и документов.", accent: "#E31E24" },
  { Icon: Clock,          title: "Экономия времени",      text: "Беру на себя все этапы сделки от подбора до передачи ключей.", accent: "#E31E24" },
  { Icon: FileCheck,      title: "Прозрачные условия",    text: "Никаких скрытых комиссий. Фиксированная стоимость услуг.", accent: "#E31E24" },
  { Icon: TrendingUp,     title: "Знание рынка",          text: "Актуальная аналитика цен. Покупка по справедливой стоимости.", accent: "#E31E24" },
  { Icon: HeartHandshake, title: "Личное сопровождение",  text: "На связи 7 дней в неделю. Решаю вопросы оперативно.", accent: "#E31E24" },
  { Icon: MapPin,         title: "Эксперт по Москве",     text: "Глубокое знание каждого района и жилого комплекса.", accent: "#E31E24" },
];

export default function Advantages() {
  return (
    <section style={{ background: "#F7F7F8" }} className="py-20 lg:py-28">
      <div className="container">
        <div className="max-w-2xl mb-14 lg:mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-[12px] font-semibold uppercase tracking-[0.12em] text-red mb-5"
          >
            Преимущества
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.06 }}
            className="font-bold"
            style={{
              fontSize: "clamp(32px, 4vw, 52px)",
              color: "#111111",
              letterSpacing: "-0.025em",
              lineHeight: 1.08,
            }}
          >
            Почему мне доверяют<br />
            <span style={{ color: "#BBBBBB" }}>покупку недвижимости</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(({ Icon, title, text, accent }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
              className="group relative p-8 overflow-hidden transition-all duration-300"
              style={{
                background: "#FFFFFF",
                borderRadius: "20px",
                border: "1px solid rgba(0,0,0,0.05)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.04)",
              }}
            >
              {/* Top accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px]"
                style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
              />

              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at 20% 20%, rgba(227,30,36,0.04) 0%, transparent 60%)",
                }}
              />

              <div
                className="relative w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                style={{
                  background: "linear-gradient(135deg, rgba(227,30,36,0.1) 0%, rgba(227,30,36,0.06) 100%)",
                  border: "1px solid rgba(227,30,36,0.1)",
                }}
              >
                <Icon size={28} className="text-red" strokeWidth={1.8} />
              </div>

              <h3
                className="font-semibold mb-2.5 transition-colors duration-200"
                style={{ fontSize: "19px", color: "#111111", letterSpacing: "-0.01em" }}
              >
                {title}
              </h3>
              <p style={{ fontSize: "16px", color: "#666666", lineHeight: 1.6 }}>
                {text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
