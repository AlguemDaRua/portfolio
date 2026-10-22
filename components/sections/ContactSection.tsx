"use client";

import { useLanguage } from "@/context/LanguageContext";
import { ScrambleText } from "@/components/ui/ScrambleText";
import { ContactForm } from "@/components/sections/ContactForm";

export function ContactSection() {
  const { t } = useLanguage();

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

            <ContactForm />

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
