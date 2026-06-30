import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Home, Search } from "lucide-react";
import Layout from "@/components/layout/Layout";

export default function NotFound() {
  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center max-w-lg mx-auto">

          {/* Big 404 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative mb-8 select-none"
          >
            <p
              className="font-bold leading-none"
              style={{
                fontSize: "clamp(120px, 30vw, 220px)",
                letterSpacing: "-0.05em",
                color: "var(--border-xl, rgba(162,13,15,0.08))",
                lineHeight: 0.9,
              }}
            >
              404
            </p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div
                className="w-20 h-20 rounded-[24px] flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #a20d0f 0%, #C41A20 100%)",
                  boxShadow: "0 16px 48px rgba(162,13,15,0.35)",
                }}
              >
                <Search size={36} color="white" strokeWidth={1.8} />
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.55 }}
          >
            <h1
              className="font-bold mb-3"
              style={{ fontSize: "clamp(24px, 5vw, 36px)", color: "var(--ink)", letterSpacing: "-0.025em" }}
            >
              Страница не найдена
            </h1>
            <p
              className="mb-10"
              style={{ fontSize: "16px", color: "var(--ink-3)", lineHeight: 1.65 }}
            >
              Возможно, ссылка устарела или объект был снят с продажи.<br />
              Загляните в каталог — там есть актуальные предложения.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/"
                className="flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-[15px] text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: "#a20d0f", boxShadow: "0 8px 24px rgba(162,13,15,0.3)" }}
              >
                <Home size={16} strokeWidth={2.2} />
                На главную
              </Link>
              <Link
                to="/catalog"
                className="flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-[15px] transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "var(--surface-3)",
                  color: "var(--ink)",
                  border: "1px solid var(--border-md)",
                }}
              >
                <ArrowLeft size={16} strokeWidth={2.2} />
                Каталог объектов
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
