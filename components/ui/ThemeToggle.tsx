"use client";

import React from "react";
import { SunIcon, MoonIcon } from "./Icons";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";

export function ThemeToggle() {
  const { t } = useLanguage();
  const { theme, changeTheme, isPainting } = useTheme();

  return (
    <div
      className="grid grid-cols-2 gap-0.5 p-0.5 rounded-lg bg-soft border border-line relative overflow-hidden"
      role="group"
      aria-label={t.theme.label}
    >
      <button
        type="button"
        onClick={() => changeTheme("light")}
        aria-pressed={theme === "light"}
        aria-label={t.theme.lightAction}
        title={t.theme.light}
        disabled={isPainting}
        className={`relative h-6 flex items-center justify-center gap-1.5 px-1.5 rounded-md text-[10px] font-mono transition-all duration-300 group ${
          theme === "light"
            ? "bg-paper text-amber-500 shadow-xs font-semibold scale-100"
            : "text-subtle hover:text-ink hover:scale-95"
        } ${isPainting ? "cursor-wait opacity-80" : ""}`}
      >
        <span
          className={`transition-transform duration-500 ${
            theme === "light" ? "rotate-90 scale-110 text-amber-500" : "group-hover:rotate-45"
          }`}
        >
          <SunIcon className="w-3.5 h-3.5" />
        </span>
        <span className="hidden sm:inline text-[9px]">{t.theme.light}</span>
      </button>

      <button
        type="button"
        onClick={() => changeTheme("dark")}
        aria-pressed={theme === "dark"}
        aria-label={t.theme.darkAction}
        title={t.theme.dark}
        disabled={isPainting}
        className={`relative h-6 flex items-center justify-center gap-1.5 px-1.5 rounded-md text-[10px] font-mono transition-all duration-300 group ${
          theme === "dark"
            ? "bg-paper text-indigo-400 shadow-xs font-semibold scale-100"
            : "text-subtle hover:text-ink hover:scale-95"
        } ${isPainting ? "cursor-wait opacity-80" : ""}`}
      >
        <span
          className={`transition-transform duration-500 ${
            theme === "dark" ? "-rotate-12 scale-110 text-indigo-400" : "group-hover:-rotate-24"
          }`}
        >
          <MoonIcon className="w-3.5 h-3.5" />
        </span>
        <span className="hidden sm:inline text-[9px]">{t.theme.dark}</span>
      </button>
    </div>
  );
}
