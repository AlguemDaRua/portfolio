export type Locale = "pt" | "en";

export interface Project {
  name: string;
  category: string;
  context: string;
  year: string;
  description: string;
  tags: string[];
  link?: string;
  github?: string;
}

export interface SkillGroup {
  label: string;
  skills: string[];
}

export interface Education {
  degree: string;
  institution: string;
  period: string;
}

export interface ResumeCard {
  langCode: "PT" | "EN";
  title: string;
  badge: string;
  description: string;
  fileSize: string;
  filePath: string;
  downloadLabel: string;
  viewLabel: string;
}

export interface TranslationContent {
  nav: {
    home: string;
    label: string;
    open: string;
    close: string;
    skip: string;
    about: string;
    work: string;
    skills: string;
    resume: string;
    contact: string;
  };
  theme: {
    label: string;
    light: string;
    dark: string;
    lightAction: string;
    darkAction: string;
  };
  hero: {
    eyebrow: string;
    edition: string;
    titleAccent: string;
    title: string;
    text: string;
    work: string;
    about: string;
    cv: string;
    focus: string;
  };
  about: {
    label: string;
    title: string;
    text: string;
    educationLabel: string;
    education: Education;
    locationLabel: string;
    location: string;
  };
  work: {
    label: string;
    title: string;
    intro: string;
    moreLabel: string;
    moreProjects: string;
  };
  projects: Project[];
  skills: {
    label: string;
    title: string;
    groups: SkillGroup[];
  };
  cv: {
    label: string;
    title: string;
    text: string;
    items: [ResumeCard, ResumeCard];
  };
  contact: {
    label: string;
    title: string;
    text: string;
    nameLabel: string;
    emailLabel: string;
    messageLabel: string;
    namePlaceholder: string;
    emailPlaceholder: string;
    messagePlaceholder: string;
    required: string;
    send: string;
    sending: string;
    sent: string;
    error: string;
    invalid: string;
    privacy: string;
    privacyLink: string;
    noScript: string;
    footer: string;
    backTop: string;
  };
}

export type ContentDictionary = Record<Locale, TranslationContent>;
