"use client";

import { useLanguage } from "@/context/LanguageContext";

const PILL_SLOTS = ["a", "b", "c"] as const;

/**
 * The owner's mark: one dark plate, one paper squircle and three floating
 * stack labels. Text comes from the dictionary, so the card is identical in
 * both languages — only the surrounding copy changes.
 */
export function AuCard() {
  const { t } = useLanguage();

  return (
    <figure className="au-card" aria-hidden="true">
      <div className="au-card-grid" />
      <div className="au-card-rings">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="au-card-head">
        <span>{t.hero.cardLabel}</span>
        <span>{t.hero.cardStamp}</span>
      </div>
      <div className="au-mark">
        <span className="au-wordmark">
          AU
          <span className="au-wordmark-dot" />
        </span>
      </div>
      {t.hero.stack.map((label, index) => (
        <span
          key={label}
          className={`au-pill au-pill-${PILL_SLOTS[index % PILL_SLOTS.length]}`}
        >
          {label}
        </span>
      ))}
    </figure>
  );
}
