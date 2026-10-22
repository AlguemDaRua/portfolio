"use client";

import Link from "next/link";

/**
 * Last line of defence: rendered instead of the whole document when the root
 * layout itself throws, so it carries its own <html>/<body> and inline styles.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "32px",
          background: "#fafaf7",
          color: "#15161a",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <main style={{ maxWidth: "44ch" }}>
          <p
            style={{
              margin: 0,
              fontFamily: "ui-monospace, monospace",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#5b5e67",
            }}
          >
            Erro · Error
          </p>
          <h1
            style={{
              margin: "14px 0 0",
              fontSize: "clamp(30px, 5vw, 44px)",
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
              fontWeight: 500,
            }}
          >
            Algo falhou. Something broke.
          </h1>
          <p style={{ margin: "16px 0 0", lineHeight: 1.7, color: "#43464e" }}>
            Recarrega a página ou escreve para{" "}
            <a href="mailto:azamusman@proton.me" style={{ color: "inherit" }}>
              azamusman@proton.me
            </a>
            .{" "}
            {error.digest ? `(${error.digest})` : ""} Reload the page or send an
            email.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 26 }}>
            <button
              type="button"
              onClick={reset}
              style={{
                minHeight: 44,
                padding: "0 20px",
                border: "1px solid #15161a",
                borderRadius: 999,
                background: "#15161a",
                color: "#fff",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Tentar de novo · Try again
            </button>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: 44,
                padding: "0 20px",
                border: "1px solid #e4e4dd",
                borderRadius: 999,
                color: "#43464e",
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              Início · Home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
