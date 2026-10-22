import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

type LintReport = {
  diagnostics: { code: string; message: string }[];
  number_of_files: number;
};

function lintFixture(source: string) {
  const directory = mkdtempSync(join(tmpdir(), "portfolio-lint-"));
  try {
    const file = join(directory, "fixture.tsx");
    writeFileSync(file, source);
    const result = spawnSync(
      process.execPath,
      [
        join(root, "node_modules/oxlint/bin/oxlint"),
        "--config",
        join(root, ".oxlintrc.json"),
        "--format=json",
        file,
      ],
      { cwd: root, encoding: "utf8", timeout: 15_000 },
    );
    assert.ifError(result.error);
    const report = JSON.parse(result.stdout) as LintReport;
    assert.equal(
      report.number_of_files,
      1,
      "The fixture must actually be linted",
    );
    return { status: result.status, report };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("Lint catches hooks, missing keys, Next images, accessibility and explicit any", () => {
  const { status, report } = lintFixture(`
    import { useEffect, useState } from "react";
    export function Invalid({ value }: { value: any }) {
      if (value) useState(0);
      useEffect(() => { console.log(value); }, []);
      return <>
        <img src="/test.png" />
        <div onClick={() => console.log(value)}>Click</div>
        <ul>{[1, 2].map(item => <li>{item}</li>)}</ul>
      </>;
    }
  `);
  assert.equal(status, 1);
  const codes = new Set(report.diagnostics.map(({ code }) => code));
  for (const code of [
    "react-hooks(rules-of-hooks)",
    "react-hooks(exhaustive-deps)",
    "react(jsx-key)",
    "next(no-img-element)",
    "jsx-a11y(alt-text)",
    "jsx-a11y(click-events-have-key-events)",
    "typescript(no-explicit-any)",
  ]) {
    assert.ok(
      codes.has(code),
      `Expected ${code}; received ${[...codes].join(", ")}`,
    );
  }
});

test("Lint accepts the automatic JSX runtime, CSS imports and labelled control groups", () => {
  const { status, report } = lintFixture(`
    import { useEffect } from "react";
    import "./styles.css";
    export function Valid({ value }: { value: string }) {
      useEffect(() => { console.log(value); }, [value]);
      return <div role="group" aria-label="Controls">
        <button type="button" onClick={() => console.log(value)}>{value}</button>
      </div>;
    }
  `);
  assert.equal(status, 0, JSON.stringify(report.diagnostics));
  assert.deepEqual(report.diagnostics, []);
});

test("CI runs in phases, on main only, with Vercel scoped to the same branch", () => {
  const workflow = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");

  assert.match(workflow, /branches:\s*\[main\]/, "Only main triggers CI");
  assert.doesNotMatch(workflow, /arena\//, "Working branches cost no minutes");

  const jobs = ["quality", "test", "build", "e2e", "deploy"];
  for (const job of jobs) {
    assert.match(workflow, new RegExp(`^ {2}${job}:`, "m"), `${job} exists`);
  }
  assert.match(workflow, /needs: quality/, "Later phases wait for the cheap ones");
  assert.match(workflow, /needs: build/, "Browsers run against the built output");

  const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8")) as {
    git: { deploymentEnabled: Record<string, boolean> };
    installCommand: string;
  };
  assert.deepEqual(vercel.git.deploymentEnabled, { main: true });
  assert.match(vercel.installCommand, /npm ci/);
});

test("Every route has a fallback that still looks like the portfolio", () => {
  for (const route of ["error", "global-error", "not-found"]) {
    const source = readFileSync(join(root, `app/${route}.tsx`), "utf8");
    assert.match(source, /status-page|style=/, `${route} renders a real page`);
    assert.match(source, /\/#contact/, `${route} points at the form`);
  }
});
