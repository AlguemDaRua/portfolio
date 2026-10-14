"use client";

import { useEffect, useRef, useState, type ElementType } from "react";

const GLYPHS = "0101アイウエオカキクケコサシスセソ$#%&*+-/<>_XYZ987654321";

interface ScrambleTextProps {
  text: string;
  className?: string;
  as?: ElementType;
  speed?: number;
  duration?: number;
}

export function ScrambleText({
  text,
  className = "",
  as: Component = "span",
  speed = 28,
  duration = 400,
}: ScrambleTextProps) {
  const [display, setDisplay] = useState({ source: text, value: text });
  const previousText = useRef(text);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame: number | null = null;
    const changed = previousText.current !== text;
    previousText.current = text;
    const start = performance.now();
    let lastUpdate = -Infinity;

    const tick = (now: number) => {
      const progress =
        duration <= 0 ? 1 : Math.min(1, (now - start) / duration);
      if (now - lastUpdate >= speed || progress === 1) {
        lastUpdate = now;
        const revealed = Math.floor(progress * text.length);
        const value = Array.from(text, (letter, index) =>
          index < revealed || /\s/.test(letter)
            ? letter
            : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
        ).join("");
        setDisplay({ source: text, value: progress === 1 ? text : value });
      }
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    const onMotionChange = () => {
      if (!motion.matches) return;
      if (frame !== null) cancelAnimationFrame(frame);
      setDisplay({ source: text, value: text });
    };

    if (changed && !motion.matches) frame = requestAnimationFrame(tick);
    motion.addEventListener("change", onMotionChange);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      motion.removeEventListener("change", onMotionChange);
    };
  }, [text, speed, duration]);

  const scrambling = display.source === text && display.value !== text;

  return (
    <Component
      className={`scramble-text ${className}`.trim()}
      data-scrambling={scrambling ? "true" : undefined}
    >
      <span className="scramble-target">{text}</span>
      {scrambling && (
        <span className="scramble-glyphs" aria-hidden="true">
          {display.value}
        </span>
      )}
    </Component>
  );
}
