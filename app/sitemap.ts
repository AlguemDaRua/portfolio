import type { MetadataRoute } from "next";

const site = "https://azam.lol";

/**
 * One page, two languages as one URL each: the portfolio switches language in
 * the browser, so there is no `/en` twin to declare as an alternate.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: site,
      // A fixed date keeps the sitemap static: one less function invocation.
      lastModified: "2026-10-22",
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
