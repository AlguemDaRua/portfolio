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
  createThemePaint,
  createThemeTransition,
  type ThemeMode,
  THEME_TRANSITION_DURATION_MS,
} from "@/lib/theme-paint";

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
  // Invalidate pending update callbacks too: skipTransition does not cancel them.
  activeTransitionVersion += 1;
  disposeActiveTransition?.();
  disposeActiveTransition = null;
  activeTarget = null;
}

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

function supportsPaintMasks(): boolean {
  if (typeof CSS === "undefined" || typeof CSS.supports !== "function") return false;

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
    if (
      motion.matches ||
      document.hidden ||
      !supportsPaintMasks() ||
      typeof document.startViewTransition !== "function"
    ) {
      applyTheme(nextTheme);
      return;
    }

    const version = activeTransitionVersion;
    let paint: ReturnType<typeof createThemePaint>;
    try {
      paint = createThemePaint(createThemeTransition(
        nextTheme,
        window.innerWidth,
        window.innerHeight,
      ));
    } catch {
      applyTheme(nextTheme);
      return;
    }

    let viewTransition: ViewTransition | null = null;
    let keepAlive: Animation | null = null;
    activeTarget = nextTheme;
    root.classList.add("theme-transitioning");

    const finish = () => {
      if (version !== activeTransitionVersion) return;
      cancelThemeTransition();
      // A resize/motion change can happen even before the update callback ran.
      // Commit the requested theme synchronously instead of leaving it pending.
      applyTheme(nextTheme);
    };
    const onVisibilityChange = () => {
      if (document.hidden) finish();
    };
    const onMotionChange = () => {
      if (motion.matches) finish();
    };
    const watchdog = window.setTimeout(finish, THEME_TRANSITION_DURATION_MS + 2_000);
    window.addEventListener("resize", finish);
    window.addEventListener("scroll", finish, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    motion.addEventListener("change", onMotionChange);

    disposeActiveTransition = () => {
      viewTransition?.skipTransition();
      keepAlive?.cancel();
      paint.dispose();
      window.clearTimeout(watchdog);
      window.removeEventListener("resize", finish);
      window.removeEventListener("scroll", finish);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motion.removeEventListener("change", onMotionChange);
      root.classList.remove("theme-transitioning");
    };

    try {
      viewTransition = document.startViewTransition(() => {
        if (version !== activeTransitionVersion) return;
        flushSync(() => applyTheme(nextTheme));
      });
    } catch {
      finish();
      return;
    }

    void viewTransition.ready.then(() => {
      if (version !== activeTransitionVersion) return;
      // With the UA fades disabled the browser would immediately discard the
      // snapshots. A constant-opacity WAAPI animation keeps them alive for rAF.
      keepAlive = root.animate(
        [{ opacity: 1 }, { opacity: 1 }],
        { duration: THEME_TRANSITION_DURATION_MS, iterations: Infinity,
          pseudoElement: "::view-transition-new(root)" },
      );
      paint.play(finish);
    }).catch(finish);
    void viewTransition.finished.then(finish, finish);
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
