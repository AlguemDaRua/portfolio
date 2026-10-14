import { ContentDictionary } from "./types";

export const portfolioContent: ContentDictionary = {
  pt: {
    nav: {
      home: "Início",
      label: "Navegação principal",
      open: "Abrir navegação",
      close: "Fechar navegação",
      skip: "Saltar para o conteúdo",
      about: "Sobre",
      work: "Projectos",
      skills: "Competências",
      resume: "Currículo",
      contact: "Contacto",
    },
    theme: {
      label: "Tema",
      light: "Claro",
      dark: "Escuro",
      lightAction: "Mudar para tema claro",
      darkAction: "Mudar para tema escuro",
    },
    hero: {
      eyebrow: "DESENVOLVEDOR DE SOFTWARE",
      edition: "PORTFÓLIO / 2026",
      title: "Desenvolvo",
      titleAccent: "software.",
      text: "Da interface à infraestrutura. Crio aplicações móveis, serviços de backend e sistemas completos, com atenção ao detalhe em cada etapa.",
      work: "Ver projectos seleccionados",
      about: "Sobre mim",
      cv: "Ver currículos em PDF",
      focus: "MOBILE · BACKEND & DEVOPS · FULL-STACK",
    },
    about: {
      label: "01 / SOBRE",
      title: "Sobre mim",
      text: "Finalista de Engenharia Informática e de Telecomunicações no ISUTC (Instituto Superior de Transportes e Comunicações). O meu foco reside na criação de soluções completas de ponta a ponta: desenvolvo aplicações móveis fluidas e intuitivas com Flutter, enquanto desenho serviços de backend resilientes em Go e Java, bancos de dados MariaDB/MySQL otimizados, contentores Docker e pipelines de CI/CD automatizadas.",
      educationLabel: "FORMAÇÃO ACADÉMICA",
      education: {
        degree: "Engenharia Informática e de Telecomunicações",
        institution: "ISUTC — Instituto Superior de Transportes e Comunicações",
        period: "2020 — PRESENTE",
      },
      locationLabel: "LOCALIZAÇÃO",
      location: "Maputo, Moçambique",
    },
    work: {
      label: "02 / PROJECTOS",
      title: "Projectos seleccionados",
      intro:
        "Uma selecção de projectos recentes desenvolvidos em contexto profissional, pessoal e académico.",
      moreLabel: "OUTROS PROJECTOS",
      moreProjects: "BLink · Gestão de Reclamações",
    },
    projects: [
      {
        name: "GetJobs",
        category: "Plataforma de recrutamento full-stack",
        context: "Pathway Consulting",
        year: "2025—26",
        description:
          "Plataforma completa de recrutamento com interface web reactiva e de alta performance, API REST robusta, fluxos seguros de autenticação, catálogo de vagas e esteira de candidaturas.",
        tags: [
          "Full-Stack",
          "REST API",
          "React",
          "Node.js",
          "Express",
          "PostgreSQL",
        ],
      },
      {
        name: "LibreDex",
        category: "Aplicação móvel offline-first",
        context: "Projecto pessoal",
        year: "2026",
        description:
          "Aplicação móvel desenvolvida em Flutter com arquitetura offline-first. Armazenamento persistente local em SQLite, filtros de pesquisa em tempo real e sincronização eficiente.",
        tags: ["Flutter", "Dart", "SQLite", "Offline-First", "Mobile UX"],
      },
      {
        name: "Gestão de Estacionamentos",
        category: "Aplicação móvel & infraestrutura em tempo real",
        context: "Projecto de equipa · ISUTC",
        year: "2025",
        description:
          "Solução móvel integrada para gestão e reserva de lugares de estacionamento. Inclui painel administrativo em tempo real, Firebase, geolocalização e controlo dinâmico de ocupação.",
        tags: [
          "Flutter",
          "Firebase",
          "Geolocalização",
          "Mobile",
          "Real-Time DB",
        ],
      },
    ],
    skills: {
      label: "03 / COMPETÊNCIAS",
      title: "Stack técnica & especialidades",
      groups: [
        {
          label: "MOBILE DEV",
          skills: [
            "Flutter",
            "Dart",
            "SQLite",
            "Firebase",
            "Android Nativo",
            "Mobile UI/UX",
            "Offline-First",
          ],
        },
        {
          label: "BACKEND & DEVOPS",
          skills: [
            "Go (Golang)",
            "Java",
            "Docker",
            "CI/CD (GitHub Actions)",
            "MariaDB",
            "MySQL",
            "REST APIs",
            "Linux / Shell",
          ],
        },
        {
          label: "WEB & FRONTEND",
          skills: [
            "TypeScript",
            "JavaScript",
            "Next.js",
            "React",
            "Tailwind CSS",
            "Node.js",
            "Express",
          ],
        },
        {
          label: "OUTRAS",
          skills: [
            "Python",
            "PHP",
            "Git & GitHub",
            "Redes & Protocolos",
            "Arquitetura de Sistemas",
          ],
        },
      ],
    },
    cv: {
      label: "04 / CURRÍCULO",
      title: "Currículo profissional",
      text: "Consulta ou descarrega o meu currículo em formato PDF. As duas edições oficiais (Português e Inglês) estão disponíveis lado a lado.",
      items: [
        {
          langCode: "PT",
          title: "Currículo em Português",
          badge: "EDIÇÃO PT",
          description:
            "Perfil completo com histórico profissional, formação em Engenharia no ISUTC, projectos práticos e competências técnicas.",
          fileSize: "PDF · 232 KB",
          filePath: "/pdf/CV_AzamUsman_PT.pdf",
          downloadLabel: "Descarregar PDF",
          viewLabel: "Visualizar",
        },
        {
          langCode: "EN",
          title: "Currículo em Inglês",
          badge: "EDIÇÃO EN",
          description:
            "A mesma experiência e competências, numa edição em inglês para oportunidades e equipas internacionais.",
          fileSize: "PDF · 212 KB",
          filePath: "/pdf/CV_AzamUsman_EN.pdf",
          downloadLabel: "Descarregar PDF",
          viewLabel: "Visualizar",
        },
      ],
    },
    contact: {
      label: "05 / CONTACTO",
      title: "Vamos conversar.",
      text: "Tens um projeto em mente, uma oportunidade ou gostarias de discutir engenharia de software? Envia-me uma mensagem direta.",
      nameLabel: "Nome",
      emailLabel: "O teu e-mail",
      messageLabel: "Mensagem",
      namePlaceholder: "Como te chamas?",
      emailPlaceholder: "Para onde posso responder?",
      messagePlaceholder: "Conta-me um pouco sobre o teu projeto ou ideia…",
      required: "Todos os campos são obrigatórios.",
      send: "Enviar mensagem",
      sending: "A enviar…",
      sent: "Mensagem aceite para envio. Obrigado pelo contacto!",
      error:
        "Não foi possível confirmar o envio. O teu texto foi mantido; tenta novamente mais tarde.",
      invalid:
        "Preenche o nome, um e-mail válido e uma mensagem com pelo menos 10 caracteres.",
      unavailable:
        "O formulário está temporariamente indisponível. Tenta novamente mais tarde.",
      privacy:
        "O teu nome, e-mail e mensagem são enviados através do FormSubmit para que eu possa responder. Não incluas informações sensíveis.",
      privacyLink: "Privacidade do FormSubmit",
      noScript:
        "Sem JavaScript, o envio continua na página de confirmação do FormSubmit.",
      footer: "© 2026 Azam Usman · Todos os direitos reservados.",
      backTop: "Voltar ao topo",
    },
  },
  en: {
    nav: {
      home: "Home",
      label: "Main navigation",
      open: "Open navigation",
      close: "Close navigation",
      skip: "Skip to content",
      about: "About",
      work: "Projects",
      skills: "Skills",
      resume: "Resume",
      contact: "Contact",
    },
    theme: {
      label: "Theme",
      light: "Light",
      dark: "Dark",
      lightAction: "Switch to light theme",
      darkAction: "Switch to dark theme",
    },
    hero: {
      eyebrow: "SOFTWARE DEVELOPER",
      edition: "PORTFOLIO / 2026",
      title: "I build",
      titleAccent: "software.",
      text: "From interface to infrastructure. I build mobile apps, backend services, and complete systems, with attention to detail at every step.",
      work: "View selected projects",
      about: "About me",
      cv: "View CVs in PDF",
      focus: "MOBILE · BACKEND & DEVOPS · FULL-STACK",
    },
    about: {
      label: "01 / ABOUT",
      title: "About me",
      text: "Senior student in Information Technology and Telecommunications Engineering at ISUTC. I specialize in complete end-to-end systems engineering: crafting polished mobile apps with Flutter, while building high-performance backends in Go and Java, managing MariaDB/MySQL databases, and orchestrating Docker containers with automated CI/CD pipelines.",
      educationLabel: "EDUCATION",
      education: {
        degree: "Information Technology & Telecommunications Engineering",
        institution: "ISUTC — Higher Institute of Transport and Communications",
        period: "2020 — PRESENT",
      },
      locationLabel: "LOCATION",
      location: "Maputo, Mozambique",
    },
    work: {
      label: "02 / WORK",
      title: "Selected projects",
      intro:
        "A curated selection of recent work across professional, personal, and academic projects.",
      moreLabel: "MORE PROJECTS",
      moreProjects: "BLink · Complaints Management",
    },
    projects: [
      {
        name: "GetJobs",
        category: "Full-stack recruitment platform",
        context: "Pathway Consulting",
        year: "2025—26",
        description:
          "End-to-end recruitment solution with a responsive web interface, scalable REST API, secure authentication pipelines, job board listings, and applicant tracking flows.",
        tags: [
          "Full-Stack",
          "REST API",
          "React",
          "Node.js",
          "Express",
          "PostgreSQL",
        ],
      },
      {
        name: "LibreDex",
        category: "Offline-first mobile application",
        context: "Personal project",
        year: "2026",
        description:
          "Flutter reference app built around an offline-first architecture. Features persistent local SQLite storage, low-latency search filters, and smooth UI transitions.",
        tags: ["Flutter", "Dart", "SQLite", "Offline-First", "Mobile UX"],
      },
      {
        name: "Parking Management",
        category: "Cross-platform mobile & real-time backend",
        context: "Team project · ISUTC",
        year: "2025",
        description:
          "Integrated mobile application for real-time parking space monitoring and reservations, featuring Firebase synchronization, live geolocation, and administrative dashboards.",
        tags: ["Flutter", "Firebase", "Geolocation", "Mobile", "Real-Time DB"],
      },
    ],
    skills: {
      label: "03 / SKILLS",
      title: "Technical stack & specialties",
      groups: [
        {
          label: "MOBILE DEV",
          skills: [
            "Flutter",
            "Dart",
            "SQLite",
            "Firebase",
            "Native Android",
            "Mobile UI/UX",
            "Offline-First",
          ],
        },
        {
          label: "BACKEND & DEVOPS",
          skills: [
            "Go (Golang)",
            "Java",
            "Docker",
            "CI/CD (GitHub Actions)",
            "MariaDB",
            "MySQL",
            "REST APIs",
            "Linux / Shell",
          ],
        },
        {
          label: "WEB & FRONTEND",
          skills: [
            "TypeScript",
            "JavaScript",
            "Next.js",
            "React",
            "Tailwind CSS",
            "Node.js",
            "Express",
          ],
        },
        {
          label: "OTHER",
          skills: [
            "Python",
            "PHP",
            "Git & GitHub",
            "Networking & Telecom",
            "System Architecture",
          ],
        },
      ],
    },
    cv: {
      label: "04 / RESUME",
      title: "Professional resume",
      text: "Review or download my detailed curriculum vitae in PDF format. Both official Portuguese and English editions are available side by side.",
      items: [
        {
          langCode: "PT",
          title: "Portuguese Edition",
          badge: "PT EDITION",
          description:
            "Full professional profile including ISUTC engineering degree, hands-on production projects, and software stack.",
          fileSize: "PDF · 232 KB",
          filePath: "/pdf/CV_AzamUsman_PT.pdf",
          downloadLabel: "Download PDF",
          viewLabel: "Open PDF",
        },
        {
          langCode: "EN",
          title: "English Edition",
          badge: "EN EDITION",
          description:
            "Comprehensive background covering systems engineering, ISUTC education, mobile/backend architectures, and DevOps.",
          fileSize: "PDF · 212 KB",
          filePath: "/pdf/CV_AzamUsman_EN.pdf",
          downloadLabel: "Download PDF",
          viewLabel: "Open in browser",
        },
      ],
    },
    contact: {
      label: "05 / CONTACT",
      title: "Get in touch.",
      text: "Have a project in mind, an exciting opportunity, or want to connect about software engineering? Send me a direct message.",
      nameLabel: "Name",
      emailLabel: "Your email",
      messageLabel: "Message",
      namePlaceholder: "What should I call you?",
      emailPlaceholder: "Where can I reply?",
      messagePlaceholder: "Tell me a little about your project or idea…",
      required: "All fields are required.",
      send: "Send message",
      sending: "Sending…",
      sent: "Message accepted for sending. Thank you for getting in touch!",
      error:
        "Could not confirm the submission. Your text has been kept; please try again later.",
      invalid:
        "Enter your name, a valid email and a message with at least 10 characters.",
      unavailable:
        "The contact form is temporarily unavailable. Please try again later.",
      privacy:
        "Your name, email and message are sent through FormSubmit so I can reply. Please do not include sensitive information.",
      privacyLink: "FormSubmit privacy policy",
      noScript:
        "Without JavaScript, submission continues on the FormSubmit confirmation page.",
      footer: "© 2026 Azam Usman · All rights reserved.",
      backTop: "Back to top",
    },
  },
};
