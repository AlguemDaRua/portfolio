"use client";

import { useLanguage } from "@/context/LanguageContext";
import { ScrambleText } from "@/components/ui/ScrambleText";

export function AboutSection() {
  const { t } = useLanguage();

  return (
    <section
      className="section about-section"
      id="about"
      aria-labelledby="about-title"
    >
      <div className="page-wrap">
        <div className="section-head">
          <div>
            <ScrambleText className="eyebrow" text={t.about.label} as="span" />
            <ScrambleText id="about-title" text={t.about.title} as="h2" />
          </div>
          <ScrambleText className="about-lead" text={t.about.text} as="p" />
        </div>

        <dl className="about-facts">
          {t.about.facts.map((fact) => (
            <div key={fact.label}>
              <ScrambleText text={fact.label} as="dt" />
              <dd>
                <ScrambleText text={fact.value} as="span" />
                <ScrambleText text={fact.note} as="small" />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
