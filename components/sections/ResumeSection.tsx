"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { DownloadIcon, ArrowUpRight } from "@/components/ui/Icons";
import { ScrambleText } from "@/components/ui/ScrambleText";

export function ResumeSection() {
  const { t } = useLanguage();

  return (
    <section className="resume-section page-wrap" id="resume" aria-label={t.cv.label}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            <ScrambleText text={t.cv.label} />
          </span>
          <h2>
            <ScrambleText text={t.cv.title} duration={450} />
          </h2>
        </div>
        <p>
          <ScrambleText text={t.cv.text} duration={350} />
        </p>
      </div>

      <div className="resume-dual-grid">
        {t.cv.items.map((item) => (
          <div key={item.langCode} className="resume-card">
            <div className="resume-card-header">
              <span className="resume-badge">{item.badge}</span>
              <span className="resume-size">{item.fileSize}</span>
            </div>

            <div>
              <h3>
                <ScrambleText text={item.title} />
              </h3>
              <p className="mt-2">
                <ScrambleText text={item.description} duration={350} />
              </p>
            </div>

            <div className="resume-actions">
              <a href={item.filePath} download className="resume-btn primary">
                <DownloadIcon className="w-3.5 h-3.5" />
                <span>
                  <ScrambleText text={item.downloadLabel} />
                </span>
              </a>

              <a
                href={item.filePath}
                target="_blank"
                rel="noopener noreferrer"
                className="resume-btn secondary"
              >
                <span>
                  <ScrambleText text={item.viewLabel} />
                </span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
