"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { portfolioContent } from "@/data/content";
import type { Locale, TranslationContent } from "@/data/types";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationContent;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const LOCALE_STORAGE_KEY = "azam-portfolio-locale";
const listeners = new Set<() => void>();

function readStoredLocale(): Locale | null {
  try {
    const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return storedLocale === "pt" || storedLocale === "en" ? storedLocale : null;
  } catch {
    return null;
  }
}

function getLocaleSnapshot(): Locale {
  const storedLocale = readStoredLocale();
  if (storedLocale) return storedLocale;

  return document.documentElement.lang === "en" ? "en" : "pt";
}

function getServerLocaleSnapshot(): Locale {
  return "pt";
}

function subscribeLocale(callback: () => void) {
  listeners.add(callback);

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== LOCALE_STORAGE_KEY && event.key !== null) return;

    document.documentElement.lang = readStoredLocale() ?? "pt";
    callback();
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", handleStorage);
  };
}

function notifyLocaleListeners() {
  listeners.forEach((listener) => listener());
}

function commitLocale(nextLocale: Locale) {
  document.documentElement.lang = nextLocale;

  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
  } catch {
    // Keep the in-memory language working when storage is unavailable.
  }

  notifyLocaleListeners();
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribeLocale,
    getLocaleSnapshot,
    getServerLocaleSnapshot,
  );

  // Switching language commits immediately; the copy then re-enters letter by
  // letter on its own (`ScrambleText`), so the page never moves and no water
  // runs for words alone.
  const setLocale = useCallback((nextLocale: Locale) => {
    if (nextLocale === getLocaleSnapshot()) return;
    commitLocale(nextLocale);
  }, []);

  return (
    <LanguageContext.Provider
      value={{ locale, setLocale, t: portfolioContent[locale] }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
