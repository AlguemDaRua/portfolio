"use client";

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { ScrambleText } from "@/components/ui/ScrambleText";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const SECTIONS = [
  { id: "about", navKey: "about", num: "01" },
  { id: "work", navKey: "work", num: "02" },
  { id: "skills", navKey: "skills", num: "03" },
  { id: "resume", navKey: "resume", num: "04" },
  { id: "contact", navKey: "contact", num: "05" },
] as const;

export function SideRail() {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState<string>("");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let animationFrame: number | null = null;

    const updateScrollState = () => {
      animationFrame = null;

      const scrollY = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const innerHeight = window.innerHeight;
      const maxScroll = scrollHeight - innerHeight;
      const progress = maxScroll > 0 ? Math.round((scrollY / maxScroll) * 100) : 0;
      setScrollProgress((current) => (current === progress ? current : progress));

      const currentSection = SECTIONS.reduce<string>((current, { id }) => {
        const section = document.getElementById(id);
        return section && section.getBoundingClientRect().top <= innerHeight * 0.38
          ? id
          : current;
      }, "");

      setActiveSection((current) =>
        current === currentSection ? current : currentSection,
      );
    };

    const handleScroll = () => {
      if (animationFrame !== null) return;
      animationFrame = window.requestAnimationFrame(updateScrollState);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
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
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            className={activeSection === section.id ? "active" : ""}
            href={`#${section.id}`}
            onClick={closeMenu}
            aria-label={t.nav[section.navKey]}
            aria-current={activeSection === section.id ? "location" : undefined}
          >
            <span className="rail-number">{section.num}</span>
            <span className="rail-label">
              <ScrambleText text={t.nav[section.navKey]} />
            </span>
          </a>
        ))}
      </nav>

      <div className="rail-bottom">
        <ThemeToggle />

        <div className="rail-bottom-meta">
          <LanguageToggle />
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
