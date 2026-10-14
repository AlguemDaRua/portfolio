import { test, expect, type Page } from "@playwright/test";
import { portfolioContent } from "../data/content";
import { CONTACT_EMAIL, getContactEndpoint } from "../lib/contact";

const service = "https://formsubmit.co/**";
const form = (page: Page) =>
  page.locator(".site-shell").first().locator(".contact-form");

async function fillContact(page: Page) {
  await form(page).getByLabel("Nome", { exact: true }).fill("Test visitor");
  await form(page)
    .getByLabel("O teu e-mail", { exact: true })
    .fill("visitor@example.org");
  await form(page)
    .getByLabel("Mensagem", { exact: true })
    .fill("A message used only in a mocked browser test.");
}

test.beforeEach(async ({ page }) => {
  // Never contact the service from tests, including accidental native navigation.
  await page.route(service, (route) => route.abort());
  await page.addInitScript(() => {
    localStorage.setItem("azam-portfolio-locale", "pt");
    localStorage.setItem("azam-portfolio-theme", "light");
  });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Português", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("scramble animates PT to EN and back, with stable accessible text and no leftover glyphs", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.evaluate(() => {
    const seen = new Set<string>();
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        const target = record.target as HTMLElement;
        if (target.dataset.scrambling === "true") {
          const section = target.closest("section")?.id;
          if (section) seen.add(`${document.documentElement.lang}:${section}`);
        }
      }
      document.documentElement.dataset.observedScramble = [...seen].join(",");
    });
    observer.observe(document.querySelector(".site-shell")!, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-scrambling"],
    });
  });
  for (const [label, locale] of [
    ["English", "en"],
    ["Português", "pt"],
  ] as const) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("h1 .scramble-target").first()).toHaveText(
      portfolioContent[locale].hero.title,
    );
    // Accessible names use the real translation, not random glyphs.
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(
      new RegExp(portfolioContent[locale].hero.title),
    );
    await expect
      .poll(() => page.locator("html").getAttribute("data-observed-scramble"))
      .toContain(`${locale}:top`);
    await expect(page.locator(".scramble-glyphs")).toHaveCount(0);
  }
});

test("rapid language changes keep the latest text, preserve drafts and respect reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await fillContact(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.evaluate(() => {
    const [pt, en] = document.querySelectorAll<HTMLButtonElement>(
      ".language-switch button",
    );
    en.click();
    pt.click();
    en.click();
  });
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(form(page).getByLabel("Message", { exact: true })).toHaveValue(
    "A message used only in a mocked browser test.",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".scramble-glyphs")).toHaveCount(0);
  await page.getByRole("button", { name: "Português", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "pt");
  await expect(page.locator(".scramble-glyphs")).toHaveCount(0);
  await expect(form(page).getByLabel("Nome", { exact: true })).toHaveValue(
    "Test visitor",
  );
  await expect(
    form(page).getByLabel("O teu e-mail", { exact: true }),
  ).toHaveValue("visitor@example.org");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test.describe("contact form (mocked provider, no mail sent)", () => {
  test("validates fields, prevents duplicate sends and confirms success only after acceptance", async ({
    page,
  }) => {
    let requests = 0;
    let accept: () => void = () => {};
    const accepted = new Promise<void>((resolve) => {
      accept = resolve;
    });
    await page.route(service, async (route) => {
      requests += 1;
      const body = route.request().postDataJSON();
      expect(body.email).toBe("visitor@example.org");
      expect(Object.keys(body).sort()).toEqual([
        "_honey",
        "_subject",
        "_template",
        "email",
        "message",
        "name",
      ]);
      expect(route.request().url()).toBe(getContactEndpoint());
      await accepted;
      await route.fulfill({ json: { success: "true" } });
    });
    const send = form(page).getByRole("button", { name: "Enviar mensagem" });
    await send.click();
    expect(requests).toBe(0);
    await fillContact(page);
    await send.click();
    await expect.poll(() => requests).toBe(1);
    await expect(
      form(page).getByRole("button", { name: "A enviar…" }),
    ).toBeDisabled();
    await expect(form(page).getByLabel("Nome", { exact: true })).toBeDisabled();
    await expect(form(page).getByRole("status")).not.toContainText("aceite");
    await form(page).evaluate((node) =>
      (node as HTMLFormElement).requestSubmit(),
    );
    expect(requests).toBe(1);
    accept();
    await expect(form(page).getByRole("status")).toContainText(
      "aceite para envio",
    );
    await expect(
      form(page).getByLabel("Mensagem", { exact: true }),
    ).toHaveValue("");
    expect(requests).toBe(1);
  });

  test("without JavaScript, the native form posts to the same Gmail destination", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    try {
      const page = await context.newPage();
      let recipientUrl = "";
      await page.route(service, async (route) => {
        recipientUrl = route.request().url();
        expect(route.request().method()).toBe("POST");
        const fields = new URLSearchParams(route.request().postData() ?? "");
        expect(fields.get("email")).toBe("visitor@example.org");
        expect(fields.get("_honey")).toBe("");
        await route.fulfill({
          contentType: "text/html",
          body: "<p>Mock provider confirmation</p>",
        });
      });
      await page.goto(baseURL!);
      await fillContact(page);
      await form(page).getByRole("button", { name: "Enviar mensagem" }).click();
      await expect(page.getByText("Mock provider confirmation")).toBeVisible();
      expect(recipientUrl).toBe(`https://formsubmit.co/${CONTACT_EMAIL}`);
    } finally {
      await context.close();
    }
  });

  for (const failure of [
    "rejection",
    "http",
    "network",
    "invalid-json",
    "timeout",
  ] as const) {
    test(`${failure}: preserves the draft and never displays success or provider details`, async ({
      page,
    }) => {
      await page.route(service, (route) => {
        if (failure === "network") return route.abort();
        if (failure === "timeout") return;
        if (failure === "invalid-json")
          return route.fulfill({
            contentType: "text/html",
            body: "<html>Not JSON</html>",
          });
        return route.fulfill({
          status: failure === "http" ? 429 : 200,
          json: { success: "false", message: "PRIVATE PROVIDER DETAIL" },
        });
      });
      await fillContact(page);
      if (failure === "timeout") await page.clock.install();
      const outgoing = page.waitForRequest((request) =>
        request.url().startsWith("https://formsubmit.co/"),
      );
      await form(page).getByRole("button", { name: "Enviar mensagem" }).click();
      await outgoing;
      if (failure === "timeout") await page.clock.fastForward(15_001);
      await expect(form(page).getByRole("status")).toContainText(
        "Não foi possível confirmar",
      );
      await expect(form(page).getByRole("status")).not.toContainText(
        "PRIVATE PROVIDER DETAIL",
      );
      await expect(
        form(page).getByLabel("Mensagem", { exact: true }),
      ).not.toHaveValue("");
      await expect(
        form(page).getByRole("button", { name: "Enviar mensagem" }),
      ).toBeEnabled();
    });
  }

  test("honeypot entries are rejected without a network request", async ({
    page,
  }) => {
    let requests = 0;
    await page.route(service, (route) => {
      requests += 1;
      return route.abort();
    });
    await fillContact(page);
    await form(page)
      .locator('[name="_honey"]')
      .evaluate((input) => {
        (input as HTMLInputElement).value = "bot";
      });
    await form(page).getByRole("button", { name: "Enviar mensagem" }).click();
    await expect(form(page).getByRole("status")).toContainText("Preenche");
    expect(requests).toBe(0);
  });
});
