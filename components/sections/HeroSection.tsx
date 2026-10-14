"use client";

import { ScrambleText } from "@/components/ui/ScrambleText";

import { useLanguage } from "@/context/LanguageContext";
import { ArrowUpRight } from "@/components/ui/Icons";

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="hero page-wrap" id="top" aria-labelledby="hero-title">
      <div className="hero-meta">
        <span>{t.hero.edition}</span>
        <span>{t.about.location}</span>
      </div>

      <div className="hero-content">
        <span className="eyebrow hero-eyebrow">
          <i aria-hidden="true" />
          <ScrambleText text={t.hero.eyebrow} />
        </span>
        <h1 id="hero-title">
          <ScrambleText text={t.hero.title} />
          <br />
          <span className="hero-title-secondary">
            <ScrambleText text={t.hero.titleAccent} />
          </span>
        </h1>
        <p className="hero-intro">
          <ScrambleText text={t.hero.text} />
        </p>
        <div className="hero-actions">
          <a className="primary-link" href="#work">
            <ScrambleText text={t.hero.work} />
            <ArrowUpRight />
          </a>
          <a className="text-link" href="#about">
            <ScrambleText text={t.hero.about} />
            <span aria-hidden="true">↓</span>
          </a>
          <a className="cv-link" href="#resume">
            <ScrambleText text={t.hero.cv} />
          </a>
        </div>
      </div>

      <div className="hero-bottom">
        <span>
          <ScrambleText text={t.hero.focus} />
        </span>
        <a href="#about" aria-label={t.hero.about}>
          <span aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  );
}
