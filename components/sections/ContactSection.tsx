"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { ArrowUpRight, CopyIcon, CheckIcon } from "@/components/ui/Icons";
import { ScrambleText } from "@/components/ui/ScrambleText";

export function ContactSection() {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(t.contact.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      <section className="contact-section" id="contact">
        <div className="page-wrap contact-inner">
          <div>
            <span className="eyebrow">
              <ScrambleText text={t.contact.label} />
            </span>
            <h2>
              <ScrambleText text={t.contact.title} duration={450} />
            </h2>
          </div>

          <div className="contact-actions-wrap">
            <a className="email-link" href={`mailto:${t.contact.email}`}>
              {t.contact.email}
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>

            <button type="button" onClick={handleCopyEmail} className="copy-btn">
              {copied ? (
                <>
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {t.contact.copied}
                  </span>
                </>
              ) : (
                <>
                  <CopyIcon className="w-3.5 h-3.5" />
                  <span>
                    <ScrambleText text={t.contact.copyEmail} />
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      <footer className="page-wrap site-footer">
        <span>
          Azam Usman<span className="footer-dot">.</span>
        </span>
        <span>
          <ScrambleText text={t.contact.footer} />
        </span>
      </footer>
    </>
  );
}
