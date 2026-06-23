import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "@/components/ui/BrandLogo";

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
  const location = useLocation();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => setOpen(false), [location]);

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 transition-all duration-400"
      style={{
        background: "rgba(255,255,255,0.78)",
        backdropFilter: "blur(24px) saturate(200%)",
        WebkitBackdropFilter: "blur(24px) saturate(200%)",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "1px solid transparent",
      }}
    >
      <div className="container">
        <div className="flex items-center justify-between h-[68px] lg:h-[76px]">
          <Link to="/" className="flex-shrink-0">
            <BrandLogo className="h-12 lg:h-14 w-auto" />
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {links.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className="px-4 py-2 rounded-full text-[14px] font-medium transition-all duration-200"
                style={({ isActive }) => isActive
                  ? { background: "#a20d0f", color: "#FFFFFF" }
                  : { color: "#444444" }
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
              style={{ color: "#111111" }}
            >
              <Phone size={14} strokeWidth={2.4} />
              +7 910 277-52-12
            </a>
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{ background: open ? "rgba(0,0,0,0.06)" : "transparent", color: "#111111" }}
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
              background: "rgba(255,255,255,0.96)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              borderTop: "1px solid rgba(0,0,0,0.06)",
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
                    : { color: "#444444" }
                  }
                >
                  {label}
                </NavLink>
              ))}
              <div className="pt-3 mt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                <a href="tel:+79102775212" className="flex items-center gap-2 px-4 py-3 text-[15px] font-semibold" style={{ color: "#111111" }}>
                  <Phone size={15} />
                  +7 910 277-52-12
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
