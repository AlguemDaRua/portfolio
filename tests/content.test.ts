import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { portfolioContent } from "../data/content";

test("Content Parity: pt and en keys match", () => {
  const ptKeys = Object.keys(portfolioContent.pt);
  const enKeys = Object.keys(portfolioContent.en);

  assert.deepEqual(ptKeys.sort(), enKeys.sort(), "PT and EN top-level keys must match");

  for (const key of ["nav", "theme", "hero", "about", "work", "cv", "contact"] as const) {
    const ptSubKeys = Object.keys(portfolioContent.pt[key]).sort();
    const enSubKeys = Object.keys(portfolioContent.en[key]).sort();
    assert.deepEqual(ptSubKeys, enSubKeys, `Keys for section '${key}' must match across locales`);
  }
});

test("Projects Data Integrity", () => {
  for (const locale of ["pt", "en"] as const) {
    const projects = portfolioContent[locale].projects;
    assert.ok(projects.length >= 3, `${locale} must contain at least 3 projects`);

    for (const project of projects) {
      assert.ok(project.name.length > 0, "Project name must not be empty");
      assert.ok(project.category.length > 0, "Project category must not be empty");
      assert.ok(project.description.length > 0, "Project description must not be empty");
      assert.ok(project.tags.length > 0, "Project must have at least one tag");
    }
  }
});

test("Skills Data Integrity", () => {
  for (const locale of ["pt", "en"] as const) {
    const groups = portfolioContent[locale].skills.groups;
    assert.ok(groups.length >= 3, `${locale} must have skill groups`);

    for (const group of groups) {
      assert.ok(group.label.length > 0, "Group label must not be empty");
      assert.ok(group.skills.length > 0, "Group must list skills");
    }
  }
});

test("Curriculum Vitae (CV) Configuration and Files on Disk", () => {
  const rootDir = path.resolve(__dirname, "..");

  for (const locale of ["pt", "en"] as const) {
    const items = portfolioContent[locale].cv.items;
    assert.equal(items.length, 2, "There must be exactly 2 CV items side by side");

    for (const item of items) {
      assert.ok(item.title.length > 0, "CV title must not be empty");
      assert.ok(item.filePath.startsWith("/pdf/"), "CV filePath must point to /pdf/");

      const diskPath = path.join(rootDir, "public", item.filePath);
      assert.ok(fs.existsSync(diskPath), `CV file must exist on disk: ${diskPath}`);

      const stat = fs.statSync(diskPath);
      assert.ok(stat.size > 1000, `CV file must not be empty: ${diskPath}`);
    }
  }
});

test("Contact Information Integrity", () => {
  for (const locale of ["pt", "en"] as const) {
    const { contact } = portfolioContent[locale];
    assert.ok(contact.title.trim().length > 0, "Contact title must not be empty");
    assert.ok(contact.text.trim().length > 0, "Contact text must not be empty");
    assert.ok(contact.form.submit.trim().length > 0);

    for (const [field, label] of Object.entries({
      name: contact.form.name,
      email: contact.form.email,
      subject: contact.form.subject,
      message: contact.form.message,
    })) {
      assert.ok(label.trim().length > 0, `${field} needs a label`);
    }
    for (const [code, message] of Object.entries(contact.form.errors)) {
      assert.ok(message.trim().length > 0, `Missing error copy for ${code}`);
    }
    // The address never travels with the copy: the form is the only door.
    assert.doesNotMatch(JSON.stringify(contact), /@proton\.me/i);
  }
});
