"use client";

import { ScrambleText } from "@/components/ui/ScrambleText";

import { useLanguage } from "@/context/LanguageContext";
import { GraduationCap, MapPin } from "lucide-react";

export function AboutSection() {
  const { t } = useLanguage();

  return (
    <section className="about-section" id="about" aria-labelledby="about-title">
      <div className="page-wrap about-inner">
        <div className="about-copy">
          <span className="eyebrow">
            <ScrambleText text={t.about.label} />
          </span>
          <h2 id="about-title">
            <ScrambleText text={t.about.title} />
          </h2>
          <p>
            <ScrambleText text={t.about.text} />
          </p>
        </div>
        <dl className="about-facts">
          <div>
            <dt>
              <GraduationCap aria-hidden="true" />
              <ScrambleText text={t.about.educationLabel} />
            </dt>
            <dd>
              <ScrambleText text={t.about.education.degree} />
              <small>{t.about.education.institution}</small>
              <span className="fact-period">{t.about.education.period}</span>
            </dd>
          </div>
          <div>
            <dt>
              <MapPin aria-hidden="true" />
              <ScrambleText text={t.about.locationLabel} />
            </dt>
            <dd>{t.about.location}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
