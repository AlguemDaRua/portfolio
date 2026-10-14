"use client";

import { useLanguage } from "@/context/LanguageContext";
import {
  DownloadIcon,
  ArrowUpRight,
  FileTextIcon,
} from "@/components/ui/Icons";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function ResumeSection() {
  const { t } = useLanguage();

  return (
    <section
      className="resume-section page-wrap"
      id="resume"
      aria-labelledby="resume-title"
    >
      <SectionHeading
        id="resume-title"
        label={t.cv.label}
        title={t.cv.title}
        description={t.cv.text}
      />
      <div className="resume-dual-grid">
        {t.cv.items.map((item) => (
          <article key={item.langCode} className="resume-card">
            <div className="resume-card-header">
              <span className="resume-document">
                <FileTextIcon />
                <span className="resume-badge">{item.langCode}</span>
              </span>
              <span className="resume-size">{item.fileSize}</span>
            </div>
            <div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
            <div className="resume-actions">
              <a
                href={item.filePath}
                hrefLang={item.langCode.toLowerCase()}
                download
                className="resume-btn primary"
              >
                <DownloadIcon />
                <span>{item.downloadLabel}</span>
              </a>
              <a
                href={item.filePath}
                hrefLang={item.langCode.toLowerCase()}
                target="_blank"
                rel="noopener noreferrer"
                className="resume-btn secondary"
              >
                <span>{item.viewLabel}</span>
                <ArrowUpRight />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
