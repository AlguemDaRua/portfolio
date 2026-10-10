"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      className="flex items-center gap-1 text-xs font-mono text-meta bg-soft/80 p-0.5 rounded-md border border-line"
      role="group"
      aria-label="Selecionar idioma / Select language"
    >
      <button
        type="button"
        onClick={() => setLocale("pt")}
        aria-pressed={locale === "pt"}
        className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all duration-200 ${
          locale === "pt"
            ? "bg-paper text-accent font-bold shadow-xs scale-105"
            : "text-subtle hover:text-ink"
        }`}
      >
        PT
      </button>
      <span className="text-line text-[9px]">/</span>
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all duration-200 ${
          locale === "en"
            ? "bg-paper text-accent font-bold shadow-xs scale-105"
            : "text-subtle hover:text-ink"
        }`}
      >
        EN
      </button>
    </div>
  );
}
