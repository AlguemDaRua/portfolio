"use client";

import { ArrowUpRight, Download, FileText } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function ResumeSection() {
  const { t } = useLanguage();

  return (
    <section
      className="section resume-section"
      id="resume"
      aria-labelledby="resume-title"
    >
      <div className="page-wrap">
        <SectionHeading
          id="resume-title"
          label={t.cv.label}
          title={t.cv.title}
          description={t.cv.text}
        />

        <div className="resume-grid">
          {t.cv.items.map((item) => (
            <article key={item.langCode} className="resume-card">
              <div className="resume-card-header">
                <span className="resume-document">
                  <FileText aria-hidden="true" />
                  <span className="resume-badge">{item.badge}</span>
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
                  <Download aria-hidden="true" />
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
                  <ArrowUpRight aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
