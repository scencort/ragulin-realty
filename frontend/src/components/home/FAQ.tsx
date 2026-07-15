import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "Сколько обычно занимает продажа квартиры?",
    a: "Срок зависит от района, цены и состояния объекта. В среднем подготовленный объект уходит заметно быстрее: сначала оцениваем рынок, потом даем реалистичный план по срокам и цене.",
  },
  {
    q: "Помогаете только с покупкой и продажей?",
    a: "Нет. Также помогаю с арендой, новостройками, загородной и коммерческой недвижимостью, а еще сопровождаю переговоры и юридическую проверку объекта.",
  },
  {
    q: "Можно обратиться, если у меня ипотека?",
    a: "Да. Помогаю подобрать сценарий сделки, рассчитать комфортный бюджет, согласовать ипотечную стратегию и провести сделку без лишнего стресса.",
  },
  {
    q: "Что входит в сопровождение сделки?",
    a: "Оценка рынка, стратегия продажи или подбора, показы, переговоры, проверка документов, координация всех участников и сопровождение до финального расчета.",
  },
  {
    q: "Берете ли вы объекты в работу срочно?",
    a: "Да. Если нужна срочная продажа или быстрый подбор, можно собрать ускоренный план действий и сразу определить, где выигрываем временем, а где важно не потерять в цене.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-10 lg:py-28" style={{ background: "var(--surface)" }}>
      <div className="container">
        <div className="pt-10 lg:pt-14 mb-8 lg:mb-12" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="max-w-2xl">
          <h2 className="section-title">FAQ</h2>
          <p className="mt-3 text-[15px] lg:text-[17px]" style={{ color: "var(--ink-3)", lineHeight: 1.65 }}>
            Ответы на частые вопросы перед продажей, покупкой и сопровождением сделки.
          </p>
          </div>
        </div>

        <div className="max-w-4xl space-y-3">
          {FAQ_ITEMS.map((item, index) => {
            const open = openIndex === index;
            return (
              <div
                key={item.q}
                className="rounded-[22px] overflow-hidden"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : index)}
                  className="w-full flex items-center justify-between gap-4 text-left px-5 py-5 lg:px-6"
                >
                  <span className="font-semibold" style={{ fontSize: "16px", color: "var(--ink)", letterSpacing: "-0.01em" }}>
                    {item.q}
                  </span>
                  <ChevronDown
                    size={18}
                    className="flex-shrink-0 transition-transform duration-200"
                    style={{ color: "var(--ink-4)", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div
                        className="px-5 pb-5 lg:px-6 lg:pb-6"
                        style={{ color: "var(--ink-3)", fontSize: "15px", lineHeight: 1.7, borderTop: "1px solid var(--border)" }}
                      >
                        <p className="pt-4">{item.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
