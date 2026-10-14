"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight } from "@/components/ui/Icons";
import { useLanguage } from "@/context/LanguageContext";
import {
  CONTACT_LIMITS,
  contactPayload,
  getContactEndpoint,
  isContactAccepted,
  isValidContactMessage,
} from "@/lib/contact";

type FormState = "idle" | "sending" | "sent" | "error" | "invalid";

export function ContactForm() {
  const { t } = useLanguage();
  const [state, setState] = useState<FormState>("idle");
  const request = useRef<AbortController | null>(null);
  const endpoint = getContactEndpoint();
  const pending = state === "sending";

  useEffect(
    () => () => {
      request.current?.abort();
      request.current = null;
    },
    [],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (request.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const message = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
      website: String(data.get("_honey") ?? ""),
    };
    if (!isValidContactMessage(message)) {
      setState("invalid");
      return;
    }

    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 15_000);
    setState("sending");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "omit",
        body: JSON.stringify(contactPayload(message)),
        signal: controller.signal,
      });
      const result: unknown = await response.json();
      if (!response.ok || !isContactAccepted(result))
        throw new Error("Not accepted");
      if (request.current !== controller) return;
      form.reset();
      setState("sent");
    } catch {
      // Never expose provider messages, log form contents, or erase an unsent draft.
      // A timeout means delivery is unknown, not necessarily that it failed.
      if (request.current === controller) setState("error");
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) request.current = null;
    }
  }

  return (
    <form
      className="contact-form"
      aria-label={t.contact.title}
      aria-describedby="contact-required contact-privacy"
      aria-busy={pending}
      action={endpoint.replace("/ajax/", "/")}
      method="post"
      onSubmit={submit}
      onChange={() =>
        setState((current) => (current === "sent" ? "idle" : current))
      }
    >
      <input
        type="hidden"
        name="_subject"
        value="Portfolio — new contact message"
      />
      <input type="hidden" name="_template" value="table" />
      <p id="contact-required" className="contact-hint">
        {t.contact.required}
      </p>
      <fieldset disabled={pending}>
        <legend className="sr-only">{t.contact.label}</legend>
        <div className="contact-field">
          <label htmlFor="contact-name">{t.contact.nameLabel}</label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            minLength={2}
            maxLength={CONTACT_LIMITS.name}
            placeholder={t.contact.namePlaceholder}
          />
        </div>
        <div className="contact-field">
          <label htmlFor="contact-email">{t.contact.emailLabel}</label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            required
            maxLength={CONTACT_LIMITS.email}
            placeholder={t.contact.emailPlaceholder}
          />
        </div>
        <div className="contact-field">
          <label htmlFor="contact-message">{t.contact.messageLabel}</label>
          <textarea
            id="contact-message"
            name="message"
            rows={5}
            required
            minLength={10}
            maxLength={CONTACT_LIMITS.message}
            placeholder={t.contact.messagePlaceholder}
          />
        </div>
        <div className="contact-trap" aria-hidden="true">
          <label htmlFor="contact-website">Website</label>
          <input
            id="contact-website"
            name="_honey"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
        <button type="submit" className="contact-submit" disabled={pending}>
          <span>{pending ? t.contact.sending : t.contact.send}</span>
          <ArrowUpRight />
        </button>
      </fieldset>
      <p id="contact-privacy" className="contact-privacy">
        {t.contact.privacy}{" "}
        <a
          href="https://formsubmit.co/privacy.pdf"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t.contact.privacyLink} ↗
        </a>
      </p>
      <p
        className="contact-feedback"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {state === "sending"
          ? t.contact.sending
          : state === "sent"
            ? t.contact.sent
            : state === "error"
              ? t.contact.error
              : state === "invalid"
                ? t.contact.invalid
                : ""}
      </p>
      <noscript>
        <p className="contact-feedback">{t.contact.noScript}</p>
      </noscript>
    </form>
  );
}
