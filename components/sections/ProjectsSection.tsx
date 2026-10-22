"use client";

import { useLanguage } from "@/context/LanguageContext";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrambleText } from "@/components/ui/ScrambleText";

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
                <ScrambleText text={project.name} as="h3" />
                <ScrambleText
                  className="project-category"
                  text={project.category}
                  as="p"
                />
                <ScrambleText
                  className="project-description"
                  text={project.description}
                  as="p"
                />
                <ul className="project-tags">
                  {project.tags.map((tag) => (
                    <li key={tag}>
                      <ScrambleText text={tag} />
                    </li>
                  ))}
                </ul>
              </div>

              <div className="project-meta">
                <ScrambleText text={project.context} as="span" />
                <ScrambleText
                  className="project-year"
                  text={project.year}
                  as="span"
                />
              </div>
            </article>
          ))}
        </div>

        <div className="more-work">
          <ScrambleText text={t.work.moreLabel} as="span" />
          <ScrambleText text={t.work.moreProjects} as="p" />
        </div>
      </div>
    </section>
  );
}
