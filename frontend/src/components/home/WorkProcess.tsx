import { motion } from "framer-motion";

const steps = [
  { n: "01", title: "Консультация",   text: "Обсуждаем ваши цели, бюджет и критерии. Даю экспертную оценку рынка." },
  { n: "02", title: "Подбор объектов", text: "Формирую персональную подборку под ваши параметры. Организую показы." },
  { n: "03", title: "Переговоры",      text: "Добиваюсь лучшей цены и условий. Опыт сделок — ваша экономия." },
  { n: "04", title: "Юридическая проверка", text: "Проверяю историю, документы и обременения. Только чистые объекты." },
  { n: "05", title: "Оформление",      text: "Сопровождаю сделку от аванса до регистрации. Помогаю с ипотекой." },
  { n: "06", title: "Передача ключей", text: "Контролирую передачу объекта. Остаюсь на связи после сделки." },
];

export default function WorkProcess() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="container">
        <div className="max-w-2xl mb-14 lg:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.06 }}
            className="font-bold"
            style={{
              fontSize: "clamp(26px, 4vw, 52px)",
              color: "#111111",
              letterSpacing: "-0.025em",
              lineHeight: 1.08,
            }}
          >
            Как проходит сделка<br />
            <span style={{ color: "#999999" }}>от первой встречи до ключей</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
          {steps.map(({ n, title, text }, i) => (
            <motion.div
              key={n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-baseline gap-4 mb-3">
                <span
                  className="font-bold leading-none text-[30px] sm:text-[42px]"
                  style={{ color: "#a20d0f", letterSpacing: "-0.03em", opacity: 0.9 }}
                >
                  {n}
                </span>
                <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.08)" }} />
              </div>
              <h3
                className="font-semibold mb-2"
                style={{ fontSize: "20px", color: "#111111", letterSpacing: "-0.012em" }}
              >
                {title}
              </h3>
              <p style={{ fontSize: "15px", color: "#666666", lineHeight: 1.6 }}>
                {text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
