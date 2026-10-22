"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { flushSync } from "react-dom";
import type { ThemeMode } from "@/lib/theme-water";
import { cancelWaterChange, runWaterChange } from "@/lib/water-change";

interface ThemeContextValue {
  theme: ThemeMode;
  changeTheme: (nextTheme: ThemeMode) => void;
}

const THEME_STORAGE_KEY = "azam-portfolio-theme";
const themeListeners = new Set<() => void>();

/** The theme being animated towards, so a second click cannot restart it. */
let activeTarget: ThemeMode | null = null;

function cancelThemeTransition() {
  activeTarget = null;
  cancelWaterChange();
}

function readStoredTheme(): ThemeMode | null {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === "light" || storedTheme === "dark"
      ? storedTheme
      : null;
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
  if (documentTheme === "light" || documentTheme === "dark")
    return documentTheme;

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

    cancelThemeTransition();
    const nextTheme = readStoredTheme() ?? getSystemTheme();
    document.documentElement.setAttribute("data-theme", nextTheme);
    callback();
  };

  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  const handleSystemThemeChange = (event: MediaQueryListEvent) => {
    if (readStoredTheme()) return;

    cancelThemeTransition();

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
    if (themeListeners.size === 0) cancelThemeTransition();
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

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  const changeTheme = useCallback((nextTheme: ThemeMode) => {
    if (nextTheme === (activeTarget ?? getThemeSnapshot())) return;

    const departingTheme = getThemeSnapshot();

    // One water engine for both switches: the old page is copied, the new
    // theme is committed underneath it, and the ripples erase the copy.
    const { animated } = runWaterChange({
      apply: () => flushSync(() => applyTheme(nextTheme)),
      departing: departingTheme,
      arriving: nextTheme,
      onSettle: () => {
        if (activeTarget === nextTheme) activeTarget = null;
      },
    });

    activeTarget = animated ? nextTheme : null;
  }, []);

  const value = useMemo(() => ({ theme, changeTheme }), [theme, changeTheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
