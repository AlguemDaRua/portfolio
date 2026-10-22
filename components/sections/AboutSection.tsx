"use client";

import { useLanguage } from "@/context/LanguageContext";

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
            <span className="eyebrow">{t.about.label}</span>
            <h2 id="about-title">{t.about.title}</h2>
          </div>
          <p className="about-lead">{t.about.text}</p>
        </div>

        <dl className="about-facts">
          {t.about.facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>
                {fact.value}
                <small>{fact.note}</small>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
