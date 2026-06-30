import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, Phone, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "@/components/ui/BrandLogo";
import QuizModal from "@/components/ui/QuizModal";
import { useTheme } from "@/hooks/useTheme";

const links = [
  { to: "/", label: "Главная", end: true },
  { to: "/catalog", label: "Объекты", end: false },
  { to: "/about", label: "О специалисте", end: false },
  { to: "/reviews", label: "Отзывы", end: false },
  { to: "/contacts", label: "Контакты", end: false },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const location = useLocation();
  const { isDark, toggle } = useTheme();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => setOpen(false), [location]);

  return (
    <>
      <header
        className="fixed top-0 inset-x-0 z-50 transition-all duration-400"
        style={{
          background: "var(--header-bg)",
          backdropFilter: "blur(24px) saturate(200%)",
          WebkitBackdropFilter: "blur(24px) saturate(200%)",
          borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        }}
      >
        <div className="container">
          <div className="flex items-center justify-between h-[68px] lg:h-[76px]">
            <Link to="/" className="flex-shrink-0">
              <BrandLogo className="h-12 lg:h-14 w-auto" />
            </Link>

            {/* Mobile: phone + quiz button — centered */}
            <div className="flex lg:hidden flex-1 items-center justify-center gap-2 px-2">
              <a
                href="tel:+79102775212"
                className="px-3 py-2.5 rounded-full text-[12px] font-semibold whitespace-nowrap min-h-[44px] flex items-center"
                style={{ background: "var(--surface-3)", color: "var(--ink)" }}
              >
                <span className="hidden sm:inline">Позвонить специалисту</span>
                <span className="sm:hidden">Позвонить</span>
              </a>
              <button
                onClick={() => setQuizOpen(true)}
                className="px-3 py-2.5 rounded-full text-[12px] font-semibold text-white whitespace-nowrap min-h-[44px]"
                style={{ background: "#a20d0f" }}
              >
                Подобрать
              </button>
            </div>

            <nav className="hidden lg:flex items-center gap-1">
              {links.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className="px-4 py-2 rounded-full text-[14px] font-medium transition-all duration-200"
                  style={({ isActive }) => isActive
                    ? { background: "#a20d0f", color: "#FFFFFF" }
                    : { color: "var(--ink-3)" }
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              <a
                href="tel:+79102775212"
                className="flex items-center gap-2 text-[14px] font-semibold transition-colors"
                style={{ color: "var(--ink)" }}
              >
                <Phone size={14} strokeWidth={2.4} />
                +7 910 277-52-12
              </a>
              <button
                onClick={toggle}
                aria-label="Переключить тему"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                style={{ background: "var(--surface-3)", color: "var(--ink-3)" }}
              >
                {isDark ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
              </button>
              <button
                onClick={() => setQuizOpen(true)}
                className="px-4 py-2 rounded-full text-[14px] font-semibold text-white transition-all duration-200 hover:opacity-90"
                style={{ background: "#a20d0f" }}
              >
                Подобрать
              </button>
            </div>

            <button
              onClick={() => setOpen(!open)}
              className="lg:hidden w-11 h-11 rounded-full flex items-center justify-center transition-colors"
              style={{ background: open ? "var(--border-md)" : "transparent", color: "var(--ink)" }}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="lg:hidden overflow-hidden"
              style={{
                background: "var(--surface)",
                backdropFilter: "blur(40px)",
                WebkitBackdropFilter: "blur(40px)",
                borderTop: "1px solid var(--border)",
              }}
            >
              <div className="container py-4 space-y-1">
                {links.map(({ to, label, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className="block px-4 py-3 rounded-xl text-[15px] font-medium transition-colors"
                    style={({ isActive }) => isActive
                      ? { background: "#a20d0f", color: "#FFFFFF" }
                      : { color: "var(--ink-3)" }
                    }
                  >
                    {label}
                  </NavLink>
                ))}
                <div className="pt-3 mt-3 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <a href="tel:+79102775212" className="flex items-center gap-2 px-4 py-3 text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                    <Phone size={15} />
                    +7 910 277-52-12
                  </a>
                  <button
                    onClick={toggle}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-[15px] font-medium"
                    style={{ color: "var(--ink-3)", background: "var(--surface-3)" }}
                  >
                    {isDark ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
                    {isDark ? "Светлая тема" : "Тёмная тема"}
                  </button>
                  <button
                    onClick={() => { setOpen(false); setQuizOpen(true); }}
                    className="w-full px-4 py-3 rounded-xl text-[15px] font-semibold text-white text-left"
                    style={{ background: "#a20d0f" }}
                  >
                    Подобрать недвижимость
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <QuizModal open={quizOpen} onClose={() => setQuizOpen(false)} />
    </>
  );
}
