"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { PaintBlob } from "./PaintBlob";

export function ThemePaintOverlay() {
  const { paintTarget } = useTheme();

  if (!paintTarget) return null;

  return (
    <div
      className={`theme-paint paint-to-${paintTarget.theme}`}
      aria-hidden="true"
    >
      <PaintBlob
        className="paint-sheet"
        variant={paintTarget.sheet.variant}
        style={
          {
            left: `${paintTarget.sheet.x}%`,
            top: `${paintTarget.sheet.y}%`,
            width: `${paintTarget.sheet.size}vmax`,
            height: `${paintTarget.sheet.size}vmax`,
            "--paint-turn": `${paintTarget.sheet.turn}deg`,
            "--sheet-delay": `${paintTarget.sheet.delay}ms`,
            "--sheet-grow": paintTarget.sheet.grow,
          } as React.CSSProperties
        }
      />

      {paintTarget.splashes.map((splash, index) => (
        <PaintBlob
          key={index}
          className="paint-splash"
          variant={splash.variant}
          style={
            {
              left: `${splash.x}%`,
              top: `${splash.y}%`,
              width: `${splash.size}vmax`,
              height: `${splash.size}vmax`,
              "--paint-turn": `${splash.turn}deg`,
              "--paint-grow": splash.grow,
              "--paint-delay": `${splash.delay}ms`,
              "--paint-duration": `${splash.duration}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
