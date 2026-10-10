import React from "react";

export const paintBlobPaths = [
  "M151 17 C173 21 182 44 205 43 C232 40 246 57 252 79 C278 77 288 98 280 120 C302 143 287 168 270 181 C279 205 259 222 236 219 C227 245 206 257 186 244 C166 272 142 276 126 253 C102 267 80 252 80 230 C54 236 39 215 49 193 C24 180 17 155 39 139 C20 115 35 92 60 86 C57 61 81 44 105 54 C119 30 135 12 151 17 Z",
  "M149 13 C174 17 185 36 197 52 C227 35 249 54 246 81 C278 74 293 99 276 125 C305 149 281 172 264 185 C283 212 259 232 233 223 C222 255 197 255 179 240 C159 280 132 267 122 243 C91 267 68 248 79 220 C43 231 29 207 50 181 C14 161 24 133 53 125 C28 96 50 73 77 80 C69 48 101 36 123 55 C127 28 136 10 149 13 Z",
  "M154 20 C176 8 194 34 203 51 C231 36 255 49 250 77 C287 76 292 106 274 127 C297 153 281 177 258 188 C277 217 250 235 226 222 C210 255 187 258 168 237 C146 273 118 259 111 235 C78 254 58 228 75 202 C38 209 24 183 50 159 C18 137 35 111 61 101 C43 68 68 49 98 65 C103 31 128 23 145 50 C146 39 147 28 154 20 Z",
];

interface PaintBlobProps {
  className?: string;
  style?: React.CSSProperties;
  variant?: number;
}

export function PaintBlob({ className, style, variant = 0 }: PaintBlobProps) {
  const currentPath = paintBlobPaths[variant % paintBlobPaths.length];

  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 300 300"
      aria-hidden="true"
      focusable="false"
    >
      <path d={currentPath} />
      <path d="M76 87 C58 67 52 51 60 40 C74 50 76 67 89 78Z" />
      <path d="M207 54 C224 35 239 27 249 33 C243 48 225 53 215 66Z" />
      <path d="M109 234 C100 255 95 276 108 287 C122 293 128 271 131 246Z" />
      <path d="M218 210 C241 215 260 226 262 239 C246 242 234 228 213 226Z" />
      <circle cx="30" cy="133" r="10" />
      <circle cx="276" cy="89" r="8" />
      <circle cx="54" cy="256" r="7" />
      <ellipse cx="273" cy="250" rx="7" ry="15" transform="rotate(35 273 250)" />
      {variant % 2 === 0 ? (
        <circle cx="178" cy="279" r="6" />
      ) : (
        <ellipse cx="33" cy="70" rx="6" ry="12" transform="rotate(-38 33 70)" />
      )}
    </svg>
  );
}
