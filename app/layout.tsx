import type { Metadata, Viewport } from "next";
import "./globals.css";

const site = "https://azam.lol";
const title = "Azam Usman — Engenheiro de Software";
const description =
  "Do ecrã ao servidor. Aplicações móveis em Flutter, serviços backend em Go e Java, e infraestrutura em contentores. Maputo, Moçambique.";

export const metadata: Metadata = {
  title,
  description,
  applicationName: "Azam Usman",
  metadataBase: new URL(site),
  alternates: { canonical: "/" },
  openGraph: {
    url: site,
    title,
    description,
    siteName: "Azam Usman",
    type: "website",
    locale: "pt_MZ",
    alternateLocale: ["en_US"],
  },
  twitter: { card: "summary", title, description },
  robots: { index: true, follow: true },
  authors: [{ name: "Azam Usman" }],
  creator: "Azam Usman",
  keywords: [
    "Azam Usman",
    "Engenheiro de Software",
    "Desenvolvedor Mobile",
    "Backend Developer",
    "Flutter",
    "Golang",
    "Java",
    "Docker",
    "CI/CD",
    "Maputo",
    "Moçambique",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt"
      data-theme="light"
      suppressHydrationWarning
      className="scroll-smooth"
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var root = document.documentElement;
                var savedTheme = null;
                var savedLocale = null;

                try {
                  savedTheme = localStorage.getItem('azam-portfolio-theme');
                } catch {}
                try {
                  savedLocale = localStorage.getItem('azam-portfolio-locale');
                } catch {}

                var validTheme = savedTheme === 'light' || savedTheme === 'dark';
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                root.setAttribute(
                  'data-theme',
                  validTheme ? savedTheme : (prefersDark ? 'dark' : 'light')
                );

                if (savedLocale === 'pt' || savedLocale === 'en') {
                  root.setAttribute('lang', savedLocale);
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen font-sans antialiased">
        {children}
        {/*
          Structured data for search engines: who this is, what they do, where.
          No address and no telephone — the form is the only way in.
        */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Azam Usman",
              url: site,
              jobTitle: "Engenheiro de Software",
              description,
              knowsLanguage: ["pt-MZ", "en"],
              knowsAbout: [
                "Flutter",
                "Dart",
                "Go",
                "Java",
                "Docker",
                "Next.js",
                "React",
                "PostgreSQL",
              ],
              address: {
                "@type": "PostalAddress",
                addressLocality: "Maputo",
                addressCountry: "MZ",
              },
            }).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  );
}
