import assert from "node:assert/strict";
import test from "node:test";
import {
  domainAcceptsMail,
  suggestEmailDomain,
  verifyEmailAddress,
} from "../lib/contact-verify";

type Answer = { Status?: number; Answer?: { type: number; data: string }[] };

/** A fake DNS that answers by record type, and remembers what was asked. */
function fakeDns(answers: Record<string, Answer | "offline">) {
  const asked: string[] = [];
  const doFetch = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    const type = url.searchParams.get("type") ?? "";
    const domain = url.searchParams.get("name") ?? "";
    asked.push(`${domain}/${type}`);
    const answer = answers[`${domain}/${type}`] ?? answers[domain];
    if (!answer || answer === "offline") throw new Error("dns down");
    return new Response(JSON.stringify(answer), {
      status: 200,
      headers: { "content-type": "application/dns-json" },
    });
  }) as typeof fetch;
  return { doFetch, asked };
}

const mx = (host: string): Answer => ({
  Status: 0,
  Answer: [{ type: 15, data: `10 ${host}` }],
});
const aRecord = (ip: string): Answer => ({
  Status: 0,
  Answer: [{ type: 1, data: ip }],
});
const nothing: Answer = { Status: 0, Answer: [] };
const nxdomain: Answer = { Status: 3, Answer: [] };

test("A domain with a mail server is accepted, no quota spent", async () => {
  const { doFetch } = fakeDns({ "gmail.com/MX": mx("gmail-smtp-in.l.google.com") });
  assert.equal(await domainAcceptsMail("gmail.com", doFetch), true);
});

test("No MX still works when the host itself answers, as RFC 5321 allows", async () => {
  const { doFetch, asked } = fakeDns({
    "example.com/MX": nothing,
    "example.com/A": aRecord("93.184.216.34"),
  });
  assert.equal(await domainAcceptsMail("example.com", doFetch), true);
  assert.deepEqual(asked, ["example.com/MX", "example.com/A"]);
});

test("A domain nobody owns is refused — the ghost case", async () => {
  const { doFetch } = fakeDns({ "ghost-adress.invalid/MX": nxdomain });
  assert.equal(await domainAcceptsMail("ghost-adress.invalid", doFetch), false);
});

test("A domain that exists but cannot receive mail is refused", async () => {
  const { doFetch } = fakeDns({
    "sem-correio.test/MX": nothing,
    "sem-correio.test/A": nothing,
  });
  assert.equal(await domainAcceptsMail("sem-correio.test", doFetch), false);
});

test("When DNS says nothing, the visitor is never punished for it", async () => {
  const { doFetch } = fakeDns({ "gmail.com/MX": "offline" });
  assert.equal(await domainAcceptsMail("gmail.com", doFetch), null);

  const broken = (async () =>
    new Response("nope", { status: 503 })) as unknown as typeof fetch;
  assert.equal(await domainAcceptsMail("gmail.com", broken), null);
});

test("Typos in well-known domains are suggested, real domains are not", () => {
  assert.equal(suggestEmailDomain("azam@gmial.com"), "azam@gmail.com");
  assert.equal(suggestEmailDomain("azam@gmail.con"), "azam@gmail.com");
  assert.equal(suggestEmailDomain("azam@hotmial.com"), "azam@hotmail.com");
  assert.equal(suggestEmailDomain("azam@outlok.com"), "azam@outlook.com");
  // Correct and unusual-but-real domains keep their own name.
  assert.equal(suggestEmailDomain("azam@gmail.com"), null);
  assert.equal(suggestEmailDomain("azam@isutc.ac.mz"), null);
  assert.equal(suggestEmailDomain("not-an-email"), null);
});

test("An undeliverable domain comes back as a typo with the fix attached", async () => {
  const { doFetch } = fakeDns({ "gmial.com/MX": nxdomain });
  assert.deepEqual(await verifyEmailAddress("azam@gmial.com", { doFetch }), {
    ok: false,
    reason: "typo",
    suggestion: "azam@gmail.com",
  });
});

test("An undeliverable domain with no near miss is simply undeliverable", async () => {
  const { doFetch } = fakeDns({ "nao-existe-mesmo.invalid/MX": nxdomain });
  assert.deepEqual(
    await verifyEmailAddress("azam@nao-existe-mesmo.invalid", { doFetch }),
    { ok: false, reason: "undeliverable" },
  );
});

test("A reachable domain passes without a verifier key", async () => {
  const { doFetch } = fakeDns({ "gmail.com/MX": mx("gmail") });
  assert.deepEqual(await verifyEmailAddress("azam@gmail.com", { doFetch }), {
    ok: true,
  });
});

test("The optional verifier can reject a mailbox DNS believes in", async () => {
  const { doFetch } = fakeDns({ "gmail.com/MX": mx("gmail") });
  const verifier = (async () =>
    new Response(JSON.stringify({ deliverability: "UNDELIVERABLE" }), {
      status: 200,
    })) as unknown as typeof fetch;

  assert.deepEqual(
    await verifyEmailAddress("azam@gmail.com", {
      key: "k",
      provider: "abstract",
      doFetch: ((input, init) =>
        String(input).includes("emailvalidation")
          ? verifier(input, init)
          : doFetch(input, init)) as typeof fetch,
    }),
    { ok: false, reason: "undeliverable" },
  );
});

test("A dead verifier is 'no idea', never 'invalid'", async () => {
  const { doFetch } = fakeDns({ "gmail.com/MX": mx("gmail") });
  const dead = (async () =>
    new Response("{}", { status: 500 })) as unknown as typeof fetch;

  assert.deepEqual(
    await verifyEmailAddress("azam@gmail.com", {
      key: "k",
      doFetch: ((input, init) =>
        String(input).includes("abstractapi")
          ? dead(input, init)
          : doFetch(input, init)) as typeof fetch,
    }),
    { ok: true },
  );
});

test("QuickEmailVerification and Mailboxlayer are understood too", async () => {
  const { doFetch } = fakeDns({ "gmail.com/MX": mx("gmail") });
  const route = (body: unknown, host: string) =>
    ((input: RequestInfo | URL, init?: RequestInit) =>
      String(input).includes(host)
        ? Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
        : doFetch(input, init)) as typeof fetch;

  assert.equal(
    (
      await verifyEmailAddress("azam@gmail.com", {
        key: "k",
        provider: "quickemailverification",
        doFetch: route({ result: "invalid" }, "quickemailverification"),
      })
    ).ok,
    false,
  );
  assert.equal(
    (
      await verifyEmailAddress("azam@gmail.com", {
        key: "k",
        provider: "mailboxlayer",
        doFetch: route({ format_valid: true, mx_found: false }, "apilayer"),
      })
    ).ok,
    false,
  );
  // An unknown provider name is ignored rather than trusted.
  assert.equal(
    (
      await verifyEmailAddress("azam@gmail.com", {
        key: "k",
        provider: "quem-sabe",
        doFetch,
      })
    ).ok,
    true,
  );
});
