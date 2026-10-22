export type Locale = "pt" | "en";

export interface Project {
  name: string;
  category: string;
  context: string;
  year: string;
  description: string;
  tags: string[];
}

export interface SkillGroup {
  label: string;
  summary: string;
  skills: string[];
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

export interface Fact {
  label: string;
  value: string;
  note: string;
}

export interface TranslationContent {
  meta: {
    location: string;
    edition: string;
  };
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
    available: string;
    title: string;
    titleAccent: string;
    text: string;
    work: string;
    resume: string;
    focus: string;
    scroll: string;
    cardLabel: string;
    cardStamp: string;
    stack: string[];
  };
  about: {
    label: string;
    title: string;
    text: string;
    facts: Fact[];
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
    intro: string;
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
    availability: string;
    footer: string;
    backTop: string;
    form: ContactFormCopy;
  };
}

export type ContactFormCopy = {
  name: string;
  namePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  subject: string;
  subjectPlaceholder: string;
  message: string;
  messagePlaceholder: string;
  submit: string;
  sending: string;
  successTitle: string;
  successText: string;
  again: string;
  privacy: string;
  errorSummary: string;
  errors: {
    required: string;
    email: string;
    short: string;
    long: string;
    undeliverable: string;
    typo: string;
    rate: string;
    unavailable: string;
    delivery: string;
    network: string;
    invalid: string;
  };
}

export type ContentDictionary = Record<Locale, TranslationContent>;
