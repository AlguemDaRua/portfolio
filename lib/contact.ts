export const CONTACT_LIMITS = { name: 100, email: 254, message: 5000 } as const;

export interface ContactMessage {
  name: string;
  email: string;
  message: string;
  website: string;
}

// The form keeps the page visually clean; this public delivery address is not
// intended to be secret. Change it here without touching the translated UI.
export const CONTACT_EMAIL = "azamusman67@gmail.com";

export function getContactEndpoint(): string {
  return `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;
}

export function isValidContactMessage(value: ContactMessage): boolean {
  return (
    value.website === "" &&
    value.name.trim().length >= 2 &&
    value.name.length <= CONTACT_LIMITS.name &&
    !/[\r\n]/.test(value.name) &&
    value.email.length <= CONTACT_LIMITS.email &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) &&
    value.message.trim().length >= 10 &&
    value.message.length <= CONTACT_LIMITS.message
  );
}

export function contactPayload(value: ContactMessage) {
  return {
    name: value.name.trim(),
    email: value.email.trim(),
    message: value.message.trim(),
    _honey: value.website,
    _subject: "Portfolio — new contact message",
    _template: "table",
  };
}

export function isContactAccepted(response: unknown): boolean {
  if (!response || typeof response !== "object" || !("success" in response))
    return false;
  // The service documents JSON responses; deployed versions also use strings.
  return response.success === true || response.success === "true";
}
