import { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Building2, MessageSquare, Search, LogOut, ChevronRight, Home,
} from "lucide-react";
import { removeToken } from "@/utils/auth";
import { BrandLogo } from "@/components/ui/BrandLogo";

const nav = [
  { to: "/admin", label: "Панель", Icon: LayoutDashboard, end: true },
  { to: "/admin/properties", label: "Объекты", Icon: Building2, end: false },
  { to: "/admin/reviews", label: "Отзывы", Icon: MessageSquare, end: false },
  { to: "/admin/seo", label: "SEO", Icon: Search, end: false },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const logout = () => {
    removeToken();
    navigate("/admin/login");
  };

  return (
    <div className="flex min-h-screen bg-[#F8F8F8]">
      <aside className="w-56 flex flex-col fixed inset-y-0 left-0 z-40" style={{ background: "#111111" }}>
        <div className="p-5 border-b border-white/10">
          <BrandLogo className="h-6 w-auto" dark />
          <p className="text-xs text-white/40 mt-1.5">Администратор</p>
        </div>

        <nav className="flex-1 p-3">
          {nav.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg mb-0.5 transition-all duration-150"
              style={({ isActive }) => isActive
                ? { background: "#E31E24", color: "#fff" }
                : { color: "rgba(255,255,255,0.5)" }
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/60 hover:text-white transition-colors"
          >
            <Home size={16} /> Сайт
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/60 hover:text-white transition-colors"
          >
            <LogOut size={16} /> Выйти
          </button>
        </div>
      </aside>

      <div className="flex-1 ml-56">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
