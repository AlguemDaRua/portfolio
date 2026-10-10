"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { ScrambleText } from "@/components/ui/ScrambleText";

export function SkillsSection() {
  const { t } = useLanguage();

  return (
    <section className="skills-section page-wrap" id="skills">
      <div className="skills-heading">
        <span className="eyebrow">
          <ScrambleText text={t.skills.label} />
        </span>
        <h2>
          <ScrambleText text={t.skills.title} duration={450} />
        </h2>
      </div>

      <div className="skills-list">
        {t.skills.groups.map((group) => (
          <div className="skill-row" key={group.label}>
            <span>
              <ScrambleText text={group.label} />
            </span>
            <p>{group.skills.join(" · ")}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
