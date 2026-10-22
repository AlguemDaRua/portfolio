import test from "node:test";
import assert from "node:assert/strict";
import {
  CONTACT_HONEYPOT,
  CONTACT_MIN_FILL_MS,
  formatContactText,
  looksAutomated,
  validateContact,
} from "../lib/contact";
import { DeliveryError, deliverContact } from "../lib/contact-delivery";

const valid = {
  name: "  Azam Usman ",
  email: " hello@example.com ",
  subject: "project",
  message: "  I would like to talk about a new product I am building.  ",
};

test("A complete message passes and comes back trimmed", () => {
  const result = validateContact(valid);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value, {
    name: "Azam Usman",
    email: "hello@example.com",
    subject: "project",
    message: "I would like to talk about a new product I am building.",
  });
});

test("Every empty field is named, not just 'invalid form'", () => {
  const result = validateContact({});
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.deepEqual(result.errors, {
    name: "required",
    email: "required",
    subject: "required",
    message: "required",
  });
});

test("The shape of each field is checked on its own", () => {
  const cases: Array<[Record<string, string>, string]> = [
    [{ email: "not-an-email" }, "email"],
    [{ email: "a@b" }, "email"],
    [{ email: "a b@example.com" }, "email"],
    [{ name: "A" }, "short"],
    [{ message: "too short" }, "short"],
    [{ name: "x".repeat(81) }, "long"],
    [{ message: "x".repeat(2001) }, "long"],
    [{ subject: "budget" }, "required"],
  ];

  for (const [patch, code] of cases) {
    const result = validateContact({ ...valid, ...patch });
    assert.equal(result.ok, false, `Should reject ${JSON.stringify(patch)}`);
    if (result.ok) continue;
    assert.ok(
      Object.values(result.errors).includes(code as never),
      `Expected ${code} for ${JSON.stringify(patch)}, got ${JSON.stringify(result.errors)}`,
    );
  }
});

test("Bots are detected by the honeypot or by impossible speed", () => {
  assert.equal(looksAutomated({ ...valid, elapsed: 9000 }), false);
  assert.equal(
    looksAutomated({ ...valid, elapsed: 9000, [CONTACT_HONEYPOT]: "Acme" }),
    true,
  );
  assert.equal(looksAutomated({ ...valid, elapsed: CONTACT_MIN_FILL_MS - 1 }), true);
  assert.equal(looksAutomated({ ...valid }), true, "No timer at all is a bot");
});

test("The plain-text body carries every field, ready for any inbox", () => {
  const body = formatContactText({
    name: "Azam",
    email: "hello@example.com",
    subject: "role",
    message: "Line one.\nLine two.",
  });
  assert.match(body, /Name:\s+Azam/);
  assert.match(body, /Email:\s+hello@example\.com/);
  assert.match(body, /Subject:\s+Role \/ collaboration/);
  assert.match(body, /Line one\.\nLine two\./);
});

test("No provider configured means no silent drop", async () => {
  let called = false;
  const result = await deliverContact(valid as never, {}, (async () => {
    called = true;
    return new Response("{}");
  }) as unknown as typeof fetch);
  assert.equal(result, "unconfigured");
  assert.equal(called, false);
});

test("A webhook receives the message as JSON", async () => {
  const seen: Array<{ url: string; body: string }> = [];
  const result = await deliverContact(
    {
      name: "Azam",
      email: "hello@example.com",
      subject: "other",
      message: "Hello there, this is a message.",
    },
    { webhook: "https://hooks.example.test/incoming" },
    (async (url: string, init: RequestInit) => {
      seen.push({ url, body: String(init.body) });
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch,
  );

  assert.equal(result, "webhook");
  assert.equal(seen[0].url, "https://hooks.example.test/incoming");
  const payload = JSON.parse(seen[0].body);
  assert.equal(payload.email, "hello@example.com");
  assert.match(payload.text, /Hello there/);
});

test("Resend gets the key, the reply address and the text", async () => {
  let captured: RequestInit | undefined;
  const result = await deliverContact(
    {
      name: "Azam",
      email: "hello@example.com",
      subject: "project",
      message: "Hello there, this is a message.",
    },
    { resendKey: "re_test", to: "owner@example.com", from: "Site <site@example.com>" },
    (async (_url: string, init: RequestInit) => {
      captured = init;
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch,
  );

  assert.equal(result, "resend");
  const headers = captured?.headers as Record<string, string>;
  assert.equal(headers.Authorization, "Bearer re_test");
  const payload = JSON.parse(String(captured?.body));
  assert.deepEqual(payload.to, ["owner@example.com"]);
  assert.equal(payload.from, "Site <site@example.com>");
  assert.equal(payload.reply_to, "hello@example.com");
  assert.match(payload.subject, /Project/);
});

test("A provider that answers with an error is a delivery failure", async () => {
  await assert.rejects(
    deliverContact(
      {
        name: "Azam",
        email: "hello@example.com",
        subject: "role",
        message: "Hello there, this is a message.",
      },
      { resendKey: "re_test", to: "owner@example.com" },
      (async () => new Response("nope", { status: 500 })) as unknown as typeof fetch,
    ),
    DeliveryError,
  );
});
