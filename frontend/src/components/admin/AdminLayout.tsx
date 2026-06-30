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
        className="w-60 flex flex-col fixed inset-y-0 left-0 z-40"
        style={{
          background: "var(--surface)",
          borderRight: "1px solid var(--border-lg)",
        }}
      >
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <BrandLogo className="h-10 w-auto" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] mt-2" style={{ color: "var(--ink-5)" }}>
            Администратор
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150"
              style={({ isActive }) => isActive
                ? { background: "#a20d0f", color: "#fff" }
                : { color: "var(--ink-3)" }
              }
            >
              <Icon size={16} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 space-y-0.5" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150"
            style={{ color: "var(--ink-4)" }}
          >
            {isDark ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
            {isDark ? "Светлая тема" : "Тёмная тема"}
          </button>
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150"
            style={{ color: "var(--ink-4)" }}
          >
            <Home size={16} strokeWidth={2} />
            На сайт
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150"
            style={{ color: "var(--ink-4)" }}
          >
            <LogOut size={16} strokeWidth={2} />
            Выйти
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 ml-60">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
