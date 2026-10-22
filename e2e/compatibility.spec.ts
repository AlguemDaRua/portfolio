import { test, expect, type Page } from "@playwright/test";

const live = (page: Page) => page.locator(".site-shell").first();
const setTheme = (page: Page, dark: boolean) =>
  live(page)
    .locator(".theme-switch button")
    .nth(dark ? 1 : 0)
    .click();

async function expectCleanTheme(page: Page, theme: string) {
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  await expect(page.locator(".theme-snapshot")).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveClass(/theme-transitioning/);
  await expect(page.locator("canvas")).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("azam-portfolio-theme", "light");
    localStorage.setItem("azam-portfolio-locale", "pt");
  });
  await page.goto("/");
  await expect(
    live(page).locator(".theme-switch button").first(),
  ).toHaveAttribute("aria-pressed", "true");
  await page.evaluate(() => document.fonts.ready);
});

test("ink works without View Transitions and preserves exact old/new theme tokens", async ({
  page,
}) => {
  await page.evaluate(() => {
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: undefined,
    });
  });
  const oldInk = await page
    .locator("html")
    .evaluate((root) => getComputedStyle(root).getPropertyValue("--ink"));
  await setTheme(page, true);
  const snapshot = page.locator(".theme-snapshot");
  await expect(snapshot).toHaveCount(1);
  await expect(snapshot).toHaveAttribute("aria-hidden", "true");
  await expect(snapshot).toHaveAttribute("inert", "");
  expect(
    await snapshot.evaluate((node) =>
      getComputedStyle(node).getPropertyValue("--ink"),
    ),
  ).toBe(oldInk);
  expect(
    await page
      .locator("html")
      .evaluate((root) => getComputedStyle(root).getPropertyValue("--ink")),
  ).not.toBe(oldInk);
  await expect
    .poll(() => snapshot.evaluate((node) => getComputedStyle(node).maskImage))
    .toContain("data:image/png");
  expect(
    await page.locator("[id]").evaluateAll((nodes) => {
      const ids = nodes.map((node) => node.id);
      return ids.length === new Set(ids).size;
    }),
  ).toBe(true);
  await expectCleanTheme(page, "dark");
  await setTheme(page, false);
  await expectCleanTheme(page, "light");
});

for (const width of [390, 1440]) {
  test(`snapshot geometry stays aligned while scrolled (${width}px)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() =>
      window.scrollTo({ top: 1100, behavior: "instant" }),
    );
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    await setTheme(page, true);
    const geometry = await page.evaluate(() => {
      const source = document.querySelector(".site-shell")!;
      const copy = document.querySelector(".theme-snapshot .site-shell")!;
      return [".side-rail", ".work-section", ".hero h1"].map((selector) => {
        const a = source.querySelector(selector)!.getBoundingClientRect();
        const b = copy.querySelector(selector)!.getBoundingClientRect();
        return [
          Math.abs(a.x - b.x),
          Math.abs(a.y - b.y),
          Math.abs(a.width - b.width),
          Math.abs(a.height - b.height),
        ];
      });
    });
    for (const differences of geometry)
      for (const delta of differences) expect(delta).toBeLessThan(1);
    await expectCleanTheme(page, "dark");
  });
}

test("rapid clicks, resize, reduced motion and scrolling leave no stale copies", async ({
  page,
}) => {
  await page.evaluate(() => {
    const [light, dark] = document.querySelectorAll<HTMLButtonElement>(
      ".site-shell .theme-switch button",
    );
    dark.click();
    light.click();
    dark.click();
  });
  await expectCleanTheme(page, "dark");
  await setTheme(page, false);
  await page.setViewportSize({ width: 900, height: 700 });
  await expectCleanTheme(page, "light");
  await setTheme(page, true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expectCleanTheme(page, "dark");
  await setTheme(page, false);
  await expectCleanTheme(page, "light");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await setTheme(page, true);
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: "instant" }));
  await expectCleanTheme(page, "dark");
});

for (const failure of ["masks", "canvas", "encoding", "storage"] as const) {
  test(`progressive fallback: ${failure} unavailable`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.evaluate((feature) => {
      if (feature === "masks") CSS.supports = () => false;
      if (feature === "canvas")
        Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
          value: () => null,
        });
      if (feature === "encoding")
        HTMLCanvasElement.prototype.toDataURL = () => {
          throw new Error("Blocked canvas readback");
        };
      if (feature === "storage") {
        Storage.prototype.getItem = () => {
          throw new Error("Blocked storage");
        };
        Storage.prototype.setItem = () => {
          throw new Error("Blocked storage");
        };
      }
    }, failure);
    await setTheme(page, true);
    await expectCleanTheme(page, "dark");
    await setTheme(page, false);
    await expectCleanTheme(page, "light");
    expect(errors).toEqual([]);
  });
}

test("the final inverse mask has no opaque pixels left", async ({ page }) => {
  await page.evaluate(() => {
    const encode = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (...args) {
      const result = encode.apply(this, args);
      document.documentElement.dataset.lastTestMask = result;
      return result;
    };
  });
  await setTheme(page, true);
  await expectCleanTheme(page, "dark");
  const remainingPixels = await page.evaluate(async () => {
    const image = new Image();
    image.src = document.documentElement.dataset.lastTestMask!;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let remaining = 0;
    for (let i = 3; i < pixels.length; i += 4)
      if (pixels[i] !== 0) remaining += 1;
    delete document.documentElement.dataset.lastTestMask;
    return remaining;
  });
  expect(remainingPixels).toBe(0);
});

test("mobile navigation, translation, PDFs and clipboard failure work across engines", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await live(page)
    .getByRole("button", { name: "English", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(live(page).locator("h1")).toContainText("From screen");
  const menu = live(page).getByRole("button", { name: "Open navigation" });
  await menu.click();
  await expect(live(page).locator("#site-navigation a").first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error("Denied")) },
    }),
  );
  await live(page).getByRole("button", { name: "Copy email" }).click();
  await expect(live(page).getByRole("status")).toContainText("Could not copy");
  for (const path of ["/pdf/CV_AzamUsman_PT.pdf", "/pdf/CV_AzamUsman_EN.pdf"]) {
    expect((await page.request.get(path)).status()).toBe(200);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
