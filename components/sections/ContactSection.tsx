"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { ScrambleText } from "@/components/ui/ScrambleText";

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
            <ScrambleText className="eyebrow" text={t.contact.label} as="span" />

            <div className="contact-copy">
              <ScrambleText id="contact-title" text={t.contact.title} as="h2" />
              <ScrambleText text={t.contact.text} as="p" />
            </div>

            <div className="contact-actions">
              <a className="email-link" href={`mailto:${t.contact.email}`}>
                <ScrambleText text={t.contact.email} />
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
                <ScrambleText
                  as="span"
                  text={
                    copyState === "copied"
                      ? t.contact.copied
                      : t.contact.copyEmail
                  }
                />
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

            <ScrambleText
              className="contact-note"
              text={t.contact.availability}
              as="p"
            />
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
        <ScrambleText text={t.contact.footer} as="span" />
      </footer>
    </>
  );
}
