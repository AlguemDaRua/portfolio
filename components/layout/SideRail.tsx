"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ScrambleText } from "@/components/ui/ScrambleText";

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
  const railRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const focusFrame = requestAnimationFrame(() => {
      railRef.current
        ?.querySelector<HTMLAnchorElement>(".rail-nav a")
        ?.focus({ preventScroll: true });
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !railRef.current?.contains(event.target)
      )
        setMenuOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth > 980) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onResize);
    };
  }, [menuOpen]);

  useEffect(() => {
    let animationFrame: number | null = null;

    const updateScrollState = () => {
      animationFrame = null;

      const scrollY = window.scrollY;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress =
        maxScroll > 0
          ? Math.max(0, Math.min(100, Math.round((scrollY / maxScroll) * 100)))
          : 0;
      setScrollProgress((current) =>
        current === progress ? current : progress,
      );

      const currentSection =
        maxScroll > 0 && scrollY >= maxScroll - 2
          ? "contact"
          : SECTIONS.reduce<string>((current, { id }) => {
              const section = document.getElementById(id);
              return section &&
                section.getBoundingClientRect().top <= window.innerHeight * 0.4
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
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <aside
      ref={railRef}
      className="side-rail"
      aria-label={t.nav.label}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setMenuOpen(false);
      }}
    >
      <a
        className="rail-brand"
        href="#top"
        aria-label={`Azam Usman — ${t.nav.home}`}
        onClick={closeMenu}
      >
        <span className="rail-monogram">
          <span>
            AU<span className="monogram-dot">.</span>
          </span>
        </span>
        <span className="rail-identity">
          <span className="rail-name">Azam Usman</span>
          <ScrambleText className="rail-role" text={t.meta.role} as="span" />
        </span>
      </a>

      <div className="rail-progress" aria-hidden="true">
        <span style={{ width: `${scrollProgress}%` }} />
      </div>

      <nav
        id="site-navigation"
        className={`rail-nav ${menuOpen ? "rail-nav-open" : ""}`}
        aria-label={t.nav.label}
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
            <ScrambleText
              className="rail-label"
              text={t.nav[section.navKey]}
              as="span"
            />
          </a>
        ))}
      </nav>

      <div className="rail-bottom">
        <ThemeToggle />

        <div className="rail-bottom-meta">
          <LanguageToggle />
          <span className="rail-location">Maputo · GMT+2</span>
        </div>

        <button
          ref={menuButtonRef}
          className={`menu-toggle ${menuOpen ? "open" : ""}`}
          type="button"
          aria-label={menuOpen ? t.nav.close : t.nav.open}
          aria-controls="site-navigation"
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
