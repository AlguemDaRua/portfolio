import {
  CONTACT_SUBJECT_LABELS,
  formatContactText,
  type ContactMessage,
} from "./contact";

/**
 * Delivery is a pure function of the message plus the environment. Nothing is
 * read from the browser, so no address is ever shipped in the client bundle.
 *
 * Two routes, both free:
 *   1. Resend  — RESEND_API_KEY + CONTACT_TO (free tier, 3 000/month).
 *   2. Webhook — CONTACT_WEBHOOK, any endpoint that accepts JSON
 *      (Zapier, Make, Formspree free, a Discord/Slack hook…).
 */
type ContactEnv = {
  to?: string;
  resendKey?: string;
  from?: string;
  webhook?: string;
};

type DeliveryResult = "resend" | "webhook" | "unconfigured";

export class DeliveryError extends Error {}

export async function deliverContact(
  message: ContactMessage,
  env: ContactEnv,
  send: typeof fetch = fetch,
): Promise<DeliveryResult> {
  const text = formatContactText(message);

  if (env.resendKey && env.to) {
    const response = await send("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.from ?? "Portfolio <onboarding@resend.dev>",
        to: [env.to],
        subject: `[Portfolio] ${CONTACT_SUBJECT_LABELS[message.subject]} — ${message.name}`,
        reply_to: message.email,
        text,
      }),
    });
    if (!response.ok) throw new DeliveryError(`resend ${response.status}`);
    return "resend";
  }

  if (env.webhook) {
    const response = await send(env.webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...message, text }),
    });
    if (!response.ok) throw new DeliveryError(`webhook ${response.status}`);
    return "webhook";
  }

  return "unconfigured";
}
