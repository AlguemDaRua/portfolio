import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Página não encontrada — Azam Usman",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="status-page" id="main-content">
      <span className="eyebrow">404</span>
      <h1 className="status-title">Esta página não existe.</h1>
      <p className="status-text">
        O endereço que abriste não faz parte do portfólio. The address you opened
        is not part of this portfolio.
      </p>
      <div className="status-actions">
        <Link className="btn-primary" href="/">
          Voltar ao início · Back home
        </Link>
      </div>
    </main>
  );
}
