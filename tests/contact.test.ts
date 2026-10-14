import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ContactForm } from "../components/ui/ContactForm";
import { LanguageProvider } from "../context/LanguageContext";
import {
  contactPayload,
  getContactEndpoint,
  isContactAccepted,
  isValidContactMessage,
} from "../lib/contact";

const message = {
  name: "Visitor",
  email: "visitor@example.org",
  message: "A project I'd like to discuss.",
  website: "",
};

test("Only opaque public FormSubmit identifiers become endpoints", () => {
  for (const id of [
    undefined,
    "",
    "visitor@example.org",
    "https://example.org",
    "../redirect",
    "short",
    "a".repeat(129),
  ]) {
    assert.equal(getContactEndpoint(id), null);
  }
  assert.equal(
    getContactEndpoint(" e2e-contact-fixture-only "),
    "https://formsubmit.co/ajax/e2e-contact-fixture-only",
  );
});

test("Contact validation rejects whitespace, malformed email, oversized fields and honeypots", () => {
  assert.ok(isValidContactMessage(message));
  for (const invalid of [
    { name: " " },
    { name: "a".repeat(101) },
    { name: "a\nb" },
    { email: "invalid" },
    { email: "a@b" },
    { email: "a\nb@example.org" },
    { email: `${"a".repeat(255)}@example.org` },
    { message: "short" },
    { message: " ".repeat(20) },
    { message: "a".repeat(5001) },
    { website: "bot" },
  ])
    assert.equal(isValidContactMessage({ ...message, ...invalid }), false);
});

test("Payload contains only sender fields and fixed provider options", () => {
  assert.deepEqual(contactPayload(message), {
    name: message.name,
    email: message.email,
    message: message.message,
    _honey: "",
    _subject: "Portfolio — new contact message",
    _template: "table",
  });
});

test("Acceptance requires an explicit successful provider response", () => {
  assert.ok(isContactAccepted({ success: true }));
  assert.ok(isContactAccepted({ success: "true" }));
  for (const response of [
    null,
    {},
    "ok",
    { success: false },
    { success: "false" },
    { success: 1 },
    { message: "Activate your form" },
  ])
    assert.equal(isContactAccepted(response), false);
});

test("An unconfigured form is explicitly disabled; a configured form has an opaque native fallback", () => {
  const render = (formId: string) =>
    renderToStaticMarkup(
      createElement(
        LanguageProvider,
        null,
        createElement(ContactForm, { formId }),
      ),
    );
  const missing = render("");
  assert.match(missing, /type="submit"[^>]*disabled/);
  assert.match(missing, /temporariamente indisponível/);
  const configured = render("e2e-contact-fixture-only");
  assert.match(
    configured,
    /action="https:\/\/formsubmit.co\/e2e-contact-fixture-only"/,
  );
  assert.doesNotMatch(configured, /type="submit"[^>]*disabled/);
  assert.doesNotMatch(configured, /mailto:|proton\.me/);
});
