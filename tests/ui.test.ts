import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PortfolioShell } from "../components/layout/PortfolioShell";
import { portfolioContent } from "../data/content";

const html = renderToStaticMarkup(createElement(PortfolioShell));

test("The server-rendered portfolio has unique IDs and accessible section headings", () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(
    ids.length,
    new Set(ids).size,
    "Fragment targets must be unique",
  );
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.equal((html.match(/<main\b/g) ?? []).length, 1);
  assert.match(html, /class="skip-link" href="#main-content"/);
  assert.match(html, /<main[^>]*id="main-content"[^>]*tabindex="-1"/);
  for (const match of html.matchAll(/aria-labelledby="([^"]+)"/g)) {
    assert.ok(
      ids.includes(match[1]),
      `${match[1]} must reference an existing heading`,
    );
  }
  for (const match of html.matchAll(/href="#([^"]+)"/g)) {
    assert.ok(
      ids.includes(match[1]),
      `#${match[1]} must have a fragment target`,
    );
  }
});

test("The mobile menu declares its state and controlled navigation", () => {
  assert.match(html, /id="site-navigation"/);
  assert.match(html, /aria-controls="site-navigation"/);
  assert.match(html, /aria-expanded="false"/);
  for (const locale of ["pt", "en"] as const) {
    const { nav, contact } = portfolioContent[locale];
    for (const label of [
      nav.open,
      nav.close,
      nav.skip,
      nav.label,
      contact.copyError,
    ]) {
      assert.ok(label.trim().length > 0);
    }
  }
});

test("Projects remain honest non-link entries and the email/PDF actions have real targets", () => {
  assert.equal(
    (html.match(/class="project-row"/g) ?? []).length,
    portfolioContent.pt.projects.length,
  );
  assert.doesNotMatch(html, /href="#"|href="javascript:/);
  assert.match(html, /href="mailto:azamusman@proton.me"/);
  assert.match(html, /role="status" aria-live="polite"/);
  for (const item of portfolioContent.pt.cv.items) {
    assert.ok(html.includes(`href="${item.filePath}"`));
    assert.ok(fs.existsSync(path.join(__dirname, "../public", item.filePath)));
  }
});

function luminance(hex: string): number {
  const channels = hex.match(/[\da-f]{2}/gi)!.map((value) => {
    const channel = parseInt(value, 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

test("Small-text theme tokens maintain WCAG AA contrast on their surfaces", () => {
  const css = fs.readFileSync(
    path.join(__dirname, "../styles/tokens.css"),
    "utf8",
  );
  const blocks = [
    ...css.matchAll(/:root(?:\[data-theme="dark"\])?\s*\{([^}]+)\}/g),
  ];
  assert.equal(blocks.length, 2);
  for (const [index, block] of blocks.entries()) {
    const tokens = Object.fromEntries(
      [...block[1].matchAll(/(--[\w-]+):\s*(#[\da-f]{6})/gi)].map((match) => [
        match[1],
        match[2],
      ]),
    );
    const pairs = [
      ["--text", "--paper"],
      ["--muted", "--paper"],
      ["--meta", "--paper"],
      ["--faint", "--paper"],
      ["--subtle", "--paper"],
      ["--body-text", "--soft"],
      ["--body-muted", "--soft"],
      ["--meta", "--soft"],
      ["--accent", "--paper"],
      ["--accent", "--soft"],
      ["--inverse-text", "--text"],
      ["--inverse-text", "--accent"],
    ];
    for (const [foreground, background] of pairs) {
      const a = luminance(tokens[foreground]);
      const b = luminance(tokens[background]);
      const contrast = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      assert.ok(
        contrast >= 4.5,
        `${index === 0 ? "Light" : "Dark"}: ${foreground} on ${background} = ${contrast.toFixed(2)}:1`,
      );
    }
  }
});
