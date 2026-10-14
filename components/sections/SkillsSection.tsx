"use client";

import { Smartphone, Server, Code2, Layers3 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const SKILL_ICONS = [Smartphone, Server, Code2, Layers3];

export function SkillsSection() {
  const { t } = useLanguage();

  return (
    <section
      className="skills-section page-wrap"
      id="skills"
      aria-labelledby="skills-title"
    >
      <div className="skills-heading">
        <span className="eyebrow">{t.skills.label}</span>
        <h2 id="skills-title">{t.skills.title}</h2>
      </div>
      <div className="skills-list">
        {t.skills.groups.map((group, index) => {
          const Icon = SKILL_ICONS[index % SKILL_ICONS.length];
          return (
            <div className="skill-row" key={group.label}>
              <h3>
                <Icon aria-hidden="true" />
                {group.label}
              </h3>
              <ul>
                {group.skills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
