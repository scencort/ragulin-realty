const FAVORITES_KEY = "ragulin_favorites";

function readFavorites(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "number") : [];
  } catch {
    return [];
  }
}

function writeFavorites(ids: number[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent("favorites-updated"));
}

export function getFavoriteIds(): number[] {
  return readFavorites();
}

export function isFavorite(id: number): boolean {
  return readFavorites().includes(id);
}

export function toggleFavorite(id: number): boolean {
  const current = readFavorites();
  const next = current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id];
  writeFavorites(next);
  return next.includes(id);
}
