"use client";

import React, { useEffect, useRef, useState, ElementType } from "react";

const MATRIX_GLYPHS = "0101アイウエオカキクケコサシスセソ$#@%&*+-/<>_XYZ987654321";

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
  const [displayText, setDisplayText] = useState(text);
  const prevTextRef = useRef(text);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (prevTextRef.current === text) return;

    prevTextRef.current = text;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const totalSteps = Math.max(10, Math.floor(duration / speed));
    let currentStep = 0;

    intervalRef.current = setInterval(() => {
      currentStep++;
      const progress = currentStep / totalSteps;
      const targetLength = text.length;
      const revealedCount = Math.floor(progress * targetLength);

      let result = "";
      for (let i = 0; i < targetLength; i++) {
        const targetChar = text[i];
        if (i < revealedCount) {
          result += targetChar;
        } else if (targetChar === " " || targetChar === "\n" || targetChar === "\t") {
          result += targetChar;
        } else {
          const randomIndex = Math.floor(Math.random() * MATRIX_GLYPHS.length);
          result += MATRIX_GLYPHS[randomIndex];
        }
      }

      setDisplayText(result);

      if (currentStep >= totalSteps) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayText(text);
      }
    }, speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, speed, duration]);

  return <Component className={className}>{displayText}</Component>;
}
