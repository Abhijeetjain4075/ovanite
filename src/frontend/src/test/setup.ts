import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

// Generated components expose stable `data-ocid` hooks; use them only when no
// semantic query (role, label, text) can express the assertion.
configure({ testIdAttribute: "data-ocid" });

afterEach(() => {
  cleanup();
});
