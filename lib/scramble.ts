/**
 * Letter-by-letter reveal used when the copy changes language.
 *
 * One shared animation frame drives every affected word on the page, and each
 * element writes its own text content directly — no React re-render per frame.
 * The animation only ever swaps characters for other characters, so the copy
 * keeps its exact length and nothing on the page moves while it plays.
 */

const UPPER_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const LOWER_GLYPHS = "abcdefghijklmnopqrstuvwxyz0123456789";

/** How often the unrevealed letters are re-rolled. */
const GLYPH_MS = 26;

/** Short labels settle quickly; a paragraph takes its time. */
const MIN_DURATION_MS = 280;
const MAX_DURATION_MS = 620;
const MS_PER_LETTER = 7;

/** A tiny cascade so the page reads top to bottom instead of all at once. */
const STAGGER_MS = 12;
const STAGGER_LIMIT = 8;
const BATCH_WINDOW_MS = 40;

/** Anything that is not a letter or a digit is kept, so spacing never jumps. */
const KEEPS_LAYOUT = /[^\p{L}\p{N}]/u;

interface Run {
  element: HTMLElement;
  target: string;
  letters: string[];
  start: number;
  duration: number;
  paintedAt: number;
}

const runs = new Map<HTMLElement, Run>();
let frame: number | null = null;
let batchStart = -Infinity;
let batchIndex = 0;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

/** Keeps the case of the letter it replaces, so line widths barely change. */
function randomGlyph(letter: string): string {
  const glyphs = letter === letter.toLowerCase() ? LOWER_GLYPHS : UPPER_GLYPHS;
  return glyphs[Math.floor(Math.random() * glyphs.length)];
}

function paint(run: Run, progress: number): void {
  if (progress >= 1) {
    run.element.textContent = run.target;
    return;
  }

  const revealed = Math.floor(progress * run.letters.length);
  let value = "";

  for (let index = 0; index < run.letters.length; index += 1) {
    const letter = run.letters[index];
    value +=
      index < revealed || KEEPS_LAYOUT.test(letter)
        ? letter
        : randomGlyph(letter);
  }

  run.element.textContent = value;
}

function step(now: number): void {
  frame = null;
  let pending = false;

  for (const [element, run] of runs) {
    // A section that unmounted mid-reveal simply stops animating.
    if (!element.isConnected) {
      runs.delete(element);
      continue;
    }

    const progress = Math.min(1, (now - run.start) / run.duration);

    if (progress >= 1) {
      paint(run, 1);
      runs.delete(element);
      continue;
    }

    if (now - run.paintedAt >= GLYPH_MS) {
      run.paintedAt = now;
      paint(run, progress);
    }

    pending = true;
  }

  if (pending) frame = window.requestAnimationFrame(step);
}

function wake(): void {
  if (frame !== null) return;
  frame = window.requestAnimationFrame(step);
}

/**
 * Reveals `text` inside `element`, letter by letter. Returns a disposer that
 * settles the element on its final copy — used when a second change lands
 * before the first reveal finished.
 */
export function scrambleText(element: HTMLElement, text: string): () => void {
  // Nothing to animate when motion is off: settle on the copy immediately.
  if (prefersReducedMotion()) {
    element.textContent = text;
    return () => {
      element.textContent = text;
    };
  }

  const now = performance.now();

  if (now - batchStart > BATCH_WINDOW_MS) {
    batchStart = now;
    batchIndex = 0;
  }

  const delay = Math.min(batchIndex, STAGGER_LIMIT) * STAGGER_MS;
  batchIndex += 1;

  const run: Run = {
    element,
    target: text,
    letters: Array.from(text),
    start: now + delay,
    duration: Math.min(
      MAX_DURATION_MS,
      Math.max(MIN_DURATION_MS, text.length * MS_PER_LETTER + MIN_DURATION_MS),
    ),
    paintedAt: now,
  };

  runs.set(element, run);
  // Paint once now, before the browser shows the committed copy, so the words
  // never flash their final state before the reveal begins.
  paint(run, 0);

  wake();

  return () => {
    runs.delete(element);
    element.textContent = text;
  };
}
