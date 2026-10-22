import {
  CONTACT_MAX_BODY_BYTES,
  looksAutomated,
  validateContact,
} from "@/lib/contact";
import { isCrossOrigin, isJsonRequest } from "@/lib/contact-http";
import { deliverContact } from "@/lib/contact-delivery";
import { verifyEmailAddress } from "@/lib/contact-verify";

const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 5;
const recent = new Map<string, number[]>();

const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });

/**
 * A small fixed window per client. One serverless instance is enough to stop a
 * script; the real ceiling for a distributed flood is the provider's edge.
 */
function rateLimited(key: string, now: number): boolean {
  const hits = (recent.get(key) ?? []).filter((at) => now - at < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) {
    recent.set(key, hits);
    return true;
  }
  hits.push(now);
  recent.set(key, hits);

  // A long-lived instance needs a ceiling on its own map.
  if (recent.size > 500) {
    for (const [entry, times] of recent) {
      if (!times.some((at) => now - at < WINDOW_MS)) recent.delete(entry);
    }
  }
  return false;
}

export async function POST(request: Request): Promise<Response> {
  if (isCrossOrigin(request)) {
    return json({ ok: false, error: "origin" }, 403);
  }

  // JSON only: it forces a CORS preflight, which this route never answers.
  if (!isJsonRequest(request)) {
    return json({ ok: false, error: "invalid" }, 415);
  }

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

  // A ghost address costs the visitor an answer nobody can deliver: check the
  // domain exists (free) and, when configured, that the mailbox does too.
  const verdict = await verifyEmailAddress(parsed.value.email, {
    key: process.env.EMAIL_VERIFIER_KEY,
    provider: process.env.EMAIL_VERIFIER_PROVIDER,
  });
  if (!verdict.ok) {
    return json(
      {
        ok: false,
        error: "validation",
        fields: { email: verdict.reason },
        ...(verdict.reason === "typo" && verdict.suggestion
          ? { suggestion: verdict.suggestion }
          : {}),
      },
      422,
    );
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
  } catch (error) {
    // Provider errors (a 403 from Resend, a dead webhook) belong in the logs,
    // never in the page: the visitor gets one honest sentence.
    console.error("[contact] delivery failed", error);
    return json({ ok: false, error: "delivery" }, 502);
  }
}
