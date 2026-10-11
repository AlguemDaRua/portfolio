"use client";

import { useLanguage } from "@/context/LanguageContext";

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      className="language-switch"
      role="group"
      aria-label="Selecionar idioma / Select language"
    >
      <button
        type="button"
        className={locale === "pt" ? "active" : ""}
        aria-label="Português"
        aria-pressed={locale === "pt"}
        onClick={() => setLocale("pt")}
      >
        PT
      </button>
      <span aria-hidden="true">/</span>
      <button
        type="button"
        className={locale === "en" ? "active" : ""}
        aria-label="English"
        aria-pressed={locale === "en"}
        onClick={() => setLocale("en")}
      >
        EN
      </button>
    </div>
  );
}
