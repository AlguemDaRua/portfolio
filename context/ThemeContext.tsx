"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  createPaintTarget,
  PAINT_ANIMATION_DURATION_MS,
  type PaintTarget,
  type ThemeMode,
} from "@/lib/theme-paint";

interface ThemeContextValue {
  theme: ThemeMode;
  paintTarget: PaintTarget | null;
  paintId: number;
  changeTheme: (nextTheme: ThemeMode) => void;
}

const THEME_STORAGE_KEY = "azam-portfolio-theme";
const themeListeners = new Set<() => void>();

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
    // Keep the in-memory theme working even when storage is unavailable.
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
  const [paintTarget, setPaintTarget] = useState<PaintTarget | null>(null);
  const [paintId, setPaintId] = useState(0);

  useEffect(() => {
    if (!paintTarget) return;

    const timeout = window.setTimeout(
      () => setPaintTarget(null),
      PAINT_ANIMATION_DURATION_MS,
    );

    return () => window.clearTimeout(timeout);
  }, [paintTarget]);

  const changeTheme = useCallback((nextTheme: ThemeMode) => {
    if (nextTheme === getThemeSnapshot()) return;

    // Update the document and saved preference before starting the decoration.
    // The animation never gates or delays the actual theme change.
    applyTheme(nextTheme);

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      setPaintTarget(null);
      return;
    }

    setPaintId((currentId) => currentId + 1);
    setPaintTarget(createPaintTarget(nextTheme));
  }, []);

  const value = useMemo(
    () => ({ theme, paintTarget, paintId, changeTheme }),
    [theme, paintTarget, paintId, changeTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
