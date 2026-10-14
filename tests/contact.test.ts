import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ContactForm } from "../components/ui/ContactForm";
import { LanguageProvider } from "../context/LanguageContext";
import {
  CONTACT_EMAIL,
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

test("The contact form sends to the requested Gmail inbox without extra configuration", () => {
  assert.equal(CONTACT_EMAIL, "azamusman67@gmail.com");
  assert.equal(
    getContactEndpoint(),
    "https://formsubmit.co/ajax/azamusman67@gmail.com",
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

test("The form is enabled and targets Gmail without rendering a visible address or mailto link", () => {
  const html = renderToStaticMarkup(
    createElement(LanguageProvider, null, createElement(ContactForm)),
  );
  assert.match(html, /action="https:\/\/formsubmit.co\/azamusman67@gmail.com"/);
  assert.doesNotMatch(html, /type="submit"[^>]*disabled/);
  assert.doesNotMatch(html, /mailto:|proton\.me/);
  assert.ok(!html.replace(/<[^>]*>/g, "").includes(CONTACT_EMAIL));
});
