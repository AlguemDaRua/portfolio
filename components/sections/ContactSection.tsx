"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export function ContactSection() {
  const { t } = useLanguage();
  const [copyState, setCopyState] = useState<
    "idle" | "copying" | "copied" | "error"
  >("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const handleCopyEmail = async () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setCopyState("copying");
    try {
      await navigator.clipboard.writeText(t.contact.email);
      if (!mounted.current) return;
      setCopyState("copied");
      resetTimer.current = setTimeout(() => setCopyState("idle"), 2500);
    } catch {
      if (mounted.current) setCopyState("error");
    }
  };

  return (
    <>
      <section
        className="section contact-section"
        id="contact"
        aria-labelledby="contact-title"
      >
        <div className="page-wrap">
          <div className="contact-panel">
            <span className="eyebrow">{t.contact.label}</span>

            <div className="contact-copy">
              <h2 id="contact-title">{t.contact.title}</h2>
              <p>{t.contact.text}</p>
            </div>

            <div className="contact-actions">
              <a className="email-link" href={`mailto:${t.contact.email}`}>
                {t.contact.email}
                <ArrowUpRight aria-hidden="true" />
              </a>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="copy-btn"
                disabled={copyState === "copying"}
              >
                {copyState === "copied" ? (
                  <Check aria-hidden="true" />
                ) : (
                  <Copy aria-hidden="true" />
                )}
                <span>
                  {copyState === "copied"
                    ? t.contact.copied
                    : t.contact.copyEmail}
                </span>
              </button>
            </div>

            <p
              className={copyState === "error" ? "copy-feedback" : "sr-only"}
              role="status"
              aria-live="polite"
            >
              {copyState === "error"
                ? t.contact.copyError
                : copyState === "copied"
                  ? t.contact.copied
                  : ""}
            </p>

            <p className="contact-note">{t.contact.availability}</p>
          </div>
        </div>
      </section>

      <footer className="page-wrap site-footer">
        <a className="footer-brand" href="#top">
          <span className="rail-monogram" aria-hidden="true">
            <span>
              AU<span className="monogram-dot">.</span>
            </span>
          </span>
          Azam Usman
        </a>
        <span>{t.contact.footer}</span>
      </footer>
    </>
  );
}
