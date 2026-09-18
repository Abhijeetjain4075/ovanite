import { describe, expect, it } from "vitest";

import {
  isValidEmail,
  validateEmail,
  validateMessage,
  validateName,
  validateNote,
} from "@/lib/validation";

describe("validateName", () => {
  it("requires a name of at least two characters", () => {
    expect(validateName("")).toBe("Please enter your name.");
    expect(validateName("   ")).toBe("Please enter your name.");
    expect(validateName("A")).toBe("Name must be at least 2 characters.");
    expect(validateName("Ada")).toBeUndefined();
  });
});

describe("validateEmail", () => {
  it("requires a well-formed email address", () => {
    expect(validateEmail("")).toBe("Please enter your email address.");
    expect(validateEmail("not-an-email")).toBe(
      "Please enter a valid email address.",
    );
    expect(validateEmail("ada@example.com")).toBeUndefined();
  });

  it("accepts common valid shapes and rejects malformed ones", () => {
    expect(isValidEmail("a.b+tag@sub.example.co")).toBe(true);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("a b@example.com")).toBe(false);
  });
});

describe("validateMessage", () => {
  it("requires at least ten characters of detail", () => {
    expect(validateMessage("")).toBe("Please tell us how we can help.");
    expect(validateMessage("too short")).toBe(
      "Please provide at least 10 characters of detail.",
    );
    expect(
      validateMessage("This is a sufficiently long message."),
    ).toBeUndefined();
  });
});

describe("validateNote", () => {
  it("allows an empty note and caps it at 500 characters", () => {
    expect(validateNote("")).toBeUndefined();
    expect(validateNote("a".repeat(500))).toBeUndefined();
    expect(validateNote("a".repeat(501))).toBe(
      "Please keep your note under 500 characters.",
    );
  });
});
