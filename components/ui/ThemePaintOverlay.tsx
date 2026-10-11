"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import type { PaintSheet, PaintSplash } from "@/lib/theme-paint";
import { PaintBlob } from "./PaintBlob";

function createSheetStyle(sheet: PaintSheet): React.CSSProperties {
  return {
    left: `${sheet.x}%`,
    top: `${sheet.y}%`,
    width: `${sheet.size}vmax`,
    height: `${sheet.size}vmax`,
    "--paint-turn": `${sheet.turn}deg`,
    "--sheet-delay": `${sheet.delay}ms`,
    "--sheet-duration": `${sheet.duration}ms`,
    "--sheet-grow": sheet.grow,
  } as React.CSSProperties;
}

function createSplashStyle(splash: PaintSplash): React.CSSProperties {
  return {
    left: `${splash.x}%`,
    top: `${splash.y}%`,
    width: `${splash.size}vmax`,
    height: `${splash.size}vmax`,
    "--paint-turn": `${splash.turn}deg`,
    "--paint-grow": splash.grow,
    "--paint-delay": `${splash.delay}ms`,
    "--paint-duration": `${splash.duration}ms`,
  } as React.CSSProperties;
}

export function ThemePaintOverlay() {
  const { paintTarget, paintId } = useTheme();

  if (!paintTarget) return null;

  return (
    <div
      key={paintId}
      className={`theme-paint paint-to-${paintTarget.theme}`}
      aria-hidden="true"
    >
      <PaintBlob
        className="paint-sheet"
        variant={paintTarget.sheet.variant}
        style={createSheetStyle(paintTarget.sheet)}
      />

      {paintTarget.splashes.map((splash, index) => (
        <PaintBlob
          key={`${splash.x}-${splash.y}-${index}`}
          className="paint-splash"
          variant={splash.variant}
          style={createSplashStyle(splash)}
        />
      ))}
    </div>
  );
}
