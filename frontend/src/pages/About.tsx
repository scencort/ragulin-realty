import { motion } from "framer-motion";
import { Award, Users, TrendingUp, Star, CheckCircle, Phone, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import SEOMeta from "@/components/ui/SEOMeta";
import StatsBand from "@/components/ui/StatsBand";

const achievements = [
  { Icon: TrendingUp, raw: 500, suffix: "+", label: "Успешных сделок",     sub: "за 10 лет",    decimals: 0 },
  { Icon: Users,      raw: 400, suffix: "+", label: "Довольных клиентов",  sub: "рекомендуют",  decimals: 0 },
  { Icon: Award,      raw: 10,  suffix: "+", label: "Лет на рынке",        sub: "с 2014 года",  decimals: 0 },
  { Icon: Star,       raw: 4.9, suffix: "",  label: "Средний рейтинг",     sub: "по отзывам",   decimals: 1 },
];

const skills = [
  "Покупка и продажа квартир",
  "Аренда жилой и коммерческой недвижимости",
  "Сопровождение ипотечных сделок",
  "Юридическая проверка объектов",
  "Оценка рыночной стоимости",
  "Переговоры с продавцами",
  "Работа с новостройками",
  "Инвестиции в недвижимость",
];

const career = [
  {
    period: "2020 — настоящее время",
    title: "Ведущий эксперт по недвижимости",
    company: "Компания «Этажи», Москва",
    text: "Покупка, продажа и аренда жилой и коммерческой недвижимости. Личный портфель — 200+ сделок.",
  },
  {
    period: "2015 — 2020",
    title: "Эксперт по недвижимости",
    company: "Работа в сфере недвижимости, Москва",
    text: "Формирование экспертизы в московском рынке недвижимости. Специализация на жилой недвижимости.",
  },
  {
    period: "2012 — 2015",
    title: "Начало карьеры",
    company: "Рынок недвижимости Москвы",
    text: "Первые шаги в профессии. Изучение рынка, работа с покупателями и арендаторами.",
  },
];

const steps = [
  { num: "01", title: "Консультация",         text: "Обсуждаем цели, бюджет и критерии. Даю экспертную оценку рынка." },
  { num: "02", title: "Подбор объектов",       text: "Формирую персональную подборку под ваши параметры. Организую показы." },
  { num: "03", title: "Юридическая проверка",  text: "Проверяю историю объекта, документы и обременения. Только чистые объекты." },
  { num: "04", title: "Переговоры",            text: "Добиваюсь лучшей цены и условий. Опыт сделок — ваша экономия." },
  { num: "05", title: "Оформление",            text: "Сопровождаю сделку от аванса до регистрации. Помогаю с ипотекой." },
  { num: "06", title: "Передача ключей",       text: "Контролирую передачу объекта. Остаюсь на связи после сделки." },
];

export default function About() {
  return (
    <Layout>
      <SEOMeta
        title="О специалисте — Рагулин Роман Александрович"
        description="Ведущий эксперт по недвижимости компании «Этажи». 10+ лет опыта, 500+ сделок в Москве."
      />

      {/* Hero */}
      <section className="relative bg-white pt-[88px] lg:pt-[100px] pb-16 lg:pb-24 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 80% 30%, rgba(227,30,36,0.06) 0%, transparent 55%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage: "radial-gradient(circle, #111 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="container relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65 }}>
              <p className="eyebrow mb-5">О специалисте</p>
              <h1
                className="font-bold mb-4"
                style={{ fontSize: "clamp(38px, 5vw, 68px)", color: "#111", letterSpacing: "-0.03em", lineHeight: 1.04 }}
              >
                Рагулин Роман<br />Александрович
              </h1>
              <p className="text-[14px] mb-6" style={{ color: "#999" }}>
                Эксперт по недвижимости · Работаю в компании «Этажи» · Москва
              </p>
              <div className="w-10 h-[3px] rounded-full mb-7" style={{ background: "#E31E24" }} />
              <p className="leading-relaxed max-w-lg" style={{ fontSize: "17px", color: "#555", lineHeight: 1.7 }}>
                Более 10 лет помогаю клиентам решать жилищные вопросы в Москве.
                Специализируюсь на сделках купли-продажи и аренды жилой и коммерческой
                недвижимости. Ключевые принципы работы — честность, прозрачность
                и результат. Каждая сделка — это персональный подход и полное
                юридическое сопровождение.
              </p>
              <div className="flex gap-3 mt-8">
                <a href="tel:+79102775212" className="btn-red">
                  <Phone size={16} strokeWidth={2.2} />
                  Позвонить
                </a>
                <Link to="/catalog" className="btn-glass">
                  Объекты
                  <ArrowRight size={16} strokeWidth={2.2} />
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65, delay: 0.1 }}
              className="flex justify-center lg:justify-end"
            >
              <div className="relative">
                <div
                  className="relative w-72 h-80 lg:w-[360px] lg:h-[440px] rounded-[28px] overflow-hidden"
                  style={{
                    background: "#f0eeec",
                    boxShadow: "0 32px 80px -20px rgba(0,0,0,0.5)",
                  }}
                >
                  <img
                    src="/roman.jpg"
                    alt="Рагулин Роман"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ objectPosition: "center 10%" }}
                  />
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, rotate: -6 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="absolute -top-4 -right-4 px-5 py-3 rounded-2xl"
                  style={{
                    background: "linear-gradient(135deg, #E31E24 0%, #C41A20 100%)",
                    boxShadow: "0 8px 32px rgba(227,30,36,0.4)",
                  }}
                >
                  <p className="text-[11px] text-white/70 leading-none mb-1">С 2014 года</p>
                  <p className="text-[20px] font-bold text-white leading-none">500+ сделок</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Dark stats */}
      <StatsBand items={achievements} />

      {/* Skills + Career */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }}>
              <p className="eyebrow mb-4">Экспертиза</p>
              <h2 className="section-title mb-10">Направления<br /><span style={{ color: "#BBBBBB" }}>работы</span></h2>
              <ul className="space-y-3">
                {skills.map((skill, i) => (
                  <motion.li
                    key={skill}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className="flex items-center gap-3"
                    style={{ fontSize: "17px", color: "#333" }}
                  >
                    <CheckCircle size={18} style={{ color: "#E31E24", flexShrink: 0 }} strokeWidth={2} />
                    {skill}
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.1 }}>
              <p className="eyebrow mb-4">Опыт работы</p>
              <h2 className="section-title mb-10">Карьера</h2>
              <div className="space-y-0">
                {career.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="flex gap-5 pb-8"
                  >
                    <div className="flex flex-col items-center flex-shrink-0 pt-1">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: "#E31E24", boxShadow: "0 0 8px rgba(227,30,36,0.4)" }}
                      />
                      {i < career.length - 1 && (
                        <div className="w-px flex-1 mt-2" style={{ background: "rgba(0,0,0,0.08)" }} />
                      )}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium mb-1.5" style={{ color: "#999", letterSpacing: "0.03em" }}>{item.period}</p>
                      <p className="text-[18px] font-bold mb-1" style={{ color: "#111", letterSpacing: "-0.01em" }}>{item.title}</p>
                      <p className="text-[14px] mb-2.5" style={{ color: "#E31E24", fontWeight: 500 }}>{item.company}</p>
                      <p className="text-[15px]" style={{ color: "#666", lineHeight: 1.65 }}>{item.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Work steps */}
      <section className="py-20 lg:py-28" style={{ background: "#F7F7F8" }}>
        <div className="container">
          <div className="max-w-xl mb-14">
            <p className="eyebrow mb-4">Процесс</p>
            <h2 className="section-title">Как я работаю<br /><span style={{ color: "#BBBBBB" }}>с клиентами</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                className="p-7 rounded-[20px]"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(0,0,0,0.05)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                <span
                  className="font-bold block mb-4"
                  style={{ fontSize: "48px", color: "#E31E24", lineHeight: 1, letterSpacing: "-0.04em", opacity: 0.85 }}
                >
                  {step.num}
                </span>
                <h3 className="font-semibold mb-2" style={{ fontSize: "16px", color: "#111", letterSpacing: "-0.01em" }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6 }}>{step.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
