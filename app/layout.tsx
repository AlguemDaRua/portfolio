import type { Metadata } from "next";
import "./globals.css";

const title = "Azam Usman — Desenvolvedor de Software";
const description =
  "Da interface à infraestrutura. Portfólio de Azam Usman: aplicações móveis, backend e sistemas completos. Maputo, Moçambique.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    siteName: "Azam Usman",
    type: "website",
    locale: "pt_MZ",
    alternateLocale: ["en_US"],
  },
  twitter: { card: "summary", title, description },
  authors: [{ name: "Azam Usman" }],
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
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
