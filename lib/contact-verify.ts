/**
 * Is the address the visitor typed a real one? Two layers, both free:
 *
 *   1. DNS (always, no account): the domain must accept mail — an MX record,
 *      or the A/AAAA fallback RFC 5321 still allows.
 *   2. Mailbox probe (optional): only when a free verifier key is configured,
 *      because proving that a *specific* mailbox exists means talking SMTP to
 *      the provider, which a serverless function cannot do on port 25.
 *
 * Anything the network cannot answer stays "unknown" and is let through: a
 * DNS hiccup must never cost a real person their message.
 *
 * This module talks to the network, so it is server-only — the form never
 * imports it.
 */

const KNOWN_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "hotmail.co.uk",
  "outlook.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "yahoo.co.uk",
  "icloud.com",
  "me.com",
  "proton.me",
  "protonmail.com",
  "gmx.com",
  "gmx.net",
  "mail.com",
  "zoho.com",
  "yandex.com",
  "aol.com",
  "sapo.pt",
  "sapo.mz",
  "uol.com.br",
  "bol.com.br",
  "terra.com.br",
] as const;

/** Levenshtein distance, abandoned as soon as it cannot beat `limit`. */
function editDistance(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    let cheapest = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(
        previous[j] + 1,
        row[j - 1] + 1,
        previous[j - 1] + cost,
      );
      row.push(value);
      if (value < cheapest) cheapest = value;
    }
    if (cheapest > limit) return limit + 1;
    previous = row;
  }
  return previous[b.length];
}

/**
 * "gmial.com" → "you@gmail.com". Only ever called for a domain that cannot
 * receive mail, so a real-but-unusual provider is never second-guessed.
 */
export function suggestEmailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 1) return null;

  const local = email.slice(0, at);
  const domain = email.slice(at + 1).toLowerCase();
  if (!domain) return null;
  if ((KNOWN_DOMAINS as readonly string[]).includes(domain)) return null;

  let best: string | null = null;
  let bestDistance = 3;
  for (const candidate of KNOWN_DOMAINS) {
    const distance = editDistance(domain, candidate, 2);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best ? `${local}@${best}` : null;
}

type DnsRecord = { type: number; data: string };

/** Two public resolvers: if one is unreachable from the host, the other answers. */
const DNS_ENDPOINTS = [
  "https://cloudflare-dns.com/dns-query",
  "https://dns.google/resolve",
] as const;

type Lookup = {
  /** NXDOMAIN is answered once: the domain itself does not exist. */
  state: "ok" | "nxdomain" | "unknown";
  records: string[];
};

/**
 * DNS-over-HTTPS, so no resolver dependency and no port 25. "unknown" means
 * "no idea" — the caller must then let the address through.
 */
async function queryResolver(
  endpoint: string,
  domain: string,
  type: "MX" | "A",
  doFetch: typeof fetch,
  timeoutMs: number,
): Promise<Lookup> {
  try {
    const url = `${endpoint}?name=${encodeURIComponent(domain)}&type=${type}`;
    const response = await doFetch(url, {
      headers: { accept: "application/dns-json" },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (!response.ok) return { state: "unknown", records: [] };

    const data = (await response.json()) as {
      Status?: number;
      Answer?: DnsRecord[];
    };
    if (data.Status === 3) return { state: "nxdomain", records: [] };
    if (data.Status !== 0) return { state: "unknown", records: [] };

    const wanted = type === "MX" ? 15 : 1;
    return {
      state: "ok",
      records: (data.Answer ?? [])
        .filter((record) => record.type === wanted)
        .map((record) => record.data),
    };
  } catch {
    return { state: "unknown", records: [] };
  }
}

async function dnsLookup(
  domain: string,
  type: "MX" | "A",
  doFetch: typeof fetch,
  timeoutMs: number,
): Promise<Lookup> {
  let result: Lookup = { state: "unknown", records: [] };
  for (const endpoint of DNS_ENDPOINTS) {
    result = await queryResolver(endpoint, domain, type, doFetch, timeoutMs);
    if (result.state !== "unknown") return result;
  }
  return result;
}

export async function domainAcceptsMail(
  domain: string,
  doFetch: typeof fetch = fetch,
  timeoutMs = 2_000,
): Promise<boolean | null> {
  const mail = await dnsLookup(domain, "MX", doFetch, timeoutMs);
  if (mail.state === "nxdomain") return false;
  if (mail.state === "unknown") return null;
  if (mail.records.length > 0) return true;

  // No MX is legal: mail then goes to the host itself (RFC 5321 §5.1).
  const host = await dnsLookup(domain, "A", doFetch, timeoutMs);
  if (host.state === "unknown") return null;
  if (host.state === "nxdomain") return false;
  return host.records.length > 0;
}

type MailboxState = "deliverable" | "undeliverable" | "unknown";
type Probe = { state: MailboxState; suggestion: string | null };

const PROVIDERS = {
  abstract: (email: string, key: string) =>
    `https://emailvalidation.abstractapi.com/v1/?api_key=${encodeURIComponent(
      key,
    )}&email=${encodeURIComponent(email)}`,
  quickemailverification: (email: string, key: string) =>
    `https://api.quickemailverification.com/v1/verify?email=${encodeURIComponent(
      email,
    )}&apikey=${encodeURIComponent(key)}`,
  mailboxlayer: (email: string, key: string) =>
    `https://apilayer.net/api/check?access_key=${encodeURIComponent(
      key,
    )}&email=${encodeURIComponent(email)}&format=1`,
} as const;

export type VerifierName = keyof typeof PROVIDERS;

const isVerifier = (value: string): value is VerifierName =>
  Object.hasOwn(PROVIDERS, value);

function readState(name: VerifierName, data: Record<string, unknown>) {
  const text = (value: unknown) => (typeof value === "string" ? value : null);
  const flag = (value: unknown) => value === true;

  switch (name) {
    case "quickemailverification":
      return {
        state:
          data.result === "valid"
            ? ("deliverable" as const)
            : data.result === "invalid"
              ? ("undeliverable" as const)
              : ("unknown" as const),
        suggestion: text(data.did_you_mean),
      };
    case "mailboxlayer":
      return {
        state:
          data.format_valid === false || data.mx_found === false
            ? ("undeliverable" as const)
            : flag(data.smtp_check)
              ? ("deliverable" as const)
              : ("unknown" as const),
        suggestion: text(data.did_you_mean),
      };
    default:
      return {
        state:
          data.deliverability === "DELIVERABLE"
            ? ("deliverable" as const)
            : data.deliverability === "UNDELIVERABLE"
              ? ("undeliverable" as const)
              : ("unknown" as const),
        suggestion: text(data.autocorrect),
      };
  }
}

/** One HTTP call to a free verifier; a dead API is "no idea", not "invalid". */
async function probeMailbox(
  email: string,
  key: string,
  name: VerifierName,
  doFetch: typeof fetch,
  timeoutMs: number,
): Promise<Probe> {
  const unknown: Probe = { state: "unknown", suggestion: null };
  try {
    const response = await doFetch(PROVIDERS[name](email, key), {
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (!response.ok) return unknown;
    const data = (await response.json()) as Record<string, unknown>;
    const read = readState(name, data);
    return {
      state: read.state,
      suggestion: read.suggestion && read.suggestion.includes("@")
        ? read.suggestion
        : null,
    };
  } catch {
    return unknown;
  }
}

export type EmailVerdict =
  | { ok: true }
  | { ok: false; reason: "typo"; suggestion: string | null }
  | { ok: false; reason: "undeliverable" };

export type VerifyOptions = {
  /** Free verifier key; without it only DNS runs. */
  key?: string;
  provider?: string;
  doFetch?: typeof fetch;
  timeoutMs?: number;
};

/**
 * The order matters: DNS first (free, no quota), then the paid-in-quota probe.
 * A typo is only ever suggested when the domain truly cannot receive mail, so
 * a correct address is never nagged about.
 */
export async function verifyEmailAddress(
  email: string,
  options: VerifyOptions = {},
): Promise<EmailVerdict> {
  const {
    key,
    provider = "abstract",
    doFetch = fetch,
    timeoutMs = 2_000,
  } = options;

  const at = email.lastIndexOf("@");
  const domain = at > 0 ? email.slice(at + 1).toLowerCase() : "";
  if (!domain) return { ok: false, reason: "undeliverable" };

  const reachable = await domainAcceptsMail(domain, doFetch, timeoutMs);
  if (reachable === false) {
    const suggestion = suggestEmailDomain(email);
    return suggestion
      ? { ok: false, reason: "typo", suggestion }
      : { ok: false, reason: "undeliverable" };
  }

  if (key && isVerifier(provider)) {
    const probe = await probeMailbox(email, key, provider, doFetch, timeoutMs);
    if (probe.state === "undeliverable") {
      return probe.suggestion
        ? { ok: false, reason: "typo", suggestion: probe.suggestion }
        : { ok: false, reason: "undeliverable" };
    }
  }

  return { ok: true };
}
