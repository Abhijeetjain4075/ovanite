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

it("rejects Contact and Waitlist writes while the backend release policy is closed", async () => {
  await expect(
    actor.submitContact({
      name: "Ada Lovelace",
      email: "ada@example.com",
      message: "I would like to learn more about your products.",
    }),
  ).rejects.toThrow(/public submissions are disabled by backend release policy/i);

  await expect(
    actor.submitWaitlist({
      name: "Grace Hopper",
      email: "grace@example.com",
      note: ["Interested in early access."],
    }),
  ).rejects.toThrow(/public submissions are disabled by backend release policy/i);
});

it("does not allow a non-anonymous principal to bypass the server-side submission gate", async () => {
  const principal = await pic!.createCanister();
  const caller = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  caller.setPrincipal(principal);

  await expect(
    caller.submitContact({
      name: "Direct Caller",
      email: "direct@example.com",
      message: "This direct canister call must remain blocked.",
    }),
  ).rejects.toThrow(/public submissions are disabled by backend release policy/i);

  await expect(
    caller.submitWaitlist({
      name: "Direct Caller",
      email: "direct@example.com",
      note: [],
    }),
  ).rejects.toThrow(/public submissions are disabled by backend release policy/i);
});

it("rejects public analytics writes while the backend release policy is closed", async () => {
  // Client consent cannot protect a public canister method from direct calls.
  // Reject typical routes and many distinct caller-controlled paths before any
  // Map entry or counter can be written, regardless of caller identity.
  for (const path of [
    "/",
    "/products",
    "/attacker-generated-route-1",
    `/${"x".repeat(120)}`,
  ]) {
    await expect(actor.recordPageView(path)).rejects.toThrow(
      /public analytics writes are disabled by backend release policy/i,
    );
  }

  const signedInPrincipal = await pic!.createCanister();
  const signedInCaller = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  signedInCaller.setPrincipal(signedInPrincipal);
  await expect(
    signedInCaller.recordPageView("/direct-signed-in-write"),
  ).rejects.toThrow(/public analytics writes are disabled by backend release policy/i);

  // The failed update attempts have not inserted caller-controlled route keys.
  await expect(actor.getPageViews("/products")).resolves.toEqual([]);
  await expect(actor.getPageViews("/attacker-generated-route-1")).resolves.toEqual([]);
  await expect(actor.listPageViews()).resolves.toEqual([]);
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

it("caps public FAQ query limits before numeric conversion", async () => {
  // Nat is arbitrary-precision. A hostile caller must not be able to force
  // Nat-to-Int overflow by asking for an unbounded public FAQ result.
  await expect(
    actor.listPublishedFaqs(999999999999999999999999999999999999n),
  ).resolves.toHaveLength(5);
});

it("documents the actual security boundary and closed public write gates", async () => {
  const apiDoc = await actor.getApiDoc();

  expect(apiDoc).toContain("`ownerPrincipal` is `null`");
  expect(apiDoc).toContain("Email alone");
  expect(apiDoc).toContain("Public submissions are disabled by backend release policy");
  expect(apiDoc).toContain("Public analytics writes are disabled by backend release policy");
  expect(apiDoc).toContain("`#viewer`");
  expect(apiDoc).toContain("cannot mutate content or submission records");
  expect(apiDoc).not.toContain("The first non-anonymous caller to initialize becomes `#admin`.");
  expect(apiDoc).not.toContain("ownership is bootstrapped by email alone");
});
