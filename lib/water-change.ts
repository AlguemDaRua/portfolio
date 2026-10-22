"use client";

import { createPageSnapshot, type PageSnapshot } from "@/lib/water-snapshot";
import {
  createWaterPalette,
  createWaterReveal,
  createWaterTransition,
  type ThemeMode,
  type WaterReveal,
  WATER_DURATION_MS,
} from "@/lib/theme-water";

export interface WaterChangeOptions {
  /** Commit the new state synchronously, usually inside `flushSync`. */
  apply: () => void;
  /** Theme the page is showing now. */
  departing: ThemeMode;
  /** Theme the page is arriving at (the same one for a language switch). */
  arriving: ThemeMode;
  /** Runs exactly once when the water ends, is interrupted, or is skipped. */
  onSettle?: () => void;
}

let activeCleanup: (() => void) | null = null;

export function supportsWaterClip(): boolean {
  if (typeof CSS === "undefined" || typeof CSS.supports !== "function")
    return false;

  return (
    CSS.supports("clip-path", "circle(1px at 0 0)") ||
    CSS.supports("-webkit-clip-path", "circle(1px at 0 0)")
  );
}

/** Reads the theme the document is showing right now. */
export function documentTheme(): ThemeMode {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

/** Stops the running change, if any, and releases everything it owns. */
export function cancelWaterChange(): void {
  activeCleanup?.();
}

/**
 * Runs one water change: freeze a copy of the page as it is, commit the new
 * state underneath it, and let the ripples reveal it from the centre. Only one
 * change runs at a time; a new one settles the previous immediately.
 */
export function runWaterChange({
  apply,
  departing,
  arriving,
  onSettle,
}: WaterChangeOptions): { animated: boolean } {
  cancelWaterChange();

  const root = document.documentElement;
  const page = document.querySelector<HTMLElement>(".site-shell");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let settled = false;
  const settle = () => {
    if (settled) return;
    settled = true;
    onSettle?.();
  };

  if (motion.matches || document.hidden || !page || !supportsWaterClip()) {
    apply();
    settle();
    return { animated: false };
  }

  let snapshot: PageSnapshot | null = null;
  let reveal: WaterReveal | null = null;
  let frameCleanup: (() => void) | null = null;

  const cleanup = () => {
    frameCleanup?.();
    frameCleanup = null;
    reveal?.dispose();
    reveal = null;
    snapshot?.dispose();
    snapshot = null;
    page.style.removeProperty("z-index");
    root.classList.remove("water-transitioning");
    if (activeCleanup === finish) activeCleanup = null;
    settle();
  };
  const finish = () => {
    if (settled) return;
    cleanup();
  };
  activeCleanup = finish;

  root.classList.add("water-transitioning");

  try {
    snapshot = createPageSnapshot(page);
    // The live page is clipped away until the first ripple frame, so the copy
    // is already in place when the new state is committed.
    reveal = createWaterReveal(
      createWaterTransition(
        arriving,
        root.clientWidth,
        root.clientHeight,
        Math.random,
        createWaterPalette(departing, arriving),
      ),
      page,
    );
    page.style.zIndex = "1";
  } catch {
    root.classList.remove("water-transitioning");
    activeCleanup = null;
    reveal?.dispose();
    snapshot?.dispose();
    apply();
    settle();
    return { animated: false };
  }

  try {
    apply();
  } catch {
    finish();
    return { animated: false };
  }

  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const onScroll = () => {
    // A pending scroll event from focusing/clicking the control can arrive
    // after setup. Only invalidate the copy if its coordinates changed.
    if (window.scrollX !== scrollX || window.scrollY !== scrollY) finish();
  };
  const onVisibilityChange = () => {
    if (document.hidden) finish();
  };
  const onMotionChange = () => {
    if (motion.matches) finish();
  };
  const watchdog = window.setTimeout(finish, WATER_DURATION_MS + 2_000);

  window.addEventListener("resize", finish);
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);
  motion.addEventListener("change", onMotionChange);

  frameCleanup = () => {
    window.clearTimeout(watchdog);
    window.removeEventListener("resize", finish);
    window.removeEventListener("scroll", onScroll);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    motion.removeEventListener("change", onMotionChange);
  };

  try {
    reveal.play(finish);
  } catch {
    finish();
    return { animated: false };
  }

  return { animated: !settled };
}
