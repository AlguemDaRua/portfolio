"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";

export interface PaintSplash {
  x: number;
  y: number;
  size: number;
  grow: number;
  turn: number;
  delay: number;
  duration: number;
  variant: number;
}

export interface PaintSheet {
  x: number;
  y: number;
  size: number;
  grow: number;
  turn: number;
  delay: number;
  variant: number;
}

export interface PaintTarget {
  theme: "light" | "dark";
  splashes: PaintSplash[];
  sheet: PaintSheet;
}

interface ThemeContextValue {
  theme: "light" | "dark";
  paintTarget: PaintTarget | null;
  isPainting: boolean;
  changeTheme: (nextTheme: "light" | "dark") => void;
}

const THEME_STORAGE_KEY = "azam-portfolio-theme";
const themeListeners = new Set<() => void>();

function subscribeTheme(callback: () => void) {
  themeListeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    themeListeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getThemeSnapshot(): "light" | "dark" {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as "light" | "dark" | null;
    if (saved === "light" || saved === "dark") return saved;
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  } catch {
    // Ignore
  }
  return "light";
}

function getServerThemeSnapshot(): "light" | "dark" {
  return "light";
}

function notifyThemeListeners() {
  themeListeners.forEach((listener) => listener());
}

export const PAINT_BLOB_PATH_COUNT = 3;

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);
  const [paintTarget, setPaintTarget] = useState<PaintTarget | null>(null);
  const paintTimers = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      paintTimers.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const applyTheme = (nextTheme: "light" | "dark") => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      document.documentElement.setAttribute("data-theme", nextTheme);
      notifyThemeListeners();
    } catch {
      // Ignore
    }
  };

  const changeTheme = (nextTheme: "light" | "dark") => {
    if (nextTheme === theme || paintTarget !== null) return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (reduceMotion) {
      applyTheme(nextTheme);
      return;
    }

    // 24 grid positions shuffled for uniform screen coverage with natural jitter
    const cells = Array.from({ length: 24 }, (_, index) => ({
      column: index % 6,
      row: Math.floor(index / 6),
    }));

    for (let i = cells.length - 1; i > 0; i -= 1) {
      const swap = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[swap]] = [cells[swap], cells[i]];
    }

    const positions = cells.map(({ column, row }) => ({
      x: Math.round((column + 0.5 + (Math.random() - 0.5) * 0.92) * (100 / 6) * 10) / 10,
      y: Math.round((row + 0.5 + (Math.random() - 0.5) * 0.92) * 25 * 10) / 10,
    }));

    // 8 edge splashes to guarantee full peripheral coverage
    for (let i = 0; i < 8; i += 1) {
      positions.push({
        x: -12 + Math.random() * 124,
        y: -14 + Math.random() * 128,
      });
    }

    const splashes: PaintSplash[] = positions.map(({ x, y }) => ({
      x,
      y,
      size: Math.round(6 + Math.random() * 15),
      grow: Number((2.2 + Math.random() * 4.8).toFixed(2)),
      turn: Math.round(Math.random() * 360),
      delay: Math.round(Math.random() * 700),
      duration: Math.round(1200 + Math.random() * 550),
      variant: Math.floor(Math.random() * PAINT_BLOB_PATH_COUNT),
    }));

    const sheet: PaintSheet = {
      x: Math.round(-8 + Math.random() * 116),
      y: Math.round(-8 + Math.random() * 116),
      size: Math.round(56 + Math.random() * 14),
      grow: Number((5 + Math.random() * 1.1).toFixed(2)),
      turn: Math.round(Math.random() * 360),
      delay: Math.round(80 + Math.random() * 300),
      variant: Math.floor(Math.random() * PAINT_BLOB_PATH_COUNT),
    };

    setPaintTarget({ theme: nextTheme, splashes, sheet });

    // Switch DOM theme at 2300ms when paint completely covers the viewport
    const switchTimer = window.setTimeout(() => applyTheme(nextTheme), 2300);
    // Finish animation and clear paint layers at 2980ms
    const finishTimer = window.setTimeout(() => setPaintTarget(null), 2980);
    paintTimers.current = [switchTimer, finishTimer];
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        paintTarget,
        isPainting: paintTarget !== null,
        changeTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
