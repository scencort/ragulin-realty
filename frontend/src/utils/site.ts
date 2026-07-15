export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, "") ||
  "https://ragulin-realtor.ru";

export const SITE_NAME = "Рагулин Роман";
export const TELEGRAM_USERNAME = "ragulin_roman";
export const PHONE_RAW = "+79102775212";
export const PHONE_DISPLAY = "+7 910 277-52-12";
export const WHATSAPP_LINK = `https://wa.me/${PHONE_RAW.replace(/\D/g, "")}`;
export const TELEGRAM_LINK = `https://t.me/${TELEGRAM_USERNAME}`;
export const MAX_LINK = "https://max.ru/u/79102775212";

export function buildCanonical(path = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}

export function buildWhatsAppLink(message?: string): string {
  if (!message) return WHATSAPP_LINK;
  return `${WHATSAPP_LINK}?text=${encodeURIComponent(message)}`;
}

export function buildTelegramLink(message?: string): string {
  if (!message) return TELEGRAM_LINK;
  return `${TELEGRAM_LINK}?text=${encodeURIComponent(message)}`;
}
