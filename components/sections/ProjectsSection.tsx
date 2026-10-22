"use client";

import { useLanguage } from "@/context/LanguageContext";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function ProjectsSection() {
  const { t } = useLanguage();

  return (
    <section
      className="section work-section"
      id="work"
      aria-labelledby="work-title"
    >
      <div className="page-wrap">
        <SectionHeading
          id="work-title"
          label={t.work.label}
          title={t.work.title}
          description={t.work.intro}
        />

        <div className="project-list">
          {t.projects.map((project, index) => (
            <article className="project-row" key={project.name}>
              <span className="project-index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className="project-copy">
                <h3>{project.name}</h3>
                <p className="project-category">{project.category}</p>
                <p className="project-description">{project.description}</p>
                <ul className="project-tags">
                  {project.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              </div>

              <div className="project-meta">
                <span>{project.context}</span>
                <span className="project-year">{project.year}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="more-work">
          <span>{t.work.moreLabel}</span>
          <p>{t.work.moreProjects}</p>
        </div>
      </div>
    </section>
  );
}
