import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isCrossOrigin, isJsonRequest } from "../lib/contact-http";
import { validateContact } from "../lib/contact";
import config, { securityHeaders } from "../next.config";

const root = process.cwd();
const headerValue = (key: string) =>
  securityHeaders.find((header) => header.key === key)?.value ?? "";

test("Every page carries the security headers that matter", () => {
  const csp = headerValue("Content-Security-Policy");

  // Nothing may load from a stranger, and nothing may frame the site.
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /base-uri 'self'/);
  assert.match(csp, /form-action 'self'/);
  assert.match(csp, /connect-src 'self'/);
  // No `upgrade-insecure-requests`: on purpose. HSTS already forces HTTPS in
  // production, and the directive would rewrite same-origin http requests on
  // a plain-http dev server, breaking local previews.
  assert.doesNotMatch(csp, /upgrade-insecure-requests/);
  // eval is how a script injection turns into code execution.
  assert.doesNotMatch(csp, /unsafe-eval/);

  assert.equal(headerValue("X-Content-Type-Options"), "nosniff");
  assert.equal(headerValue("X-Frame-Options"), "DENY");
  assert.equal(headerValue("Referrer-Policy"), "strict-origin-when-cross-origin");
  assert.match(headerValue("Strict-Transport-Security"), /max-age=\d{7,}/);
  assert.match(headerValue("Permissions-Policy"), /camera=\(\)/);
  assert.equal(headerValue("X-Permitted-Cross-Domain-Policies"), "none");

  // Framing rules must not contradict each other in the two CSP dialects.
  assert.match(csp, /frame-ancestors 'none'/);
  assert.equal(headerValue("X-Frame-Options"), "DENY");
});

test("The headers are shipped by the app, not only by the host", async () => {
  const rules = await config.headers?.();
  assert.ok(rules, "next.config must declare headers()");
  const all = rules.find((rule) => rule.source === "/:path*");
  assert.ok(all, "one rule must cover every path");
  const keys = all.headers.map((header) => header.key);
  for (const key of [
    "Content-Security-Policy",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Referrer-Policy",
    "Permissions-Policy",
    "Strict-Transport-Security",
  ]) {
    assert.ok(keys.includes(key), `Missing ${key}`);
  }
  assert.equal(config.poweredByHeader, false, "Do not advertise the version");

  // Duplicated header blocks drift; vercel.json must not carry a second one.
  const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
  assert.equal(vercel.headers, undefined);
});

test("Another site cannot post through a visitor's browser", () => {
  const post = (headers: Record<string, string>) =>
    isCrossOrigin(
      new Request("https://azam.lol/api/contact", { method: "POST", headers }),
    );

  // Same origin: the form itself.
  assert.equal(post({ origin: "https://azam.lol", host: "azam.lol" }), false);
  // Behind a proxy that rewrites Host.
  assert.equal(
    post({
      origin: "https://azam.lol",
      host: "10.0.0.5:3000",
      "x-forwarded-host": "azam.lol",
    }),
    false,
  );
  // A stranger's page, and a sandboxed iframe.
  assert.equal(post({ origin: "https://evil.test", host: "azam.lol" }), true);
  assert.equal(post({ origin: "null", host: "azam.lol" }), false);
  // curl and uptime checks carry no session, so they are not a CSRF risk.
  assert.equal(post({ host: "azam.lol" }), false);
});

test("Only JSON bodies are parsed", () => {
  const withType = (contentType: string | null) =>
    isJsonRequest(
      new Request("https://azam.lol/api/contact", {
        method: "POST",
        headers: contentType ? { "content-type": contentType } : undefined,
        body: "{}",
      }),
    );

  assert.equal(withType("application/json"), true);
  assert.equal(withType("application/json; charset=utf-8"), true);
  // A plain form post or a text body skips CORS entirely: refuse it.
  assert.equal(withType("text/plain"), false);
  assert.equal(withType("application/x-www-form-urlencoded"), false);
  assert.equal(withType(null), false);
});

test("Hostile text is cleaned before it is judged", () => {
  const result = validateContact({
    name: "Azam\u0000\u0007 Usman",
    email: "  hello@example.com  ",
    subject: "Proposta\r\nBcc: evil@example.com",
    message: "Olá.\u0000\n\nSegunda linha com \u001b escape.",
    company: "",
    elapsed: 9000,
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  // NUL and ESC are gone; the newline in the message survives.
  assert.equal(result.value.name, "Azam Usman");
  assert.equal(result.value.subject, "Proposta Bcc: evil@example.com");
  assert.match(result.value.message, /^Olá\.\n\nSegunda linha com escape\.$/);
  assert.equal(result.value.email, "hello@example.com");
});
