"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { ScrambleText } from "@/components/ui/ScrambleText";

export function AboutSection() {
  const { t } = useLanguage();

  return (
    <section className="about-section" id="about">
      <div className="page-wrap about-inner">
        <div className="about-copy">
          <span className="eyebrow">
            <ScrambleText text={t.about.label} />
          </span>
          <h2>
            <ScrambleText text={t.about.title} duration={450} />
          </h2>
          <p>
            <ScrambleText text={t.about.text} duration={350} />
          </p>
        </div>

        <div className="about-facts">
          <div>
            <span>
              <ScrambleText text={t.about.educationLabel} />
            </span>
            <p>
              {t.about.education.degree}
              <small>
                {t.about.education.institution} · {t.about.education.period}
              </small>
            </p>
          </div>

          <div>
            <span>
              <ScrambleText text={t.about.locationLabel} />
            </span>
            <p>{t.about.location}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
