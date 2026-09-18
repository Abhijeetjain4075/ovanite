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
  await expect(actor.isOwnerClaimed()).resolves.toBe(false);
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

it("keeps the seeded FAQs fully editable through the admin endpoints", async () => {
  // Ownership is bootstrapped by a one-time claim from a signed-in caller. The
  // shared `actor` is anonymous, so drive the admin endpoints through a
  // separate actor whose caller is a real (non-anonymous) principal. A canister
  // id is a perfectly good principal for this, and it keeps the shared actor's
  // anonymous caller intact for the permission test below.
  const ownerPrincipal = await pic!.createCanister();
  const owner = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  owner.setPrincipal(ownerPrincipal);

  // Must match `AdminLib.ownerEmail` in src/backend/lib/admin.mo exactly; a
  // mismatch traps with "Unauthorized: email is not the configured owner".
  await expect(owner.claimOwner("therealabhijeetjain@gmail.com")).resolves.toBe(
    true,
  );
  await expect(owner.isOwnerClaimed()).resolves.toBe(true);

  // The seeded FAQs appear in the admin list as published.
  const all = await owner.listAllFaqs();
  expect(all).toHaveLength(5);
  expect(all.every((faq) => faq.state.published !== undefined)).toBe(true);

  // Edit a seeded FAQ's question and answer.
  const edited = await owner.updateFaq(1n, {
    question: ["What does Ovanite build now?"],
    answer: ["Updated answer."],
    sortOrder: [],
  });
  expect(edited).not.toBeNull();
  expect(edited?.[0]?.question).toBe("What does Ovanite build now?");
  expect(edited?.[0]?.answer).toBe("Updated answer.");

  // Reorder a seeded FAQ.
  const reordered = await owner.updateFaq(2n, {
    question: [],
    answer: [],
    sortOrder: [9n],
  });
  expect(reordered?.[0]?.sortOrder).toBe(9n);

  // Unpublish a seeded FAQ: it leaves the public read but stays in the admin
  // list, then publish it again to restore the fresh-deploy state.
  const unpublished = await owner.setFaqState(3n, { draft: null });
  expect(unpublished?.[0]?.state).toEqual({ draft: null });
  const publishedIds = (await actor.listPublishedFaqs(10n)).map((faq) => faq.id);
  expect(publishedIds).not.toContain(3n);
  await owner.setFaqState(3n, { published: null });

  // Delete a seeded FAQ.
  await expect(owner.deleteFaq(5n)).resolves.toBe(true);
  await expect(owner.getFaq(5n)).resolves.toEqual([]);
  expect(await owner.listAllFaqs()).toHaveLength(4);

  // Restore the seed so later tests observe the fresh-deploy state.
  await owner.updateFaq(1n, {
    question: ["What does Ovanite build?"],
    answer: [
      "Ovanite builds thoughtful digital products designed to solve meaningful problems. We focus on software that earns its place: clear in purpose, careful in craft, and useful from the first release.",
    ],
    sortOrder: [1n],
  });
  await owner.updateFaq(2n, { question: [], answer: [], sortOrder: [2n] });
  await owner.createFaq({
    question: "Where does Ovanite operate?",
    answer:
      "Ovanite is a software company that works with people wherever they are. Our products are built to be used online, so the work is not limited by a single location.",
    sortOrder: 5n,
  });
  await owner.setFaqState(6n, { published: null });
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
