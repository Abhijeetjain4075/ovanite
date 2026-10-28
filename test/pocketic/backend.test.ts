import { type CanisterFixture, PocketIc } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * The PocketIC backend lane: installs the app's own compiled canister into the
 * platform's replica and calls the real public API. The frontend suite mocks
 * the actor, so it passes against a backend whose methods are unimplemented
 * stubs; this lane is what proves the canister actually answers.
 *
 * The runner sets `POCKET_IC_URL` and `BACKEND_WASM` and only starts Vitest
 * once a live replica is available, so a missing value here is a runner bug,
 * not an environment to tolerate.
 */
const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

let pic: PocketIc | undefined;
let actor: _SERVICE;
let canisterId: CanisterFixture["canisterId"];

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  ({ actor, canisterId } = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM,
  }));
});

afterAll(async () => {
  // `?.` because `beforeAll` may not have got that far. A failed
  // `PocketIc.create` otherwise stacks "Cannot read properties of undefined"
  // on top of the real error and buries the one line that explains the run.
  await pic?.tearDown();
});

it("answers the public reads instead of trapping", async () => {
  await expect(actor.listPublishedProducts()).resolves.toEqual([]);
  await expect(actor.getSiteContent()).resolves.toBeDefined();
  // No owner principal is configured in the safe default build, so bootstrap
  // is closed rather than open to the first authenticated visitor.
  await expect(actor.isOwnerClaimed()).resolves.toBe(true);
  await expect(actor.getCallerAdmin()).resolves.toEqual([]);
});

it("seeds exactly five published FAQs on a fresh deploy, in order", async () => {
  // The accepted requirement is that a fresh deploy renders the FAQ accordion
  // with five published questions rather than the empty state. This is the only
  // place the seed itself is observed: the frontend suite mocks the actor, so
  // it can only prove the rendering contract, never that the migration ran.
  const faqs = await actor.listPublishedFaqs(10n);

  expect(faqs).toHaveLength(5);
  expect(faqs.map((faq) => faq.question)).toEqual([
    "What does Ovanite build?",
    "How does Ovanite work?",
    "How can I get in touch with Ovanite?",
    "How does the waitlist work?",
    "Where does Ovanite operate?",
  ]);
  expect(faqs.map((faq) => faq.sortOrder)).toEqual([1n, 2n, 3n, 4n, 5n]);
  for (const faq of faqs) {
    expect(faq.state).toEqual({ published: null });
    expect(faq.answer.length).toBeGreaterThan(0);
  }

  // The public read is bounded by `limit`, so the home page's `useFaqs(5)`
  // still receives all five and no more.
  await expect(actor.listPublishedFaqs(5n)).resolves.toHaveLength(5);
});

it("fails closed when owner bootstrap has no configured principal", async () => {
  // A non-anonymous principal must not be able to take ownership by supplying
  // the public owner email. This is the production-safe default until the
  // operator's exact Internet Identity principal is configured in backend source.
  const arbitraryPrincipal = await pic!.createCanister();
  const arbitraryCaller = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  arbitraryCaller.setPrincipal(arbitraryPrincipal);

  await expect(
    arbitraryCaller.claimOwner("therealabhijeetjain@gmail.com"),
  ).rejects.toThrow(/owner principal is not configured|Unauthorized/i);
  await expect(arbitraryCaller.isOwnerClaimed()).resolves.toBe(true);
  await expect(arbitraryCaller.getCallerAdmin()).resolves.toEqual([]);
  await expect(arbitraryCaller.listAllFaqs()).rejects.toThrow();
  await expect(arbitraryCaller.listAdmins()).rejects.toThrow();
});


it("keeps owner bootstrap closed after failed and repeated claim attempts", async () => {
  // Exercise repeated calls and caller changes against the actual canister,
  // not only source-text assertions. With no configured owner principal,
  // matching the public email must never grant ownership.
  const firstPrincipal = await pic!.createCanister();
  const firstCaller = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  firstCaller.setPrincipal(firstPrincipal);

  await expect(
    firstCaller.claimOwner("therealabhijeetjain@gmail.com"),
  ).rejects.toThrow(/owner principal is not configured|Unauthorized/i);
  await expect(
    firstCaller.claimOwner("therealabhijeetjain@gmail.com"),
  ).rejects.toThrow(/owner principal is not configured|Unauthorized/i);

  const secondPrincipal = await pic!.createCanister();
  const secondCaller = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  secondCaller.setPrincipal(secondPrincipal);
  await expect(
    secondCaller.claimOwner("therealabhijeetjain@gmail.com"),
  ).rejects.toThrow(/owner principal is not configured|Unauthorized/i);

  await expect(firstCaller.isOwnerClaimed()).resolves.toBe(true);
  await expect(secondCaller.isOwnerClaimed()).resolves.toBe(true);
  await expect(firstCaller.getCallerAdmin()).resolves.toEqual([]);
  await expect(secondCaller.getCallerAdmin()).resolves.toEqual([]);
});

it("stores a contact submission through the real canister", async () => {
  const result = await actor.submitContact({
    name: "Ada Lovelace",
    email: "ada@example.com",
    message: "I would like to learn more about your products.",
  });

  expect(result).toHaveProperty("created");
  const created = result.created;
  expect(created.name).toBe("Ada Lovelace");
  expect(created.kind).toEqual({ contact: null });
  expect(created.status).toEqual({ new: null });
});

it("stores a waitlist submission through the real canister", async () => {
  const result = await actor.submitWaitlist({
    name: "Grace Hopper",
    email: "grace@example.com",
    note: ["Interested in early access."],
  });

  expect(result).toHaveProperty("created");
  const created = result.created;
  expect(created.name).toBe("Grace Hopper");
  expect(created.kind).toEqual({ waitlist: null });
});

it("reports a duplicate contact instead of storing a second record", async () => {
  // A fresh email keeps this test independent of the records earlier tests
  // created in the same shared canister.
  const input = {
    name: "Duplicate Contact",
    email: "duplicate-contact@example.com",
    message: "This exact message is sent twice.",
  };

  const first = await actor.submitContact(input);
  expect(first).toHaveProperty("created");

  // Same email and message, differing only in surrounding whitespace and email
  // case: normalization must still recognize it as the same submission.
  const second = await actor.submitContact({
    name: "Duplicate Contact",
    email: "  DUPLICATE-CONTACT@example.com  ",
    message: "  This exact message is sent twice.  ",
  });

  expect(second).toHaveProperty("duplicate");
  expect(second.duplicate.id).toBe(first.created.id);
});

it("reports a duplicate waitlist entry instead of storing a second record", async () => {
  const input = {
    name: "Duplicate Waitlist",
    email: "duplicate-waitlist@example.com",
    note: ["This exact note is sent twice."],
  };

  const first = await actor.submitWaitlist(input);
  expect(first).toHaveProperty("created");

  const second = await actor.submitWaitlist({
    name: "Duplicate Waitlist",
    email: "DUPLICATE-WAITLIST@example.com",
    note: ["This exact note is sent twice."],
  });

  expect(second).toHaveProperty("duplicate");
  expect(second.duplicate.id).toBe(first.created.id);
});

it("treats an absent note and an empty note as the same waitlist submission", async () => {
  const first = await actor.submitWaitlist({
    name: "Alan Turing",
    email: "alan@example.com",
    note: [],
  });
  expect(first).toHaveProperty("created");

  const second = await actor.submitWaitlist({
    name: "Alan Turing",
    email: "alan@example.com",
    note: [""],
  });

  expect(second).toHaveProperty("duplicate");
  expect(second.duplicate.id).toBe(first.created.id);
});

it("records an aggregate page view and reads it back", async () => {
  // A path unique to this test keeps the assertion independent of any other
  // test that records views in the same shared canister.
  const path = "/pocketic-analytics-read";

  const first = await actor.recordPageView(path);
  expect(first).toHaveProperty("recorded");
  expect(first.recorded.path).toBe(path);
  expect(first.recorded.views).toBe(1n);

  const read = await actor.getPageViews(path);
  expect(read).toHaveLength(1);
  expect(read[0]?.views).toBe(1n);
  expect(read[0]?.path).toBe(path);
});

it("increments the aggregate total additively on repeated views", async () => {
  const path = "/pocketic-analytics-additive";

  await actor.recordPageView(path);
  await actor.recordPageView(path);
  const third = await actor.recordPageView(path);

  expect(third).toHaveProperty("recorded");
  expect(third.recorded.views).toBe(3n);

  const read = await actor.getPageViews(path);
  expect(read[0]?.views).toBe(3n);
});

it("ignores admin paths and stores nothing for them", async () => {
  const before = await actor.listPageViews();

  const admin = await actor.recordPageView("/admin");
  expect(admin).toEqual({ ignored: null });

  const nested = await actor.recordPageView("/admin/faqs");
  expect(nested).toEqual({ ignored: null });

  // No admin path appears in the aggregate list, and the list is unchanged.
  const after = await actor.listPageViews();
  expect(after).toHaveLength(before.length);
  expect(after.some((entry) => entry.path.startsWith("/admin"))).toBe(false);
  await expect(actor.getPageViews("/admin")).resolves.toEqual([]);
});

it("normalizes a public path before counting it", async () => {
  // Query strings, fragments, duplicate slashes, and a trailing slash all
  // collapse to the same canonical route, so they share one aggregate total.
  const canonical = "/pocketic-analytics-normalized";

  await actor.recordPageView(`${canonical}?utm_source=test`);
  await actor.recordPageView(`${canonical}#section`);
  await actor.recordPageView(`${canonical}//`);
  const last = await actor.recordPageView(`  ${canonical}/  `);

  expect(last).toHaveProperty("recorded");
  expect(last.recorded.path).toBe(canonical);
  expect(last.recorded.views).toBe(4n);

  const read = await actor.getPageViews(canonical);
  expect(read[0]?.views).toBe(4n);
});

it("ignores malformed paths instead of storing them", async () => {
  await expect(actor.recordPageView("not-a-path")).resolves.toEqual({
    ignored: null,
  });
  await expect(actor.recordPageView("")).resolves.toEqual({ ignored: null });
  await expect(actor.getPageViews("not-a-path")).resolves.toEqual([]);
});

it("lists every recorded route with its aggregate total", async () => {
  const path = "/pocketic-analytics-listed";
  await actor.recordPageView(path);

  const all = await actor.listPageViews();
  const entry = all.find((row) => row.path === path);
  expect(entry).toBeDefined();
  expect(entry?.views).toBe(1n);
  expect(entry?.firstSeenAt).toBeGreaterThan(0n);
  expect(entry?.lastSeenAt).toBeGreaterThanOrEqual(entry?.firstSeenAt ?? 0n);
});

it("does not expose admin reads or writes to an anonymous caller", async () => {
  // The default actor caller is anonymous. Every admin-only method must reject
  // rather than return data, and no caller may self-grant admin access.
  await expect(actor.listAllProducts()).rejects.toThrow();
  await expect(actor.listAllFaqs()).rejects.toThrow();
  await expect(actor.listSubmissions({ kind: [], status: [] })).rejects.toThrow();
  await expect(actor.listAdmins()).rejects.toThrow();
  await expect(actor.isCallerAdmin()).resolves.toBe(false);
  await expect(actor.isCallerOwner()).resolves.toBe(false);
  // An anonymous caller cannot even attempt the one-time claim: the backend
  // requires a signed-in caller before it checks the email.
  await expect(actor.claimOwner("not-the-owner@example.com")).rejects.toThrow();
});
