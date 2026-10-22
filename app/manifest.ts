import type { MetadataRoute } from "next";

/**
 * Enough of a manifest to install the portfolio like an app: one icon (the
 * same SVG the tab uses), the two theme colors the site already paints with.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Azam Usman — Engenheiro de Software",
    short_name: "Azam Usman",
    description:
      "Portfólio de Azam Usman: aplicações móveis em Flutter, backend em Go e Java, infraestrutura em contentores.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf7",
    theme_color: "#000000",
    lang: "pt-MZ",
    dir: "ltr",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
