"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const THEME_KEY = "telos-theme";
const TRANSPARENCY_KEY = "telos-reduce-transparency";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  reduceTransparency: boolean;
  setTheme: (theme: Theme) => void;
  setReduceTransparency: (reduce: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme, reduceTransparency: boolean) {
  const resolved = theme === "system" ? systemTheme() : theme;
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.classList.toggle("reduce-transparency", reduceTransparency);
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
}

function readTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const value = window.localStorage.getItem(THEME_KEY);
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

function readTransparency(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(TRANSPARENCY_KEY) === "true";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [reduceTransparency, setReduceState] = useState(false);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const storedTheme = readTheme();
    const storedReduction = readTransparency();
    setThemeState(storedTheme);
    setReduceState(storedReduction);
    applyTheme(storedTheme, storedReduction);
    setResolvedTheme(storedTheme === "system" ? systemTheme() : storedTheme);
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      applyTheme("system", reduceTransparency);
      setResolvedTheme(systemTheme());
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme, reduceTransparency]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    window.localStorage.setItem(THEME_KEY, next);
    applyTheme(next, readTransparency());
    setResolvedTheme(next === "system" ? systemTheme() : next);
  }, []);

  const setReduceTransparency = useCallback((reduce: boolean) => {
    setReduceState(reduce);
    window.localStorage.setItem(TRANSPARENCY_KEY, String(reduce));
    applyTheme(readTheme(), reduce);
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, reduceTransparency, setTheme, setReduceTransparency }),
    [theme, resolvedTheme, reduceTransparency, setTheme, setReduceTransparency],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}

export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_KEY}')||'system';var r=localStorage.getItem('${TRANSPARENCY_KEY}')==='true';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.classList.toggle('dark',d);e.classList.toggle('reduce-transparency',r);e.dataset.theme=d?'dark':'light';e.style.colorScheme=d?'dark':'light';}catch(e){}})();`;
