"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { MoonIcon, SunIcon } from "./Icons";

export function ThemeToggle() {
  const { t } = useLanguage();
  const { theme, changeTheme } = useTheme();

  return (
    <div className="theme-switch" role="group" aria-label={t.theme.label}>
      <button
        type="button"
        className={theme === "light" ? "active" : ""}
        aria-label={t.theme.lightAction}
        aria-pressed={theme === "light"}
        title={t.theme.light}
        onClick={() => changeTheme("light")}
      >
        <SunIcon />
        <span>{t.theme.light}</span>
      </button>
      <button
        type="button"
        className={theme === "dark" ? "active" : ""}
        aria-label={t.theme.darkAction}
        aria-pressed={theme === "dark"}
        title={t.theme.dark}
        onClick={() => changeTheme("dark")}
      >
        <MoonIcon />
        <span>{t.theme.dark}</span>
      </button>
    </div>
  );
}
