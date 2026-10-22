/**
 * Who is allowed to post to the contact endpoint.
 *
 * A browser attaches `Origin` to every cross-site POST, so a mismatch means
 * somebody else's page is using the endpoint through a visitor's browser.
 * Requests without the header (curl, uptime checks, a server calling us)
 * cannot ride a victim's session, and are let through.
 */
export function isCrossOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return false;

  try {
    const claimed = new URL(origin).host;
    const host =
      request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return Boolean(host) && claimed !== host;
  } catch {
    return true;
  }
}

/** Only JSON is accepted, which also forces a CORS preflight we never answer. */
export function isJsonRequest(request: Request): boolean {
  return (request.headers.get("content-type") ?? "")
    .toLowerCase()
    .includes("application/json");
}
