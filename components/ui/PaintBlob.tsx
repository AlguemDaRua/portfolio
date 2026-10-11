import React from "react";
import { PAINT_BLOB_PATHS } from "@/lib/theme-paint";

interface PaintBlobProps {
  className?: string;
  style?: React.CSSProperties;
  variant?: number;
}

export function PaintBlob({ className, style, variant = 0 }: PaintBlobProps) {
  const pathIndex = variant % PAINT_BLOB_PATHS.length;

  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 300 300"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PAINT_BLOB_PATHS[pathIndex]} />
      <path d="M76 87 C58 67 52 51 60 40 C74 50 76 67 89 78Z" />
      <path d="M207 54 C224 35 239 27 249 33 C243 48 225 53 215 66Z" />
      <path d="M109 234 C100 255 95 276 108 287 C122 293 128 271 131 246Z" />
      <path d="M218 210 C241 215 260 226 262 239 C246 242 234 228 213 226Z" />
      <circle cx="30" cy="133" r="10" />
      <circle cx="276" cy="89" r="8" />
      <circle cx="54" cy="256" r="7" />
      <ellipse
        cx="273"
        cy="250"
        rx="7"
        ry="15"
        transform="rotate(35 273 250)"
      />
      {variant % 2 === 0 ? (
        <circle cx="178" cy="279" r="6" />
      ) : (
        <ellipse
          cx="33"
          cy="70"
          rx="6"
          ry="12"
          transform="rotate(-38 33 70)"
        />
      )}
    </svg>
  );
}
