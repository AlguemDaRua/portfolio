import { test, expect, type Page } from "@playwright/test";

const live = (page: Page) => page.locator(".site-shell").first();
const setTheme = (page: Page, dark: boolean) =>
  live(page)
    .locator(".theme-switch button")
    .nth(dark ? 1 : 0)
    .click();

async function expectCleanTheme(page: Page, theme: string) {
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  await expect(page.locator(".water-snapshot")).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveClass(/water-transitioning/);
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

test("the water reveal works without View Transitions and keeps the exact old/new tokens", async ({
  page,
}) => {
  await page.evaluate(() => {
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: undefined,
    });
  });
  const oldToken = await page
    .locator("html")
    .evaluate((root) => getComputedStyle(root).getPropertyValue("--text"));
  await setTheme(page, true);
  const snapshot = page.locator(".water-snapshot");
  await expect(snapshot).toHaveCount(1);
  await expect(snapshot).toHaveAttribute("aria-hidden", "true");
  await expect(snapshot).toHaveAttribute("inert", "");
  expect(
    await snapshot.evaluate((node) =>
      getComputedStyle(node).getPropertyValue("--text"),
    ),
  ).toBe(oldToken);
  expect(
    await page
      .locator("html")
      .evaluate((root) => getComputedStyle(root).getPropertyValue("--text")),
  ).not.toBe(oldToken);
  // The live page is clipped to a growing circle; the copy shows around it.
  await expect
    .poll(() =>
      live(page).evaluate((node) => getComputedStyle(node).clipPath),
    )
    .toMatch(/^circle\([\d.]+px at /);
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

test("switching language runs the same water, keeping the old words in the copy", async ({
  page,
}) => {
  const heading = live(page).locator("h1");
  const before = (await heading.innerText()).trim();

  await live(page).getByRole("button", { name: "English", exact: true }).click();
  const snapshot = page.locator(".water-snapshot");
  await expect(snapshot).toHaveCount(1);
  await expect(snapshot.locator("h1")).toContainText(before.split("\n")[0]);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(heading).toContainText("From screen");
  await expect(snapshot).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveClass(/water-transitioning/);
  await expect(page.locator("canvas")).toHaveCount(0);

  await live(page).getByRole("button", { name: "Português", exact: true }).click();
  await expect(snapshot).toHaveCount(1);
  await expect(snapshot.locator("h1")).toContainText("From screen");
  await expect(heading).toContainText(before.split("\n")[0]);
  await expect(snapshot).toHaveCount(0);
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
      const copy = document.querySelector(".water-snapshot .site-shell")!;
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

test("the final frame is fully open and leaves no clip behind", async ({
  page,
}) => {
  const radii: number[] = [];
  await page.evaluate(() => {
    const target = document.querySelector<HTMLElement>(".site-shell")!;
    const read = () => {
      const clip = getComputedStyle(target).clipPath;
      const match = /circle\(([\d.]+)px/.exec(clip);
      if (match) (window as unknown as { radii: number[] }).radii.push(Number(match[1]));
      requestAnimationFrame(read);
    };
    (window as unknown as { radii: number[] }).radii = [];
    requestAnimationFrame(read);
  });
  await setTheme(page, true);
  await expectCleanTheme(page, "dark");
  const samples = await page.evaluate(
    () => (window as unknown as { radii: number[] }).radii,
  );
  radii.push(...samples);
  expect(radii.length).toBeGreaterThan(10);
  const corner = await page.evaluate(() =>
    Math.hypot(innerWidth, innerHeight) / 2,
  );
  // The wave keeps growing until it is past the corners, then the clip goes.
  expect(Math.max(...radii)).toBeGreaterThan(corner * 0.85);
  expect(radii.every((radius, index) => index === 0 || radius >= radii[index - 1])).toBe(true);
  await expect(live(page)).toHaveCSS("clip-path", "none");
  await expect(live(page)).toHaveCSS("z-index", "auto");
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
