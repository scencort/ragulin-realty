export function formatPrice(price: number): string {
  const n = Number(price);
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${m % 1 === 0 ? m : m.toFixed(1)} млн ₽`;
  }
  return new Intl.NumberFormat("ru-RU", {
    style: "currency", currency: "RUB", maximumFractionDigits: 0,
  }).format(n);
}

export function formatArea(area: number): string {
  const n = Number(area);
  return `${n % 1 === 0 ? n : n.toFixed(1)} м²`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export function getImageUrl(path: string): string {
  if (!path) return "/placeholder.jpg";
  if (path.startsWith("http")) return path;
  return `/static/${path.replace(/^static\//, "")}`;
}

export function pluralRooms(rooms: number): string {
  if (rooms === 1) return "1-комн.";
  if (rooms === 2) return "2-комн.";
  if (rooms === 3) return "3-комн.";
  if (rooms >= 4) return `${rooms}-комн.`;
  return "Студия";
}
