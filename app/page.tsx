"use client";

import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { SideRail } from "@/components/layout/SideRail";
import { HeroSection } from "@/components/sections/HeroSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { SkillsSection } from "@/components/sections/SkillsSection";
import { ResumeSection } from "@/components/sections/ResumeSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { BackToTop } from "@/components/ui/BackToTop";
import { ThemePaintOverlay } from "@/components/ui/ThemePaintOverlay";

function PortfolioShell() {
  const { theme, isPainting } = useTheme();
  const { locale } = useLanguage();

  return (
    <div
      className={`site-shell ${isPainting ? "theme-paint-active" : ""}`}
      data-theme={theme}
    >
      <SideRail />
      <main className="site-main" lang={locale} id="top">
        <HeroSection />
        <AboutSection />
        <ProjectsSection />
        <SkillsSection />
        <ResumeSection />
        <ContactSection />
      </main>
      <BackToTop />
      <ThemePaintOverlay />
    </div>
  );
}

export default function Home() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <PortfolioShell />
      </ThemeProvider>
    </LanguageProvider>
  );
}
