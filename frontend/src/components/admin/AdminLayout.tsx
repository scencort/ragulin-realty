import { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Building2, MessageSquare, Search, LogOut, Home, Sun, Moon,
} from "lucide-react";
import { removeToken } from "@/utils/auth";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { useTheme } from "@/hooks/useTheme";

const nav = [
  { to: "/admin", label: "Панель", Icon: LayoutDashboard, end: true },
  { to: "/admin/properties", label: "Объекты", Icon: Building2, end: false },
  { to: "/admin/reviews", label: "Отзывы", Icon: MessageSquare, end: false },
  { to: "/admin/seo", label: "SEO", Icon: Search, end: false },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();

  const logout = () => {
    removeToken();
    navigate("/admin/login");
  };

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Sidebar */}
      <aside
        className="w-72 flex flex-col fixed inset-y-0 left-0 z-40"
        style={{
          background: "var(--surface)",
          borderRight: "1px solid var(--border-lg)",
        }}
      >
        {/* Logo */}
        <div className="px-6 py-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <BrandLogo className="h-12 w-auto" />
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] mt-3" style={{ color: "var(--ink-5)" }}>
            Администратор
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {nav.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="flex items-center gap-3.5 px-5 py-3 rounded-2xl text-[15px] font-medium transition-all duration-150"
              style={({ isActive }) => isActive
                ? { background: "#a20d0f", color: "#fff" }
                : { color: "var(--ink-3)" }
              }
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-4 space-y-1" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3.5 px-5 py-3 rounded-2xl text-[15px] font-medium transition-all duration-150"
            style={{ color: "var(--ink-4)" }}
          >
            {isDark ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
            {isDark ? "Светлая тема" : "Тёмная тема"}
          </button>
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-3.5 px-5 py-3 rounded-2xl text-[15px] font-medium transition-all duration-150"
            style={{ color: "var(--ink-4)" }}
          >
            <Home size={18} strokeWidth={2} />
            На сайт
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3.5 px-5 py-3 rounded-2xl text-[15px] font-medium transition-all duration-150"
            style={{ color: "var(--ink-4)" }}
          >
            <LogOut size={18} strokeWidth={2} />
            Выйти
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 ml-72">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
