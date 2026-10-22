"use client";

import { useEffect, useLayoutEffect, useRef, type ElementType } from "react";
import { scrambleText } from "@/lib/scramble";

/** Layout effect on the client so the reveal starts before the first paint. */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

interface ScrambleTextProps {
  /** The copy for the active language. Changing it replays the reveal. */
  text: string;
  as?: ElementType;
  className?: string;
  id?: string;
}

/**
 * Text that re-enters letter by letter whenever the language changes. It keeps
 * a single text node — no hidden duplicate — so selecting or copying the page
 * always yields the copy exactly once.
 */
export function ScrambleText({
  text,
  as: Component = "span",
  className,
  id,
}: ScrambleTextProps) {
  const animated = useRef<HTMLSpanElement>(null);
  const previous = useRef(text);

  useIsomorphicLayoutEffect(() => {
    const element = animated.current;
    if (!element || previous.current === text) return;

    previous.current = text;
    return scrambleText(element, text);
  }, [text]);

  return (
    <Component className={className} id={id}>
      <span ref={animated}>{text}</span>
    </Component>
  );
}
