import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

function WAIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="white"/>
    </svg>
  );
}

function TGIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" fill="white"/>
    </svg>
  );
}

function MaxIcon() {
  return <img src="https://maxicons.ru/icons/Max_logo.svg" alt="MAX" width={18} height={18} />;
}

function IGIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.332.014 7.052.072 2.695.272.273 2.69.073 7.052.014 8.332 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.332 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.668-.072-4.948-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" fill="white"/>
    </svg>
  );
}

const messengers = [
  { href: "https://wa.me/79102775212",  label: "WhatsApp",  Icon: WAIcon,  bg: "#25D366", shadow: "#25D36640" },
  { href: "https://t.me/+79102775212",  label: "Telegram",  Icon: TGIcon,  bg: "#0088cc", shadow: "#0088cc40" },
  { href: "https://max.ru/u/79102775212", label: "MAX",      Icon: MaxIcon, bg: "#0077FF", shadow: "#0077FF40" },
  { href: "https://www.instagram.com/ragulin.realestate/", label: "Instagram", Icon: IGIcon, bg: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)", shadow: "rgba(220,39,67,0.35)" },
];

export default function Footer() {
  return (
    <footer style={{ background: "var(--surface-2)", borderTop: "1px solid var(--border)" }}>
      <div className="container py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <BrandLogo className="h-14 w-auto mb-6" />
            <p className="max-w-sm" style={{ fontSize: "14px", color: "var(--ink-3)", lineHeight: 1.65 }}>
              Рагулин Роман Александрович — эксперт по недвижимости.
              Работаю в компании «Этажи», Москва.
              Профессиональный подбор и сопровождение сделок.
            </p>
            <div className="mt-7 flex items-center gap-2.5">
              {messengers.map(({ href, label, Icon, bg, shadow }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: bg, boxShadow: `0 4px 12px ${shadow}` }}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-5" style={{ color: "var(--ink-4)" }}>
              Навигация
            </p>
            <ul className="space-y-3">
              {[
                ["/",        "Главная"],
                ["/catalog", "Объекты"],
                ["/about",   "О специалисте"],
                ["/reviews", "Отзывы"],
                ["/contacts","Контакты"],
              ].map(([to, label]) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-[14px] transition-colors py-1 block"
                    style={{ color: "var(--ink-3)" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "var(--ink)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "var(--ink-3)"; }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-5" style={{ color: "var(--ink-4)" }}>
              Контакты
            </p>
            <ul className="space-y-4">
              {[
                { Icon: MapPin, text: "Москва, Балтийская 9",           href: undefined as string | undefined },
                { Icon: Phone,  text: "+7 910 277-52-12",               href: "tel:+79102775212" },
                { Icon: Mail,   text: "r.a.ragulin@msk.etagi.com",      href: "mailto:r.a.ragulin@msk.etagi.com" },
              ].map(({ Icon, text, href }) => (
                <li key={text} className="flex items-start gap-3">
                  <Icon size={15} className="mt-0.5 flex-shrink-0 text-red" strokeWidth={1.8} />
                  {href
                    ? <a href={href} className="text-[14px] break-all transition-colors" style={{ color: "var(--ink-3)" }}
                         onMouseEnter={e => { e.currentTarget.style.color = "var(--ink)"; }}
                         onMouseLeave={e => { e.currentTarget.style.color = "var(--ink-3)"; }}>{text}</a>
                    : <span className="text-[14px]" style={{ color: "var(--ink-3)" }}>{text}</span>
                  }
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-[12px]" style={{ color: "var(--ink-4)" }}>
            © {new Date().getFullYear()} Рагулин Роман Александрович
          </p>
          <p className="text-[12px]" style={{ color: "var(--ink-4)" }}>
            Эксперт компании «Этажи» · Москва
          </p>
        </div>
      </div>
    </footer>
  );
}
