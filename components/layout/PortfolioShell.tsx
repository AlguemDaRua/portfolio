"use client";

import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { AboutSection } from "@/components/sections/AboutSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { ResumeSection } from "@/components/sections/ResumeSection";
import { SkillsSection } from "@/components/sections/SkillsSection";
import { BackToTop } from "@/components/ui/BackToTop";
import { SideRail } from "./SideRail";

function PortfolioContent() {
  const { theme } = useTheme();
  const { locale, t } = useLanguage();

  return (
    <div className="site-shell" data-theme={theme}>
      <a className="skip-link" href="#main-content">
        {t.nav.skip}
      </a>
      <SideRail />
      <main className="site-main" lang={locale} id="main-content" tabIndex={-1}>
        <HeroSection />
        <AboutSection />
        <ProjectsSection />
        <SkillsSection />
        <ResumeSection />
        <ContactSection />
      </main>
      <BackToTop />
    </div>
  );
}

export function PortfolioShell() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <PortfolioContent />
      </ThemeProvider>
    </LanguageProvider>
  );
}
