"use client";

import { useEffect, useRef, useState } from "react";

function Arrow({ up = false, size = 15 }) {
  return up ? (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 16V4m0 0L5 9m5-5 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 15 15 5M6 5h9v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ThemeIcon({ mode }) {
  return mode === "light" ? (
    <svg aria-hidden="true" width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="3.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 1.8v2M10 16.2v2M18.2 10h-2M3.8 10h-2m14.01-5.81-1.42 1.42M5.61 14.39l-1.42 1.42m11.62 0-1.42-1.42M5.61 5.61 4.19 4.19" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ) : (
    <svg aria-hidden="true" width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16.8 12.3A7.2 7.2 0 0 1 7.7 3.2a7.2 7.2 0 1 0 9.1 9.1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

const paintBlobPaths = [
  "M151 17 C173 21 182 44 205 43 C232 40 246 57 252 79 C278 77 288 98 280 120 C302 143 287 168 270 181 C279 205 259 222 236 219 C227 245 206 257 186 244 C166 272 142 276 126 253 C102 267 80 252 80 230 C54 236 39 215 49 193 C24 180 17 155 39 139 C20 115 35 92 60 86 C57 61 81 44 105 54 C119 30 135 12 151 17 Z",
  "M149 13 C174 17 185 36 197 52 C227 35 249 54 246 81 C278 74 293 99 276 125 C305 149 281 172 264 185 C283 212 259 232 233 223 C222 255 197 255 179 240 C159 280 132 267 122 243 C91 267 68 248 79 220 C43 231 29 207 50 181 C14 161 24 133 53 125 C28 96 50 73 77 80 C69 48 101 36 123 55 C127 28 136 10 149 13 Z",
  "M154 20 C176 8 194 34 203 51 C231 36 255 49 250 77 C287 76 292 106 274 127 C297 153 281 177 258 188 C277 217 250 235 226 222 C210 255 187 258 168 237 C146 273 118 259 111 235 C78 254 58 228 75 202 C38 209 24 183 50 159 C18 137 35 111 61 101 C43 68 68 49 98 65 C103 31 128 23 145 50 C146 39 147 28 154 20 Z",
];

function PaintBlob({ className, style, variant = 0 }) {
  return (
    <svg className={className} style={style} viewBox="0 0 300 300" aria-hidden="true" focusable="false">
      <path d={paintBlobPaths[variant % paintBlobPaths.length]} />
      <path d="M76 87 C58 67 52 51 60 40 C74 50 76 67 89 78Z" />
      <path d="M207 54 C224 35 239 27 249 33 C243 48 225 53 215 66Z" />
      <path d="M109 234 C100 255 95 276 108 287 C122 293 128 271 131 246Z" />
      <path d="M218 210 C241 215 260 226 262 239 C246 242 234 228 213 226Z" />
      <circle cx="30" cy="133" r="10" />
      <circle cx="276" cy="89" r="8" />
      <circle cx="54" cy="256" r="7" />
      <ellipse cx="273" cy="250" rx="7" ry="15" transform="rotate(35 273 250)" />
      {variant % 2 === 0 ? <circle cx="178" cy="279" r="6" /> : <ellipse cx="33" cy="70" rx="6" ry="12" transform="rotate(-38 33 70)" />}
    </svg>
  );
}

const content = {
  en: {
    nav: { work: "Work", about: "About", skills: "Skills", contact: "Contact" },
    theme: { label: "Theme", light: "Light", dark: "Dark", lightAction: "Switch to light theme", darkAction: "Switch to dark theme" },
    hero: {
      eyebrow: "AZAM USMAN · SOFTWARE DEVELOPER · MAPUTO, MOZAMBIQUE",
      title: "I build software.",
      text: "Web and mobile applications, APIs, and practical digital tools.",
      work: "View selected work",
      about: "About me",
      cv: "CV PDF · COMING SOON",
      focus: "FULL-STACK · MOBILE · SYSTEMS",
    },
    work: {
      label: "01 / WORK",
      title: "Selected projects",
      intro: "A few recent projects from my professional, personal, and team work.",
      more: "ALSO",
    },
    projects: [
      {
        name: "GetJobs",
        category: "Full-stack recruitment platform",
        context: "Pathway Consulting",
        year: "2025—26",
        description: "A recruitment platform with a responsive web interface, REST API, authentication, job listings, and application workflows.",
        tags: "FULL-STACK · REST API",
      },
      {
        name: "LibreDex",
        category: "Offline-first mobile app",
        context: "Personal project",
        year: "2026",
        description: "A Flutter reference app that works offline, with local SQLite storage and quick search filters.",
        tags: "FLUTTER · SQLITE · OFFLINE",
      },
      {
        name: "Parking Management",
        category: "Cross-platform mobile app",
        context: "Team project · ISUTC",
        year: "2025",
        description: "A parking app with visitor and manager access, Firebase, a live dashboard, and location-based spaces.",
        tags: "FLUTTER · FIREBASE · GEOLOCATION",
      },
    ],
    moreProjects: "BLink · Complaints Management",
    about: {
      label: "02 / ABOUT",
      title: "About me",
      text: "I’m studying Information Technology and Telecommunications Engineering at ISUTC. I work on web apps, mobile apps, databases, and networked systems.",
      education: "Information Technology & Telecommunications Engineering · ISUTC",
      location: "Maputo, Mozambique",
      educationLabel: "EDUCATION",
      locationLabel: "LOCATION",
    },
    skills: {
      label: "03 / SKILLS",
      title: "Selected skills",
      groups: [
        { label: "WEB", value: "JavaScript · TypeScript · React · Node.js · Express" },
        { label: "MOBILE", value: "Dart · Flutter · Firebase" },
        { label: "OTHER", value: "Java · Python · PHP · SQL · Git · Linux" },
      ],
    },
    cv: { label: "CV / PDF", text: "Add the CV here when it’s ready.", status: "COMING SOON" },
    contact: {
      label: "04 / CONTACT",
      title: "Get in touch.",
      email: "azamusman@proton.me",
      footer: "© 2026 Azam Usman",
      backTop: "Back to top",
    },
  },
  pt: {
    nav: { work: "Projectos", about: "Sobre", skills: "Competências", contact: "Contacto" },
    theme: { label: "Tema", light: "Claro", dark: "Escuro", lightAction: "Mudar para tema claro", darkAction: "Mudar para tema escuro" },
    hero: {
      eyebrow: "AZAM USMAN · DESENVOLVEDOR DE SOFTWARE · MAPUTO, MOÇAMBIQUE",
      title: "Desenvolvo software.",
      text: "Aplicações web e móveis, APIs e ferramentas digitais práticas.",
      work: "Ver projectos",
      about: "Sobre mim",
      cv: "CV EM PDF · EM BREVE",
      focus: "FULL-STACK · MOBILE · SISTEMAS",
    },
    work: {
      label: "01 / PROJECTOS",
      title: "Projectos seleccionados",
      intro: "Alguns projectos recentes de trabalho profissional, pessoal e em equipa.",
      more: "TAMBÉM",
    },
    projects: [
      {
        name: "GetJobs",
        category: "Plataforma de recrutamento full-stack",
        context: "Pathway Consulting",
        year: "2025—26",
        description: "Plataforma de recrutamento com interface web responsiva, API REST, autenticação, publicação de vagas e gestão de candidaturas.",
        tags: "FULL-STACK · API REST",
      },
      {
        name: "LibreDex",
        category: "Aplicação móvel offline-first",
        context: "Projecto pessoal",
        year: "2026",
        description: "Aplicação Flutter de consulta que funciona offline, com armazenamento local em SQLite e filtros de pesquisa rápidos.",
        tags: "FLUTTER · SQLITE · OFFLINE",
      },
      {
        name: "Gestão de Estacionamentos",
        category: "Aplicação móvel multiplataforma",
        context: "Projecto de equipa · ISUTC",
        year: "2025",
        description: "Aplicação de estacionamento com acesso para visitantes e gestores, Firebase, painel em tempo real e localização de vagas.",
        tags: "FLUTTER · FIREBASE · GEOLOCALIZAÇÃO",
      },
    ],
    moreProjects: "BLink · Gestão de Reclamações",
    about: {
      label: "02 / SOBRE",
      title: "Sobre mim",
      text: "Estou a estudar Engenharia Informática e de Telecomunicações no ISUTC. Trabalho em aplicações web e móveis, bases de dados e sistemas de rede.",
      education: "Engenharia Informática e de Telecomunicações · ISUTC",
      location: "Maputo, Moçambique",
      educationLabel: "FORMAÇÃO",
      locationLabel: "LOCALIZAÇÃO",
    },
    skills: {
      label: "03 / COMPETÊNCIAS",
      title: "Algumas competências",
      groups: [
        { label: "WEB", value: "JavaScript · TypeScript · React · Node.js · Express" },
        { label: "MOBILE", value: "Dart · Flutter · Firebase" },
        { label: "OUTRAS", value: "Java · Python · PHP · SQL · Git · Linux" },
      ],
    },
    cv: { label: "CV / PDF", text: "Adicionar o CV aqui quando estiver pronto.", status: "EM BREVE" },
    contact: {
      label: "04 / CONTACTO",
      title: "Entre em contacto.",
      email: "azamusman@proton.me",
      footer: "© 2026 Azam Usman",
      backTop: "Voltar ao topo",
    },
  },
};

export default function Home() {
  const [lang, setLang] = useState("en");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showBackTop, setShowBackTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("");
  const [theme, setTheme] = useState("light");
  const [paintTarget, setPaintTarget] = useState(null);
  const paintTimers = useRef([]);
  const t = content[lang];

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem("azam-portfolio-theme");
      if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
    } catch {}
  }, []);

  useEffect(() => () => {
    paintTimers.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    const checkScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.round((window.scrollY / maxScroll) * 100) : 0;
      setScrollProgress((current) => current === progress ? current : progress);
      setShowBackTop(window.scrollY > 320);

      let currentSection = "";
      ["work", "about", "skills", "contact"].forEach((id) => {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= window.innerHeight * 0.32) currentSection = id;
      });
      setActiveSection(currentSection);
    };
    checkScroll();
    window.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      window.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const applyTheme = (nextTheme) => {
    setTheme(nextTheme);
    try { window.localStorage.setItem("azam-portfolio-theme", nextTheme); } catch {}
  };
  const changeTheme = (nextTheme) => {
    if (nextTheme === theme || paintTarget) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      applyTheme(nextTheme);
      return;
    }
    const cells = Array.from({ length: 24 }, (_, index) => ({ column: index % 6, row: Math.floor(index / 6) }));
    for (let i = cells.length - 1; i > 0; i -= 1) {
      const swap = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[swap]] = [cells[swap], cells[i]];
    }
    const positions = cells.map(({ column, row }) => ({
      x: Math.round((column + 0.5 + (Math.random() - 0.5) * 0.92) * (100 / 6) * 10) / 10,
      y: Math.round((row + 0.5 + (Math.random() - 0.5) * 0.92) * 25 * 10) / 10,
    }));
    for (let i = 0; i < 8; i += 1) {
      positions.push({ x: -12 + Math.random() * 124, y: -14 + Math.random() * 128 });
    }
    const splashes = positions.map(({ x, y }) => ({
      x,
      y,
      size: Math.round(6 + Math.random() * 15),
      grow: Number((2.2 + Math.random() * 4.8).toFixed(2)),
      turn: Math.round(Math.random() * 360),
      delay: Math.round(Math.random() * 700),
      duration: Math.round(1200 + Math.random() * 550),
      variant: Math.floor(Math.random() * paintBlobPaths.length),
    }));
    const sheet = {
      x: Math.round(-8 + Math.random() * 116),
      y: Math.round(-8 + Math.random() * 116),
      size: Math.round(56 + Math.random() * 14),
      grow: Number((5 + Math.random() * 1.1).toFixed(2)),
      turn: Math.round(Math.random() * 360),
      delay: Math.round(80 + Math.random() * 300),
      variant: Math.floor(Math.random() * paintBlobPaths.length),
    };
    setPaintTarget({ theme: nextTheme, splashes, sheet });
    const switchTimer = window.setTimeout(() => applyTheme(nextTheme), 2300);
    const finishTimer = window.setTimeout(() => setPaintTarget(null), 2980);
    paintTimers.current = [switchTimer, finishTimer];
  };

  return (
    <div className={`site-shell ${paintTarget ? "theme-paint-active" : ""}`} data-theme={theme}>
      <aside className="side-rail">
        <a className="rail-brand" href="#top" aria-label="Azam Usman — home" onClick={closeMenu}>
          <span className="rail-monogram">AU<span>.</span></span>
          <span className="rail-name">Azam Usman</span>
        </a>
        <div className="rail-progress" aria-hidden="true"><span style={{ width: `${scrollProgress}%` }} /></div>
        <nav className={`rail-nav ${menuOpen ? "rail-nav-open" : ""}`} aria-label="Main navigation">
          <a className={activeSection === "work" ? "active" : ""} href="#work" onClick={closeMenu} aria-label={t.nav.work} aria-current={activeSection === "work" ? "location" : undefined}><span className="rail-number">01</span><span className="rail-label">{t.nav.work}</span></a>
          <a className={activeSection === "about" ? "active" : ""} href="#about" onClick={closeMenu} aria-label={t.nav.about} aria-current={activeSection === "about" ? "location" : undefined}><span className="rail-number">02</span><span className="rail-label">{t.nav.about}</span></a>
          <a className={activeSection === "skills" ? "active" : ""} href="#skills" onClick={closeMenu} aria-label={t.nav.skills} aria-current={activeSection === "skills" ? "location" : undefined}><span className="rail-number">03</span><span className="rail-label">{t.nav.skills}</span></a>
          <a className={activeSection === "contact" ? "active" : ""} href="#contact" onClick={closeMenu} aria-label={t.nav.contact} aria-current={activeSection === "contact" ? "location" : undefined}><span className="rail-number">04</span><span className="rail-label">{t.nav.contact}</span></a>
        </nav>
        <div className="rail-bottom">
          <div className="theme-switch" role="group" aria-label={t.theme.label}>
            <button type="button" className={theme === "light" ? "active" : ""} aria-label={t.theme.lightAction} aria-pressed={theme === "light"} disabled={paintTarget !== null} title={t.theme.light} onClick={() => changeTheme("light")}><ThemeIcon mode="light" /><span>{t.theme.light}</span></button>
            <button type="button" className={theme === "dark" ? "active" : ""} aria-label={t.theme.darkAction} aria-pressed={theme === "dark"} disabled={paintTarget !== null} title={t.theme.dark} onClick={() => changeTheme("dark")}><ThemeIcon mode="dark" /><span>{t.theme.dark}</span></button>
          </div>
          <div className="rail-bottom-meta">
            <div className="language-switch" role="group" aria-label="Choose language">
              <button type="button" className={lang === "en" ? "active" : ""} aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
              <span>/</span>
              <button type="button" className={lang === "pt" ? "active" : ""} aria-pressed={lang === "pt"} onClick={() => setLang("pt")}>PT</button>
            </div>
            <span className="rail-location">MAPUTO · MZ</span>
          </div>
          <button className={`menu-toggle ${menuOpen ? "open" : ""}`} type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><span /><span /></button>
        </div>
      </aside>

      <main className="site-main" lang={lang} id="top">
        <section className="hero page-wrap">
          <span className="eyebrow hero-eyebrow"><i />{t.hero.eyebrow}</span>
          <h1>{t.hero.title}</h1>
          <p className="hero-intro">{t.hero.text}</p>
          <div className="hero-actions">
            <a className="primary-link" href="#work">{t.hero.work}<Arrow /></a>
            <a className="text-link" href="#about">{t.hero.about}<span>↓</span></a>
            <a className="cv-link" href="#resume">{t.hero.cv}<span>↘</span></a>
          </div>
          <div className="hero-bottom"><span>{t.hero.focus}</span><span>01 / 04</span></div>
        </section>

        <section className="work-section page-wrap" id="work">
          <div className="section-heading"><div><span className="eyebrow">{t.work.label}</span><h2>{t.work.title}</h2></div><p>{t.work.intro}</p></div>
          <div className="project-list">
            {t.projects.map((project, index) => (
              <article className="project-row" key={project.name}>
                <span className="project-number">0{index + 1}</span>
                <div className="project-copy">
                  <div className="project-meta"><span>{project.category}</span><span>{project.context}</span></div>
                  <h3>{project.name}</h3>
                  <p>{project.description}</p>
                  <span className="project-tags">{project.tags}</span>
                </div>
                <time className="project-year">{project.year}</time>
              </article>
            ))}
          </div>
          <div className="more-work"><span>{t.work.more}</span><p>{t.moreProjects}</p></div>
        </section>

        <section className="about-section" id="about">
          <div className="page-wrap about-inner">
            <div className="about-copy"><span className="eyebrow">{t.about.label}</span><h2>{t.about.title}</h2><p>{t.about.text}</p></div>
            <div className="about-facts">
              <div><span>{t.about.educationLabel}</span><p>{t.about.education}<small>2020—PRESENT</small></p></div>
              <div><span>{t.about.locationLabel}</span><p>{t.about.location}</p></div>
            </div>
          </div>
        </section>

        <section className="skills-section page-wrap" id="skills">
          <div className="skills-heading"><span className="eyebrow">{t.skills.label}</span><h2>{t.skills.title}</h2></div>
          <div className="skills-list">{t.skills.groups.map((group) => <div className="skill-row" key={group.label}><span>{group.label}</span><p>{group.value}</p></div>)}</div>
        </section>

        {/* Add the PDF to public/cv-azam-usman.pdf and link this slot when ready. */}
        <section className="resume-section page-wrap" id="resume" aria-label={t.cv.label}>
          <div className="resume-slot"><div><span className="eyebrow">{t.cv.label}</span><p>{t.cv.text}</p></div><span className="resume-status">{t.cv.status}</span></div>
        </section>

        <section className="contact-section" id="contact">
          <div className="page-wrap contact-inner"><div><span className="eyebrow">{t.contact.label}</span><h2>{t.contact.title}</h2></div><a className="email-link" href={`mailto:${t.contact.email}`}>{t.contact.email}<Arrow /></a></div>
        </section>

        <footer className="page-wrap site-footer"><span>Azam Usman<span className="footer-dot">.</span></span><span>{t.contact.footer}</span></footer>
      </main>

      {showBackTop && <a className="back-to-top" href="#top" aria-label={t.contact.backTop} title={t.contact.backTop}><Arrow up size={17} /></a>}
      {paintTarget && (
        <div className={`theme-paint paint-to-${paintTarget.theme}`} aria-hidden="true">
          <PaintBlob className="paint-sheet" variant={paintTarget.sheet.variant} style={{ left: `${paintTarget.sheet.x}%`, top: `${paintTarget.sheet.y}%`, width: `${paintTarget.sheet.size}vmax`, height: `${paintTarget.sheet.size}vmax`, "--paint-turn": `${paintTarget.sheet.turn}deg`, "--sheet-delay": `${paintTarget.sheet.delay}ms`, "--sheet-grow": paintTarget.sheet.grow }} />
          {paintTarget.splashes.map((splash, index) => (
            <PaintBlob key={index} className="paint-splash" variant={splash.variant} style={{ left: `${splash.x}%`, top: `${splash.y}%`, width: `${splash.size}vmax`, height: `${splash.size}vmax`, "--paint-turn": `${splash.turn}deg`, "--paint-grow": splash.grow, "--paint-delay": `${splash.delay}ms`, "--paint-duration": `${splash.duration}ms` }} />
          ))}
        </div>
      )}
    </div>
  );
}
