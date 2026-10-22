"use client";

import { useLanguage } from "@/context/LanguageContext";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrambleText } from "@/components/ui/ScrambleText";

export function SkillsSection() {
  const { t } = useLanguage();

  return (
    <section
      className="section skills-section"
      id="skills"
      aria-labelledby="skills-title"
    >
      <div className="page-wrap">
        <SectionHeading
          id="skills-title"
          label={t.skills.label}
          title={t.skills.title}
          description={t.skills.intro}
        />

        <div className="skills-grid">
          {t.skills.groups.map((group, index) => (
            <div className="skill-group" key={group.label}>
              <div className="skill-group-head">
                <ScrambleText text={group.label} as="h3" />
                <span aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <ScrambleText text={group.summary} as="p" />
              <ul>
                {group.skills.map((skill) => (
                  <li key={skill}>
                    <ScrambleText text={skill} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
