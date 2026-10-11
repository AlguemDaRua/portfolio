"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { flushSync } from "react-dom";
import {
  applyThemeDropVariables,
  clearThemeDropVariables,
  createThemeTransition,
  type ThemeMode,
  THEME_DROP_COUNT,
} from "@/lib/theme-paint";

interface ThemeContextValue {
  theme: ThemeMode;
  changeTheme: (nextTheme: ThemeMode) => void;
}

const THEME_STORAGE_KEY = "azam-portfolio-theme";
const themeListeners = new Set<() => void>();

let activeViewTransition: ViewTransition | null = null;
let activeTransitionVersion = 0;

function readStoredTheme(): ThemeMode | null {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === "light" || storedTheme === "dark" ? storedTheme : null;
  } catch {
    return null;
  }
}

function getSystemTheme(): ThemeMode {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getThemeSnapshot(): ThemeMode {
  const storedTheme = readStoredTheme();
  if (storedTheme) return storedTheme;

  const documentTheme = document.documentElement.getAttribute("data-theme");
  if (documentTheme === "light" || documentTheme === "dark") return documentTheme;

  return getSystemTheme();
}

function getServerThemeSnapshot(): ThemeMode {
  return "light";
}

function notifyThemeListeners() {
  themeListeners.forEach((listener) => listener());
}

function subscribeTheme(callback: () => void) {
  themeListeners.add(callback);

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;

    const nextTheme = readStoredTheme() ?? getSystemTheme();
    document.documentElement.setAttribute("data-theme", nextTheme);
    callback();
  };

  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  const handleSystemThemeChange = (event: MediaQueryListEvent) => {
    if (readStoredTheme()) return;

    document.documentElement.setAttribute(
      "data-theme",
      event.matches ? "dark" : "light",
    );
    callback();
  };

  window.addEventListener("storage", handleStorage);
  systemTheme.addEventListener("change", handleSystemThemeChange);

  return () => {
    themeListeners.delete(callback);
    window.removeEventListener("storage", handleStorage);
    systemTheme.removeEventListener("change", handleSystemThemeChange);
  };
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute("data-theme", theme);

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Keep the in-memory theme working when storage is unavailable.
  }

  notifyThemeListeners();
}

function cleanupThemeTransition(root: HTMLElement, version: number) {
  if (version !== activeTransitionVersion) return;

  clearThemeDropVariables(root, THEME_DROP_COUNT);
  root.classList.remove("theme-transitioning");
  activeViewTransition = null;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  const changeTheme = useCallback((nextTheme: ThemeMode) => {
    if (nextTheme === getThemeSnapshot()) return;

    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion || typeof document.startViewTransition !== "function") {
      activeViewTransition?.skipTransition();
      activeViewTransition = null;
      activeTransitionVersion += 1;
      clearThemeDropVariables(root, THEME_DROP_COUNT);
      root.classList.remove("theme-transitioning");
      applyTheme(nextTheme);
      return;
    }

    const transition = createThemeTransition(
      nextTheme,
      window.innerWidth,
      window.innerHeight,
    );

    activeViewTransition?.skipTransition();
    activeViewTransition = null;
    const version = ++activeTransitionVersion;

    applyThemeDropVariables(root, transition.drops);
    root.classList.add("theme-transitioning");

    let viewTransition: ViewTransition;

    try {
      viewTransition = document.startViewTransition(() => {
        flushSync(() => applyTheme(nextTheme));
      });
    } catch {
      applyTheme(nextTheme);
      cleanupThemeTransition(root, version);
      return;
    }

    activeViewTransition = viewTransition;
    void viewTransition.finished.then(
      () => cleanupThemeTransition(root, version),
      () => cleanupThemeTransition(root, version),
    );
  }, []);

  const value = useMemo(() => ({ theme, changeTheme }), [theme, changeTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
