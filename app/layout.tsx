import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Azam Usman — Desenvolvedor de Software",
  description:
    "Portfólio profissional de Azam Usman — Especialista em desenvolvimento móvel (Flutter), backends de alto desempenho (Go, Java), Docker, CI/CD e engenharia full-stack em Maputo, Moçambique.",
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
    <html lang="pt" suppressHydrationWarning className="scroll-smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('azam-portfolio-theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'dark' || (!saved && prefersDark)) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                  var lang = localStorage.getItem('azam-portfolio-locale');
                  if (lang) {
                    document.documentElement.setAttribute('lang', lang);
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
