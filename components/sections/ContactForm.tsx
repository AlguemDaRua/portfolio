"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, Check, LoaderCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  CONTACT_HONEYPOT,
  CONTACT_LIMITS,
  CONTACT_SUBJECTS,
  validateContact,
  type ContactErrors,
  type ContactField,
} from "@/lib/contact";

type Status = "idle" | "sending" | "sent";
type ServerError = "rate" | "unavailable" | "delivery" | "network" | "invalid";

const EMPTY = { name: "", email: "", subject: "", message: "" };

function toServerError(error: unknown): ServerError {
  switch (error) {
    case "rate":
      return "rate";
    case "unconfigured":
      return "unavailable";
    case "delivery":
      return "delivery";
    default:
      return "invalid";
  }
}

export function ContactForm() {
  const { t } = useLanguage();
  const copy = t.contact.form;
  const prefix = useId();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState<ServerError | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const openedAt = useRef(0);
  const sentRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Timed from the mount, not from the render: a bot submits in milliseconds.
  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  // The submit button disappears with the form: put the caret somewhere useful.
  useEffect(() => {
    if (status === "sent") sentRef.current?.focus();
  }, [status]);

  const id = (field: ContactField) => `${prefix}-${field}`;

  const update = (field: ContactField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setSuggestion(null);
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setServerError(null);
  };

  const focusFirst = (fields: ContactErrors) => {
    const order: ContactField[] = ["name", "email", "subject", "message"];
    const first = order.find((field) => fields[field]);
    if (!first) return;
    formRef.current
      ?.querySelector<HTMLElement>(`[name="${first}"]`)
      ?.focus({ preventScroll: false });
  };

  const send = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending") return;

    const parsed = validateContact(values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      setServerError(null);
      focusFirst(parsed.errors);
      return;
    }

    setStatus("sending");
    setErrors({});
    setServerError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...parsed.value,
          [CONTACT_HONEYPOT]: honeypot,
          elapsed: openedAt.current ? Date.now() - openedAt.current : 0,
        }),
      });
      const payload: unknown = await response.json().catch(() => null);
      const result = (payload ?? {}) as {
        ok?: boolean;
        error?: string;
        fields?: ContactErrors;
        suggestion?: string;
      };

      if (response.ok && result.ok) {
        setStatus("sent");
        return;
      }

      setStatus("idle");
      setServerError(toServerError(result.error));
      setSuggestion(
        result.fields?.email === "typo" && result.suggestion
          ? result.suggestion
          : null,
      );
      if (result.fields) {
        setErrors(result.fields);
        focusFirst(result.fields);
      }
    } catch {
      setStatus("idle");
      setServerError("network");
    }
  };

  const restart = () => {
    setValues(EMPTY);
    setErrors({});
    setSuggestion(null);
    setServerError(null);
    setStatus("idle");
    openedAt.current = Date.now();
    setHoneypot("");
  };

  if (status === "sent") {
    return (
      <div
        ref={sentRef}
        className="contact-sent"
        role="status"
        aria-live="polite"
        tabIndex={-1}
      >
        <span className="contact-sent-mark" aria-hidden="true">
          <Check />
        </span>
        <div>
          <p className="contact-sent-title">{copy.successTitle}</p>
          <p className="contact-sent-text">{copy.successText}</p>
        </div>
        <button type="button" className="contact-again" onClick={restart}>
          {copy.again}
        </button>
      </div>
    );
  }

  const fieldError = (field: ContactField) => {
    const code = errors[field];
    return code ? copy.errors[code] : null;
  };

  return (
    <form
      ref={formRef}
      className="contact-form"
      onSubmit={send}
      noValidate
      aria-describedby={serverError ? `${prefix}-form-error` : undefined}
    >
      <div className="contact-field">
        <label className="contact-label" htmlFor={id("name")}>
          {copy.name}
        </label>
        <input
          id={id("name")}
          name="name"
          className="contact-input"
          type="text"
          value={values.name}
          onChange={(event) => update("name", event.target.value)}
          placeholder={copy.namePlaceholder}
          autoComplete="name"
          maxLength={CONTACT_LIMITS.name.max}
          required
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${id("name")}-error` : undefined}
        />
        {errors.name ? (
          <span className="contact-error" id={`${id("name")}-error`}>
            {fieldError("name")}
          </span>
        ) : null}
      </div>

      <div className="contact-field">
        <label className="contact-label" htmlFor={id("email")}>
          {copy.email}
        </label>
        <input
          id={id("email")}
          name="email"
          className="contact-input"
          type="email"
          inputMode="email"
          value={values.email}
          onChange={(event) => update("email", event.target.value)}
          placeholder={copy.emailPlaceholder}
          autoComplete="email"
          maxLength={CONTACT_LIMITS.email.max}
          required
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${id("email")}-error` : undefined}
        />
        {errors.email ? (
          <span className="contact-error" id={`${id("email")}-error`}>
            {errors.email === "typo" && suggestion ? (
              <>
                {copy.errors.typo.split("{suggestion}")[0]}
                <button
                  type="button"
                  className="contact-fix"
                  onClick={() => update("email", suggestion)}
                >
                  {suggestion}
                </button>
                {copy.errors.typo.split("{suggestion}")[1]}
              </>
            ) : (
              fieldError("email")
            )}
          </span>
        ) : null}
      </div>

      <div className="contact-field contact-field-wide">
        <label className="contact-label" htmlFor={id("subject")}>
          {copy.subject}
        </label>
        <select
          id={id("subject")}
          name="subject"
          className="contact-input contact-select"
          value={values.subject}
          onChange={(event) => update("subject", event.target.value)}
          required
          aria-invalid={Boolean(errors.subject)}
          aria-describedby={
            errors.subject ? `${id("subject")}-error` : undefined
          }
        >
          <option value="" disabled>
            {copy.subjectPlaceholder}
          </option>
          {CONTACT_SUBJECTS.map((subject) => (
            <option key={subject} value={subject}>
              {copy.subjects[subject]}
            </option>
          ))}
        </select>
        {errors.subject ? (
          <span className="contact-error" id={`${id("subject")}-error`}>
            {fieldError("subject")}
          </span>
        ) : null}
      </div>

      <div className="contact-field contact-field-wide">
        <label className="contact-label" htmlFor={id("message")}>
          {copy.message}
        </label>
        <textarea
          id={id("message")}
          name="message"
          className="contact-input"
          rows={5}
          value={values.message}
          onChange={(event) => update("message", event.target.value)}
          placeholder={copy.messagePlaceholder}
          autoComplete="off"
          maxLength={CONTACT_LIMITS.message.max}
          required
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? `${id("message")}-error` : undefined}
        />
        {errors.message ? (
          <span className="contact-error" id={`${id("message")}-error`}>
            {fieldError("message")}
          </span>
        ) : null}
      </div>

      {/* Off-screen bait: a person never fills it, a bot fills everything. */}
      <div className="contact-honey" aria-hidden="true">
        <label htmlFor={`${prefix}-company`}>Company</label>
        <input
          id={`${prefix}-company`}
          name={CONTACT_HONEYPOT}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      <div className="contact-form-foot contact-field-wide">
        <button
          type="submit"
          className="contact-submit"
          disabled={status === "sending"}
          aria-busy={status === "sending"}
        >
          {status === "sending" ? (
            <LoaderCircle className="contact-spinner" aria-hidden="true" />
          ) : (
            <ArrowUpRight aria-hidden="true" />
          )}
          {status === "sending" ? copy.sending : copy.submit}
        </button>
        <p className="contact-privacy">{copy.privacy}</p>
      </div>

      <p
        className={serverError ? "contact-error contact-field-wide" : "sr-only"}
        id={`${prefix}-form-error`}
        role={serverError ? "alert" : "status"}
        aria-live="polite"
      >
        {serverError ? copy.errors[serverError] : ""}
      </p>
    </form>
  );
}
