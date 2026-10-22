import { test, expect, type Page } from "@playwright/test";

const form = (page: Page) => page.locator(".contact-form");

const fill = async (page: Page) => {
  await page.locator('[name="name"]').fill("Azam");
  await page.locator('[name="email"]').fill("hello@example.com");
  await page.locator('[name="subject"]').fill("Novo produto");
  await page
    .locator('[name="message"]')
    .fill("I would like to talk about a new product I am building.");
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("azam-portfolio-theme", "light");
    localStorage.setItem("azam-portfolio-locale", "en");
  });
  await page.goto("/");
  await expect(form(page)).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
});

test("the address is nowhere: the form is the only way in", async ({ page }) => {
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  const source = await page.content();
  expect(source).not.toContain("proton.me");
  expect(source).not.toContain("@azamusman");
  await expect(
    page.getByRole("button", { name: "Send message" }),
  ).toBeVisible();
});

test("an empty submit names every field and puts the cursor on the first", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator(".contact-error")).toHaveCount(4);
  await expect(page.locator('[name="name"]')).toBeFocused();
  await expect(page.locator('[name="name"]')).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  // Nothing left the browser.
  await expect(form(page)).toBeVisible();
});

test("a complete message sends, thanks the sender and can be repeated", async ({
  page,
}) => {
  let payload: Record<string, unknown> = {};
  await page.route("**/api/contact", async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, via: "test" }),
    });
  });

  await fill(page);
  await page.getByRole("button", { name: "Send message" }).click();

  await expect(page.locator(".contact-sent")).toContainText("Message sent.");
  expect(payload.name).toBe("Azam");
  expect(payload.subject).toBe("Novo produto");
  expect(payload.message).toContain("new product");
  expect(Number(payload.elapsed)).toBeGreaterThan(0);
  expect(payload.company).toBe("");

  await page.getByRole("button", { name: "Send another" }).click();
  await expect(form(page)).toBeVisible();
  await expect(page.locator('[name="name"]')).toHaveValue("");
});

test("a provider that is not configured says so, without losing the message", async ({
  page,
}) => {
  await page.route("**/api/contact", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, error: "unconfigured" }),
    }),
  );

  await fill(page);
  await page.getByRole("button", { name: "Send message" }).click();

  await expect(page.locator('.contact-form [role="alert"]')).toContainText(
    "Sending is unavailable right now.",
  );
  await expect(page.locator('[name="message"]')).toHaveValue(/new product/);
});

test("a dead network is reported as a dead network", async ({ page }) => {
  await page.route("**/api/contact", (route) => route.abort("failed"));

  await fill(page);
  await page.getByRole("button", { name: "Send message" }).click();

  await expect(page.locator('.contact-form [role="alert"]')).toContainText(
    "No connection.",
  );
});

test("a mistyped domain is named and repaired in one click", async ({ page }) => {
  await page.route("**/api/contact", (route) =>
    route.fulfill({
      status: 422,
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        error: "validation",
        fields: { email: "typo" },
        suggestion: "hello@gmail.com",
      }),
    }),
  );

  await fill(page);
  await page.locator('[name="email"]').fill("hello@gmial.com");
  await page.getByRole("button", { name: "Send message" }).click();

  const error = page.locator('[name="email"] ~ .contact-error');
  await expect(error).toContainText("Did you mean");
  await page.getByRole("button", { name: "hello@gmail.com" }).click();
  await expect(page.locator('[name="email"]')).toHaveValue("hello@gmail.com");
  await expect(error).toHaveCount(0);
});

test("a domain that cannot receive mail is refused in words anyone understands", async ({
  page,
}) => {
  await page.route("**/api/contact", (route) =>
    route.fulfill({
      status: 422,
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        error: "validation",
        fields: { email: "undeliverable" },
      }),
    }),
  );

  await fill(page);
  await page.getByRole("button", { name: "Send message" }).click();

  await expect(page.locator('[name="email"] ~ .contact-error')).toContainText(
    "cannot receive mail",
  );
  await expect(page.locator('[name="message"]')).toHaveValue(/new product/);
});

test("the route never accepts an address nobody could answer", async ({
  request,
}) => {
  const base = {
    name: "Azam",
    subject: "Novo produto",
    message: "A proper message with more than twenty characters in it.",
    elapsed: 9000,
  };

  // A domain with no MX and no host. Where the network can do DNS the route
  // refuses it; where it cannot, the design says "let it through" and the
  // answer is the honest 503. A 200 here would mean an unanswerable message
  // was accepted, which is the one thing that must never happen.
  for (const email of ["ghost@nao-existe-nada.invalid", "azam@gmial.com"]) {
    const response = await request.post("/api/contact", {
      data: { ...base, email },
    });
    expect([422, 503]).toContain(response.status());
    if (response.status() === 422) {
      const body = (await response.json()) as {
        fields?: { email?: string };
        suggestion?: string;
      };
      expect(["undeliverable", "typo"]).toContain(body.fields?.email);
      if (body.fields?.email === "typo") expect(body.suggestion).toContain("@");
    }
  }
});

test("the route itself validates, refuses and ignores bots", async ({
  request,
}) => {
  const message = {
    name: "Azam",
    email: "hello@example.com",
    subject: "Novo produto",
    message: "A proper message with more than twenty characters in it.",
    elapsed: 9000,
  };

  expect((await request.post("/api/contact", { data: { name: "x" } })).status())
    .toBe(422);
  expect(
    (await request.post("/api/contact", { data: message })).status(),
  ).toBe(503); // No provider configured in the test environment.
  expect(
    (
      await request.post("/api/contact", {
        data: { ...message, company: "Acme Corp" },
      })
    ).status(),
  ).toBe(202); // A bot hears a success and gets nothing.
});
