import { describe, it, expect } from "vitest";
import { parseSeanceId } from "./ids";

describe("parseSeanceId", () => {
  it("accepte un identifiant non vide", () => {
    expect(parseSeanceId("cmvqykfmz0000lwek77tbsuff")).toBe("cmvqykfmz0000lwek77tbsuff");
  });

  it("rejette une chaîne vide", () => {
    expect(parseSeanceId("")).toBeNull();
  });

  it("rejette ce qui n'est pas une chaîne (appel forgé)", () => {
    expect(parseSeanceId(42)).toBeNull();
    expect(parseSeanceId({ id: "x" })).toBeNull();
    expect(parseSeanceId(undefined)).toBeNull();
  });
});
