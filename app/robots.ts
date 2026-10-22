import type { MetadataRoute } from "next";

const site = "https://azam.lol";

/**
 * The endpoint is deliberately absent: a crawler has no business posting, and
 * the form is for people. `/pdf/` is a document, not a page to index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
