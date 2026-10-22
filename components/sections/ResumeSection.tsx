"use client";

import { ArrowUpRight, Download, FileText } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrambleText } from "@/components/ui/ScrambleText";

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
                  <ScrambleText className="resume-badge" text={item.badge} as="span" />
                </span>
                <ScrambleText className="resume-size" text={item.fileSize} as="span" />
              </div>

              <div>
                <ScrambleText text={item.title} as="h3" />
                <ScrambleText text={item.description} as="p" />
              </div>

              <div className="resume-actions">
                <a
                  href={item.filePath}
                  hrefLang={item.langCode.toLowerCase()}
                  download
                  className="resume-btn primary"
                >
                  <Download aria-hidden="true" />
                  <ScrambleText text={item.downloadLabel} as="span" />
                </a>
                <a
                  href={item.filePath}
                  hrefLang={item.langCode.toLowerCase()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resume-btn secondary"
                >
                  <ScrambleText text={item.viewLabel} as="span" />
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
