import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { portfolioContent } from "../data/content";

test("Navigation Targets Match Section IDs", () => {
  const rootDir = path.resolve(__dirname, "..");
  const sectionsDir = path.join(rootDir, "components", "sections");

  // Read all section component files
  const sectionFiles = fs.readdirSync(sectionsDir).filter(f => f.endsWith(".tsx"));
  const foundIds = new Set<string>();

  for (const file of sectionFiles) {
    const content = fs.readFileSync(path.join(sectionsDir, file), "utf-8");
    const matches = content.matchAll(/id="([^"]+)"/g);
    for (const match of matches) {
      foundIds.add(match[1]);
    }
  }

  // Navigation targets from SideRail
  const expectedTargets = ["about", "work", "skills", "resume", "contact"];

  for (const target of expectedTargets) {
    assert.ok(
      foundIds.has(target),
      `Navigation target '#${target}' must have a matching section with id="${target}"`
    );
  }
});

test("Language Translations for Navigation are Non-Empty", () => {
  for (const locale of ["pt", "en"] as const) {
    const nav = portfolioContent[locale].nav;
    assert.ok(nav.home.length > 0);
    assert.ok(nav.about.length > 0);
    assert.ok(nav.work.length > 0);
    assert.ok(nav.skills.length > 0);
    assert.ok(nav.resume.length > 0);
    assert.ok(nav.contact.length > 0);
  }
});
