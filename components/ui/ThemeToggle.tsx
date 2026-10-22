"use client";

import { Moon, Sun } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";

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
        <Sun aria-hidden="true" />
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
        <Moon aria-hidden="true" />
        <span>{t.theme.dark}</span>
      </button>
    </div>
  );
}
