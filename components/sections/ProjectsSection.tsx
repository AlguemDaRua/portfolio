"use client";

import { BriefcaseBusiness, BookOpen, MapPin } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { SectionHeading } from "@/components/ui/SectionHeading";

const PROJECT_ICONS = [BriefcaseBusiness, BookOpen, MapPin];

export function ProjectsSection() {
  const { t } = useLanguage();

  return (
    <section
      className="work-section page-wrap"
      id="work"
      aria-labelledby="work-title"
    >
      <SectionHeading
        id="work-title"
        label={t.work.label}
        title={t.work.title}
        description={t.work.intro}
      />
      <div className="project-list">
        {t.projects.map((project, index) => {
          const Icon = PROJECT_ICONS[index % PROJECT_ICONS.length];
          return (
            <article className="project-row" key={project.name}>
              <div className="project-mark" aria-hidden="true">
                <Icon strokeWidth={1.25} />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="project-copy">
                <div className="project-meta">
                  <span>{project.context}</span>
                  <span className="project-year">{project.year}</span>
                </div>
                <h3>{project.name}</h3>
                <p className="project-category">{project.category}</p>
                <p>{project.description}</p>
                <ul className="project-tags">
                  {project.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>
      <div className="more-work">
        <span>{t.work.moreLabel}</span>
        <p>{t.work.moreProjects}</p>
      </div>
    </section>
  );
}
