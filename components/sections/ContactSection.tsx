"use client";

import { useLanguage } from "@/context/LanguageContext";
import { ContactForm } from "@/components/ui/ContactForm";
import { ScrambleText } from "@/components/ui/ScrambleText";

export function ContactSection() {
  const { t } = useLanguage();

  return (
    <>
      <section
        className="contact-section"
        id="contact"
        aria-labelledby="contact-title"
      >
        <div className="page-wrap contact-inner">
          <div className="contact-copy">
            <span className="eyebrow">
              <ScrambleText text={t.contact.label} />
            </span>
            <h2 id="contact-title">
              <ScrambleText text={t.contact.title} />
            </h2>
            <p>
              <ScrambleText text={t.contact.text} />
            </p>
          </div>
          <ContactForm />
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
