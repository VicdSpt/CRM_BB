import { describe, it, expect } from "vitest";
import { parseProfilForm, verifierEmailLibre } from "./profil";

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.append(k, v);
  return f;
}

const base = { email: "sam@exemple.be", telephone: "0470 12 34 56", adresse: "Rue X 1" };

describe("verifierEmailLibre", () => {
  it("accepte un email libre", () => {
    expect(
      verifierEmailLibre("sam@exemple.be", {
        eleveIdCourant: "e1",
        eleveAvecEmail: null,
        emailEstCoach: false,
      }),
    ).toBeNull();
  });

  it("accepte l'email déjà porté par l'élève lui-même", () => {
    expect(
      verifierEmailLibre("sam@exemple.be", {
        eleveIdCourant: "e1",
        eleveAvecEmail: { id: "e1" },
        emailEstCoach: false,
      }),
    ).toBeNull();
  });

  it("refuse l'email d'un autre élève", () => {
    expect(
      verifierEmailLibre("sam@exemple.be", {
        eleveIdCourant: "e1",
        eleveAvecEmail: { id: "e2" },
        emailEstCoach: false,
      }),
    ).toBe("Cet email est déjà utilisé.");
  });

  it("refuse l'email du coach", () => {
    expect(
      verifierEmailLibre("coach@exemple.be", {
        eleveIdCourant: "e1",
        eleveAvecEmail: null,
        emailEstCoach: true,
      }),
    ).toBe("Cet email est déjà utilisé.");
  });
});

describe("parseProfilForm", () => {
  it("transforme une adresse vide en undefined", () => {
    const res = parseProfilForm(fd({ ...base, adresse: "  " }));
    expect(res.success && res.data.adresse).toBeUndefined();
  });

  it("met l'email en minuscules", () => {
    const res = parseProfilForm(fd({ ...base, email: " Sam@Exemple.BE " }));
    expect(res.success && res.data.email).toBe("sam@exemple.be");
  });

  it("exige un téléphone", () => {
    const res = parseProfilForm(fd({ ...base, telephone: "" }));
    expect(res.success).toBe(false);
    if (!res.success) expect(res.errors.telephone).toBe("Le téléphone est obligatoire");
  });
});
