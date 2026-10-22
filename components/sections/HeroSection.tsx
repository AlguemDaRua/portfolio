"use client";

import { ArrowDown, ArrowUpRight, FileText } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { AuCard } from "@/components/ui/AuCard";

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="hero page-wrap" id="top" aria-labelledby="hero-title">
      <div className="hero-meta">
        <span>{t.meta.edition}</span>
        <span>{t.meta.location}</span>
      </div>

      <div className="hero-grid">
        <div className="hero-copy">
          <span className="status-pill">
            <span className="status-dot" aria-hidden="true" />
            {t.hero.available}
          </span>

          <h1 id="hero-title">
            <span className="hero-title-line">{t.hero.title}</span>
            <span className="hero-title-line hero-title-accent">
              {t.hero.titleAccent}
            </span>
          </h1>

          <p className="hero-text">{t.hero.text}</p>

          <div className="hero-actions">
            <a className="btn-primary" href="#work">
              {t.hero.work}
              <ArrowUpRight aria-hidden="true" />
            </a>
            <a className="btn-ghost" href="#resume">
              <FileText aria-hidden="true" />
              {t.hero.resume}
            </a>
          </div>
        </div>

        <div className="hero-visual">
          <AuCard />
        </div>
      </div>

      <div className="hero-bottom">
        <span>{t.hero.focus}</span>
        <a className="hero-scroll" href="#about">
          {t.hero.scroll}
          <ArrowDown aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
