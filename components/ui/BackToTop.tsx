"use client";

import React, { useEffect, useState } from "react";
import { ArrowUp } from "./Icons";
import { useLanguage } from "@/context/LanguageContext";

export function BackToTop() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 320);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <a
      href="#top"
      aria-label={t.contact.backTop}
      title={t.contact.backTop}
      className="back-to-top"
    >
      <ArrowUp className="w-4 h-4" />
    </a>
  );
}
