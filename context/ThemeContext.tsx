"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { flushSync } from "react-dom";
import { createThemeSnapshot, type ThemeSnapshot } from "@/lib/theme-snapshot";
import {
  createWaterReveal,
  createWaterTransition,
  type ThemeMode,
  WATER_DURATION_MS,
} from "@/lib/theme-water";

interface ThemeContextValue {
  theme: ThemeMode;
  changeTheme: (nextTheme: ThemeMode) => void;
}

const THEME_STORAGE_KEY = "azam-portfolio-theme";
const themeListeners = new Set<() => void>();

let activeTransitionVersion = 0;
let activeTarget: ThemeMode | null = null;
let disposeActiveTransition: (() => void) | null = null;

function cancelThemeTransition() {
  // Invalidate completion callbacks from any previous water session.
  activeTransitionVersion += 1;
  disposeActiveTransition?.();
  disposeActiveTransition = null;
  activeTarget = null;
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

function supportsWaterMask(): boolean {
  if (typeof CSS === "undefined" || typeof CSS.supports !== "function")
    return false;

  return (
    CSS.supports("mask-image", "linear-gradient(black, black)") ||
    CSS.supports("-webkit-mask-image", "linear-gradient(black, black)")
  );
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

    cancelThemeTransition();
    const root = document.documentElement;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches || document.hidden || !supportsWaterMask()) {
      applyTheme(nextTheme);
      return;
    }

    const source = document.querySelector<HTMLElement>(".site-shell");
    if (!source) {
      applyTheme(nextTheme);
      return;
    }

    const version = activeTransitionVersion;
    let snapshot: ThemeSnapshot | null = null;
    let reveal: ReturnType<typeof createWaterReveal>;
    root.classList.add("theme-transitioning");
    try {
      snapshot = createThemeSnapshot(source);
      reveal = createWaterReveal(
        createWaterTransition(nextTheme, root.clientWidth, root.clientHeight),
        snapshot.element,
      );
    } catch {
      snapshot?.dispose();
      root.classList.remove("theme-transitioning");
      applyTheme(nextTheme);
      return;
    }
    activeTarget = nextTheme;

    const finish = () => {
      if (version !== activeTransitionVersion) return;
      cancelThemeTransition();
      // Keep the requested theme even if the water was interrupted or failed.
      applyTheme(nextTheme);
    };
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const onScroll = () => {
      // A pending scroll event from focusing/clicking the toggle can arrive
      // after setup. Only invalidate the copy if its coordinates changed.
      if (window.scrollX !== scrollX || window.scrollY !== scrollY) finish();
    };
    const onVisibilityChange = () => {
      if (document.hidden) finish();
    };
    const onMotionChange = () => {
      if (motion.matches) finish();
    };
    const watchdog = window.setTimeout(
      finish,
      WATER_DURATION_MS + 2_000,
    );
    window.addEventListener("resize", finish);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    motion.addEventListener("change", onMotionChange);

    disposeActiveTransition = () => {
      reveal.dispose();
      snapshot?.dispose();
      window.clearTimeout(watchdog);
      window.removeEventListener("resize", finish);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motion.removeEventListener("change", onMotionChange);
      root.classList.remove("theme-transitioning");
    };

    // The old copy already covers the viewport. Commit the actual React tree
    // underneath it, then peel it away with a drop of water. No UA sniffing,
    // View Transitions API, or WAAPI pseudo-element support is required.
    try {
      flushSync(() => applyTheme(nextTheme));
      reveal.play(finish);
    } catch {
      finish();
    }
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
