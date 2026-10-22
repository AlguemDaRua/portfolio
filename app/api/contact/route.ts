import {
  CONTACT_MAX_BODY_BYTES,
  looksAutomated,
  validateContact,
} from "@/lib/contact";
import { deliverContact } from "@/lib/contact-delivery";

const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 5;
const recent = new Map<string, number[]>();

const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });

function rateLimited(key: string, now: number): boolean {
  const hits = (recent.get(key) ?? []).filter((at) => now - at < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) {
    recent.set(key, hits);
    return true;
  }
  hits.push(now);
  recent.set(key, hits);

  // A serverless instance lives long enough to need a ceiling on its map.
  if (recent.size > 500) {
    for (const [entry, times] of recent) {
      if (!times.some((at) => now - at < WINDOW_MS)) recent.delete(entry);
    }
  }
  return false;
}

export async function POST(request: Request): Promise<Response> {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > CONTACT_MAX_BODY_BYTES) {
    return json({ ok: false, error: "invalid" }, 413);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "invalid" }, 400);
  }

  // Shape first: a broken request is answered the same way for everyone.
  const parsed = validateContact(payload);
  if (!parsed.ok) {
    return json({ ok: false, error: "validation", fields: parsed.errors }, 422);
  }

  // A bot hears exactly what a person hears, and nothing is delivered.
  if (looksAutomated(payload)) return json({ ok: true }, 202);

  if (rateLimited(ip, Date.now())) {
    return json({ ok: false, error: "rate" }, 429);
  }

  try {
    const via = await deliverContact(parsed.value, {
      to: process.env.CONTACT_TO,
      resendKey: process.env.RESEND_API_KEY,
      from: process.env.CONTACT_FROM,
      webhook: process.env.CONTACT_WEBHOOK,
    });
    if (via === "unconfigured") {
      return json({ ok: false, error: "unconfigured" }, 503);
    }
    return json({ ok: true, via });
  } catch {
    return json({ ok: false, error: "delivery" }, 502);
  }
}
