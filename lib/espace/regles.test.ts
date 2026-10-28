import { describe, it, expect } from "vitest";
import { etatCours, peutSeDesinscrire, peutSInscrire, placesRestantes, type Cours } from "./regles";

const now = new Date(2026, 10, 2, 12, 0);
const dansHeures = (h: number) => new Date(now.getTime() + h * 3_600_000);

const cours = (overrides: Partial<Cours> = {}): Cours => ({
  statut: "PLANIFIEE",
  debut: dansHeures(48),
  nbInscrits: 2,
  capacite: 4,
  inscrit: false,
  statutReglement: null,
  ...overrides,
});

describe("placesRestantes", () => {
  it("calcule les places libres", () => {
    expect(placesRestantes(2, 4)).toBe(2);
  });

  it("ne descend jamais sous zéro (capacité baissée par le coach)", () => {
    expect(placesRestantes(5, 4)).toBe(0);
  });
});

describe("etatCours", () => {
  it("annulé prime sur le reste", () => {
    expect(etatCours(cours({ statut: "ANNULEE", inscrit: true }), now)).toBe("annule");
  });

  it("disponible quand il reste des places", () => {
    expect(etatCours(cours(), now)).toBe("disponible");
  });

  it("complet quand la capacité est atteinte ou dépassée", () => {
    expect(etatCours(cours({ nbInscrits: 4 }), now)).toBe("complet");
    expect(etatCours(cours({ nbInscrits: 5 }), now)).toBe("complet");
  });

  it("inscrit à plus de 24 h du cours", () => {
    expect(etatCours(cours({ inscrit: true, debut: dansHeures(25) }), now)).toBe("inscrit");
  });

  it("inscrit verrouillé à moins de 24 h du cours", () => {
    expect(etatCours(cours({ inscrit: true, debut: dansHeures(23) }), now)).toBe(
      "inscrit_verrouille",
    );
  });

  it("passé quand le cours a commencé", () => {
    expect(etatCours(cours({ debut: dansHeures(-1) }), now)).toBe("passe");
  });
});

describe("peutSInscrire", () => {
  it("accepte un cours disponible", () => {
    expect(peutSInscrire(cours(), now)).toEqual({ ok: true });
  });

  it("refuse un cours complet", () => {
    expect(peutSInscrire(cours({ nbInscrits: 4 }), now)).toEqual({
      ok: false,
      raison: "Ce cours est complet.",
    });
  });

  it("refuse un cours déjà commencé", () => {
    expect(peutSInscrire(cours({ debut: dansHeures(-1) }), now)).toEqual({
      ok: false,
      raison: "Ce cours a déjà commencé.",
    });
  });

  it("refuse un cours annulé", () => {
    expect(peutSInscrire(cours({ statut: "ANNULEE" }), now)).toEqual({
      ok: false,
      raison: "Ce cours est annulé.",
    });
  });

  it("refuse une double inscription", () => {
    expect(peutSInscrire(cours({ inscrit: true }), now)).toEqual({
      ok: false,
      raison: "Tu es déjà inscrit à ce cours.",
    });
  });
});

describe("peutSeDesinscrire", () => {
  const inscrit = (h: number, statutReglement: Cours["statutReglement"]) =>
    cours({ inscrit: true, debut: dansHeures(h), statutReglement });

  it("refuse à moins de 24 h du cours", () => {
    expect(peutSeDesinscrire(inscrit(23, "A_REGLER"), now)).toEqual({
      ok: false,
      raison: "Désinscription impossible à moins de 24 h du cours. Contacte ton coach.",
    });
  });

  it("accepte à plus de 24 h si le cours n'est pas réglé", () => {
    expect(peutSeDesinscrire(inscrit(25, "A_REGLER"), now)).toEqual({ ok: true });
  });

  it("refuse si le cours est déjà réglé", () => {
    expect(peutSeDesinscrire(inscrit(25, "PAYE"), now)).toEqual({
      ok: false,
      raison: "Ce cours est déjà réglé. Contacte ton coach.",
    });
  });
});
