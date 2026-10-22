/**
 * One definition of the contact contract, shared by the form and the route
 * handler. Validation returns error *codes*; the words live in the dictionary,
 * so a new language never has to touch this file.
 */

export const CONTACT_LIMITS = {
  name: { min: 2, max: 80 },
  email: { max: 254 },
  subject: { min: 2, max: 120 },
  message: { min: 20, max: 2000 },
} as const;

/** Off-screen field no human ever fills; bots fill every input they find. */
export const CONTACT_HONEYPOT = "company";
/** A person cannot read three fields and write 20 characters this quickly. */
export const CONTACT_MIN_FILL_MS = 1_200;
/** Anything larger than this is not a message, it is an attack. */
export const CONTACT_MAX_BODY_BYTES = 8_192;

export type ContactField = "name" | "email" | "subject" | "message";
type ContactErrorCode =
  | "required"
  | "email"
  | "short"
  | "long"
  | "undeliverable"
  | "typo";
export type ContactErrors = Partial<Record<ContactField, ContactErrorCode>>;

export type ContactMessage = {
  name: string;
  email: string;
  /** Whatever the visitor wants to call it; never a list we impose. */
  subject: string;
  message: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const readText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

type ValidationResult =
  | { ok: true; value: ContactMessage }
  | { ok: false; errors: ContactErrors };

export function validateContact(input: unknown): ValidationResult {
  const source = (input ?? {}) as Record<string, unknown>;
  const name = readText(source.name);
  const email = readText(source.email);
  const subject = readText(source.subject);
  const message = readText(source.message);
  const errors: ContactErrors = {};

  if (!name) errors.name = "required";
  else if (name.length < CONTACT_LIMITS.name.min) errors.name = "short";
  else if (name.length > CONTACT_LIMITS.name.max) errors.name = "long";

  if (!email) errors.email = "required";
  else if (
    email.length > CONTACT_LIMITS.email.max ||
    !EMAIL_PATTERN.test(email)
  )
    errors.email = "email";

  if (!subject) errors.subject = "required";
  else if (subject.length < CONTACT_LIMITS.subject.min)
    errors.subject = "short";
  else if (subject.length > CONTACT_LIMITS.subject.max)
    errors.subject = "long";

  if (!message) errors.message = "required";
  else if (message.length < CONTACT_LIMITS.message.min)
    errors.message = "short";
  else if (message.length > CONTACT_LIMITS.message.max)
    errors.message = "long";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: { name, email, subject, message },
  };
}

/**
 * Honeypot filled, or a submission faster than a human can type it: answer
 * politely with a success and deliver nothing. Never teach a bot what failed.
 */
export function looksAutomated(input: unknown): boolean {
  const source = (input ?? {}) as Record<string, unknown>;
  if (readText(source[CONTACT_HONEYPOT]).length > 0) return true;
  const elapsed = Number(source.elapsed);
  return !Number.isFinite(elapsed) || elapsed < CONTACT_MIN_FILL_MS;
}

/** Plain-text body: no HTML, no surprises in whichever inbox receives it. */
export function formatContactText(message: ContactMessage): string {
  return [
    `Name:    ${message.name}`,
    `Email:   ${message.email}`,
    `Subject: ${message.subject}`,
    "",
    message.message,
  ].join("\n");
}
