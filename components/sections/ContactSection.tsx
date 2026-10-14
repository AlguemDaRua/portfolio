"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { ArrowUpRight, CopyIcon, CheckIcon } from "@/components/ui/Icons";

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
        className="contact-section"
        id="contact"
        aria-labelledby="contact-title"
      >
        <div className="page-wrap contact-inner">
          <div className="contact-copy">
            <span className="eyebrow">{t.contact.label}</span>
            <h2 id="contact-title">{t.contact.title}</h2>
            <p>{t.contact.text}</p>
          </div>
          <div className="contact-actions-wrap">
            <a className="email-link" href={`mailto:${t.contact.email}`}>
              {t.contact.email}
              <ArrowUpRight />
            </a>
            <button
              type="button"
              onClick={handleCopyEmail}
              className="copy-btn"
              disabled={copyState === "copying"}
            >
              {copyState === "copied" ? <CheckIcon /> : <CopyIcon />}
              <span>
                {copyState === "copied"
                  ? t.contact.copied
                  : t.contact.copyEmail}
              </span>
            </button>
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
          </div>
        </div>
      </section>
      <footer className="page-wrap site-footer">
        <a href="#top" aria-label={`Azam Usman — ${t.nav.home}`}>
          Azam Usman<span className="footer-dot">.</span>
        </a>
        <span>{t.contact.footer}</span>
      </footer>
    </>
  );
}
