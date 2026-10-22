import { test, expect } from "@playwright/test";

test("the page arrives with the headers that stop an attack", async ({
  request,
}) => {
  const response = await request.get("/");
  expect(response.status()).toBe(200);

  const headers = response.headers();
  const csp = headers["content-security-policy"] ?? "";

  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).not.toContain("unsafe-eval");

  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["strict-transport-security"]).toContain("max-age=");
  // No free advertising of the framework and its version.
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("the contact endpoint refuses the wrong door and the wrong page", async ({
  request,
}) => {
  const message = {
    name: "Azam",
    email: "hello@example.com",
    subject: "Uma ideia",
    message: "A proper message with more than twenty characters in it.",
    elapsed: 9000,
  };

  // A plain form post skips CORS entirely.
  const plain = await request.post("/api/contact", {
    headers: { "content-type": "text/plain" },
    data: JSON.stringify(message),
  });
  expect(plain.status()).toBe(415);

  // Another site trying to post through a visitor's browser.
  const foreign = await request.post("/api/contact", {
    headers: { origin: "https://evil.test" },
    data: message,
  });
  expect(foreign.status()).toBe(403);

  // Only POST exists here.
  expect((await request.get("/api/contact")).status()).toBe(405);
});

test("crawlers get a map, and the site invites a security report", async ({
  request,
}) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  const robotsBody = await robots.text();
  expect(robotsBody).toContain("Sitemap:");
  expect(robotsBody).toContain("Disallow: /api/");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("https://azam.lol");

  const security = await request.get("/.well-known/security.txt");
  expect(security.status()).toBe(200);
  const text = await security.text();
  expect(text).toContain("Contact: https://azam.lol/#contact");
  // The address itself never ships, not even in a report channel.
  expect(text).not.toContain("@");
});
