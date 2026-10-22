"use client";

import { ArrowDown, ArrowUpRight, FileText } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { AuCard } from "@/components/ui/AuCard";
import { ScrambleText } from "@/components/ui/ScrambleText";

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="hero page-wrap" id="top" aria-labelledby="hero-title">
      <div className="hero-meta">
        <ScrambleText text={t.meta.edition} />
        <ScrambleText text={t.meta.location} />
      </div>

      <div className="hero-grid">
        <div className="hero-copy">
          <span className="status-pill">
            <span className="status-dot" aria-hidden="true" />
            <ScrambleText text={t.hero.available} />
          </span>

          <h1 id="hero-title">
            <ScrambleText
              className="hero-title-line"
              text={t.hero.title}
              as="span"
            />
            <ScrambleText
              className="hero-title-line hero-title-accent"
              text={t.hero.titleAccent}
              as="span"
            />
          </h1>

          <ScrambleText className="hero-text" text={t.hero.text} as="p" />

          <div className="hero-actions">
            <a className="btn-primary" href="#work">
              <ScrambleText text={t.hero.work} />
              <ArrowUpRight aria-hidden="true" />
            </a>
            <a className="btn-ghost" href="#resume">
              <FileText aria-hidden="true" />
              <ScrambleText text={t.hero.resume} />
            </a>
          </div>
        </div>

        <div className="hero-visual">
          <AuCard />
        </div>
      </div>

      <div className="hero-bottom">
        <ScrambleText text={t.hero.focus} />
        <a className="hero-scroll" href="#about">
          <ScrambleText text={t.hero.scroll} />
          <ArrowDown aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
