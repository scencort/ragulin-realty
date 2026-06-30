import { useEffect, useState } from "react";

type ThemePref = "light" | "dark" | "system";

function applyTheme(pref: ThemePref) {
  const root = document.documentElement;
  if (pref === "dark") {
    root.classList.add("dark");
  } else if (pref === "light") {
    root.classList.remove("dark");
  } else {
    // system
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    prefersDark ? root.classList.add("dark") : root.classList.remove("dark");
  }
}

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
    return "system";
  });

  const isDark = typeof document !== "undefined"
    ? document.documentElement.classList.contains("dark")
    : false;

  useEffect(() => {
    applyTheme(pref);
    if (pref === "system") {
      localStorage.removeItem("theme");
    } else {
      localStorage.setItem("theme", pref);
    }
  }, [pref]);

  // Follow system changes when pref === "system"
  useEffect(() => {
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      e.matches
        ? document.documentElement.classList.add("dark")
        : document.documentElement.classList.remove("dark");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [pref]);

  const toggle = () => {
    const currentlyDark = document.documentElement.classList.contains("dark");
    setPref(currentlyDark ? "light" : "dark");
  };

  return { isDark, toggle };
}
