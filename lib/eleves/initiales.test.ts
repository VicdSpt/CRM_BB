import { describe, it, expect } from "vitest";
import { initiales } from "./initiales";

describe("initiales", () => {
  it("prend la 1re lettre du prénom et du nom en majuscules", () => {
    expect(initiales("Jean", "Dupont")).toBe("JD");
    expect(initiales("victor", "despirlet")).toBe("VD");
  });

  it("gère un prénom ou un nom vide", () => {
    expect(initiales("", "Dupont")).toBe("D");
    expect(initiales("Jean", "")).toBe("J");
  });

  it("renvoie ? si tout est vide", () => {
    expect(initiales("", "")).toBe("?");
  });
});
