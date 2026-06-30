import { useEffect, useState } from "react";

type ThemePref = "light" | "dark" | "system";

function getSystemDark() {
  return typeof window !== "undefined"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : false;
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
    return "system";
  });

  const [systemDark, setSystemDark] = useState(getSystemDark);

  // Derive isDark synchronously from state — no DOM read
  const isDark = pref === "dark" || (pref === "system" && systemDark);

  // Apply to DOM whenever isDark changes
  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  // Persist preference
  useEffect(() => {
    if (pref === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", pref);
  }, [pref]);

  // Track system preference changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggle = () => setPref(isDark ? "light" : "dark");

  return { isDark, toggle };
}
