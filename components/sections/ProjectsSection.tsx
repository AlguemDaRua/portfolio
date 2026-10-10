"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { ScrambleText } from "@/components/ui/ScrambleText";

export function ProjectsSection() {
  const { t } = useLanguage();

  return (
    <section className="work-section page-wrap" id="work">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            <ScrambleText text={t.work.label} />
          </span>
          <h2>
            <ScrambleText text={t.work.title} duration={450} />
          </h2>
        </div>
        <p>
          <ScrambleText text={t.work.intro} duration={350} />
        </p>
      </div>

      <div className="project-list">
        {t.projects.map((project, index) => (
          <article className="project-row" key={project.name}>
            <span className="project-number">0{index + 1}</span>
            <div className="project-copy">
              <div className="project-meta">
                <span>
                  <ScrambleText text={project.category} />
                </span>
                <span>
                  <ScrambleText text={project.context} />
                </span>
              </div>
              <h3>{project.name}</h3>
              <p>
                <ScrambleText text={project.description} duration={350} />
              </p>
              <span className="project-tags">
                {Array.isArray(project.tags) ? project.tags.join(" · ") : project.tags}
              </span>
            </div>
            <time className="project-year">{project.year}</time>
          </article>
        ))}
      </div>

      <div className="more-work">
        <span>
          <ScrambleText text={t.work.moreLabel} />
        </span>
        <p>{t.work.moreProjects}</p>
      </div>
    </section>
  );
}
