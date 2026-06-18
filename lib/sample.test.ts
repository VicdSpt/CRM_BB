import { describe, it, expect } from "vitest";
import { add } from "./sample";

describe("add", () => {
  it("additionne deux nombres", () => {
    expect(add(2, 3)).toBe(5);
  });
});
