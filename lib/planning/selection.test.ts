import { describe, it, expect } from "vitest";
import { whereElevesSelectionnables } from "./selection";

describe("whereElevesSelectionnables", () => {
  it("propose les élèves actifs et validés (ou sans compte)", () => {
    expect(whereElevesSelectionnables([])).toEqual({
      OR: [{ archive: false, statutCompte: { not: "EN_ATTENTE" } }, { id: { in: [] } }],
    });
  });

  it("garde toujours les participants actuels, même en attente ou archivés", () => {
    // Sinon, enregistrer la séance les retirerait sans prévenir.
    expect(whereElevesSelectionnables(["e1", "e2"])).toEqual({
      OR: [{ archive: false, statutCompte: { not: "EN_ATTENTE" } }, { id: { in: ["e1", "e2"] } }],
    });
  });
});
