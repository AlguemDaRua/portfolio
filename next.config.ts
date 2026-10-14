import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// NEXT_PUBLIC values are embedded in the client bundle. Fail early rather than
// accidentally publishing an address entered instead of the invisible-email ID.
const contactFormId = process.env.NEXT_PUBLIC_FORMSUBMIT_ID;
if (contactFormId && !/^[a-zA-Z0-9_-]{16,128}$/.test(contactFormId.trim())) {
  throw new Error(
    "NEXT_PUBLIC_FORMSUBMIT_ID must be the public FormSubmit identifier, not an email address or URL.",
  );
}

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins: ["*.e2b.app"],
  turbopack: {
    root: projectRoot,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
