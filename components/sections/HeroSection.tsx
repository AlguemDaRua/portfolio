"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { ArrowUpRight } from "@/components/ui/Icons";
import { ScrambleText } from "@/components/ui/ScrambleText";

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="hero page-wrap" id="top">
      <span className="eyebrow hero-eyebrow">
        <i />
        <ScrambleText text={t.hero.eyebrow} />
      </span>

      <h1>
        <ScrambleText text={t.hero.title} duration={500} />
      </h1>

      <p className="hero-intro">
        <ScrambleText text={t.hero.text} duration={400} />
      </p>

      <div className="hero-actions">
        <a className="primary-link" href="#about">
          <ScrambleText text={t.hero.about} />
          <span>↓</span>
        </a>

        <a className="text-link" href="#work">
          <ScrambleText text={t.hero.work} />
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>

        <a className="cv-link" href="#resume">
          <ScrambleText text={t.hero.cv} />
          <span>↘</span>
        </a>
      </div>

      <div className="hero-bottom">
        <span>
          <ScrambleText text={t.hero.focus} />
        </span>
        <span>01 / 05</span>
      </div>
    </section>
  );
}
