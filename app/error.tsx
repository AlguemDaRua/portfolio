"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-level safety net: a render error never leaves the visitor with a blank
 * page. The language is unknown here, so the copy is short and bilingual.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaces in the browser console and in Vercel's runtime logs.
    console.error(error);
  }, [error]);

  return (
    <main className="status-page" id="main-content">
      <span className="eyebrow">Erro · Error</span>
      <h1 className="status-title">Algo falhou. Something broke.</h1>
      <p className="status-text">
        A página não carregou como devia. Tenta outra vez ou usa o{" "}
        <Link className="status-link" href="/#contact">
          formulário de contacto
        </Link>
        . The page did not load as expected — try again or use the contact form.
      </p>
      <div className="status-actions">
        <button type="button" className="btn-primary" onClick={reset}>
          Tentar de novo · Try again
        </button>
        <Link className="btn-ghost" href="/">
          Início · Home
        </Link>
      </div>
    </main>
  );
}
