"use client";

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { ScrambleText } from "@/components/ui/ScrambleText";
import { SunIcon, MoonIcon } from "@/components/ui/Icons";

const SECTIONS = [
  { id: "about", navKey: "about", num: "01" },
  { id: "work", navKey: "work", num: "02" },
  { id: "skills", navKey: "skills", num: "03" },
  { id: "resume", navKey: "resume", num: "04" },
  { id: "contact", navKey: "contact", num: "05" },
] as const;

export function SideRail() {
  const { locale, setLocale, t } = useLanguage();
  const { theme, changeTheme, isPainting, paintTarget } = useTheme();
  const activeTheme = paintTarget ? paintTarget.theme : theme;
  const [activeSection, setActiveSection] = useState<string>("");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const scrollHeight = document.documentElement.scrollHeight;
        const innerHeight = window.innerHeight;
        const maxScroll = scrollHeight - innerHeight;
        const progress = maxScroll > 0 ? Math.round((scrollY / maxScroll) * 100) : 0;
        setScrollProgress((curr) => (curr === progress ? curr : progress));

        let current = "";
        ["about", "work", "skills", "resume", "contact"].forEach((id) => {
          const el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top <= innerHeight * 0.38) {
            current = id;
          }
        });
        setActiveSection(current);

        ticking = false;
      });
      ticking = true;
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <aside className="side-rail" aria-label="Navegação lateral">
      <a
        className="rail-brand"
        href="#top"
        aria-label="Azam Usman — Início"
        onClick={closeMenu}
      >
        <span className="rail-monogram">
          AU<span>.</span>
        </span>
        <span className="rail-name">Azam Usman</span>
      </a>

      <div className="rail-progress" aria-hidden="true">
        <span style={{ width: `${scrollProgress}%` }} />
      </div>

      <nav
        className={`rail-nav ${menuOpen ? "rail-nav-open" : ""}`}
        aria-label="Navegação principal"
      >
        {SECTIONS.map((sec) => (
          <a
            key={sec.id}
            className={activeSection === sec.id ? "active" : ""}
            href={`#${sec.id}`}
            onClick={closeMenu}
            aria-label={t.nav[sec.navKey]}
            aria-current={activeSection === sec.id ? "location" : undefined}
          >
            <span className="rail-number">{sec.num}</span>
            <span className="rail-label">
              <ScrambleText text={t.nav[sec.navKey]} />
            </span>
          </a>
        ))}
      </nav>

      <div className="rail-bottom">
        <div className="theme-switch" role="group" aria-label={t.theme.label}>
          <button
            type="button"
            className={activeTheme === "light" ? "active" : ""}
            aria-label={t.theme.lightAction}
            aria-pressed={activeTheme === "light"}
            disabled={isPainting}
            title={t.theme.light}
            onClick={() => changeTheme("light")}
          >
            <SunIcon className="w-3 h-3" />
            <span>{t.theme.light}</span>
          </button>
          <button
            type="button"
            className={activeTheme === "dark" ? "active" : ""}
            aria-label={t.theme.darkAction}
            aria-pressed={activeTheme === "dark"}
            disabled={isPainting}
            title={t.theme.dark}
            onClick={() => changeTheme("dark")}
          >
            <MoonIcon className="w-3 h-3" />
            <span>{t.theme.dark}</span>
          </button>
        </div>

        <div className="rail-bottom-meta">
          <div className="language-switch" role="group" aria-label="Idioma">
            <button
              type="button"
              className={locale === "pt" ? "active" : ""}
              aria-pressed={locale === "pt"}
              onClick={() => setLocale("pt")}
            >
              PT
            </button>
            <span>/</span>
            <button
              type="button"
              className={locale === "en" ? "active" : ""}
              aria-pressed={locale === "en"}
              onClick={() => setLocale("en")}
            >
              EN
            </button>
          </div>
          <span className="rail-location">MAPUTO · MZ</span>
        </div>

        <button
          className={`menu-toggle ${menuOpen ? "open" : ""}`}
          type="button"
          aria-label={menuOpen ? "Fechar navegação" : "Abrir navegação"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
        </button>
      </div>
    </aside>
  );
}
