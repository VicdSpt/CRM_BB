import { describe, it, expect } from "vitest";
import { parsePackForm } from "./pack-schema";

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.append(k, v);
  return f;
}

describe("parsePackForm", () => {
  it("valide un pack correct", () => {
    const res = parsePackForm(fd({ nbSeancesTotal: "10", montantPaye: "350", methode: "ESPECES" }));
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.nbSeancesTotal).toBe(10);
      expect(res.data.montantPaye).toBe("350");
      expect(res.data.methode).toBe("ESPECES");
    }
  });

  it("rejette un nombre de séances nul", () => {
    const res = parsePackForm(fd({ nbSeancesTotal: "0", montantPaye: "350", methode: "CB" }));
    expect(res.success).toBe(false);
  });

  it("rejette un montant invalide", () => {
    const res = parsePackForm(fd({ nbSeancesTotal: "10", montantPaye: "abc", methode: "CB" }));
    expect(res.success).toBe(false);
    if (!res.success) expect(res.errors.montantPaye).toBeTruthy();
  });

  it("rejette une méthode inconnue", () => {
    const res = parsePackForm(fd({ nbSeancesTotal: "10", montantPaye: "350", methode: "CHEQUE" }));
    expect(res.success).toBe(false);
  });
});
