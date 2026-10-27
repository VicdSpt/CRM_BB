import { describe, it, expect } from "vitest";
import { authenticate, credentialsSchema, type EleveAuthRecord } from "./credentials";
import { hashPassword } from "./password";

const aucunCoach = async () => null;
const aucunEleve = async () => null;

describe("credentialsSchema", () => {
  it("rejette un email invalide", () => {
    expect(credentialsSchema.safeParse({ email: "pas-un-email", password: "x" }).success).toBe(
      false,
    );
  });

  it("accepte des identifiants bien formés", () => {
    expect(credentialsSchema.safeParse({ email: "coach@test.fr", password: "x" }).success).toBe(
      true,
    );
  });

  it("met l'email en minuscules et retire les espaces", () => {
    const parsed = credentialsSchema.parse({ email: " Sam@Exemple.BE ", password: "x" });
    expect(parsed.email).toBe("sam@exemple.be");
  });
});

describe("authenticate — coach", () => {
  it("renvoie le coach (sans hash) avec le rôle coach quand les identifiants sont valides", async () => {
    const hash = await hashPassword("bonmotdepasse");
    const findCoach = async () => ({
      id: "c1",
      email: "coach@test.fr",
      motDePasse: hash,
      nom: "Coach",
    });
    const result = await authenticate(
      { email: "coach@test.fr", password: "bonmotdepasse" },
      { findCoach, findEleve: aucunEleve },
    );
    expect(result).toEqual({ id: "c1", email: "coach@test.fr", name: "Coach", role: "coach" });
  });

  it("renvoie null si personne n'a cet email", async () => {
    const result = await authenticate(
      { email: "absent@test.fr", password: "x" },
      { findCoach: aucunCoach, findEleve: aucunEleve },
    );
    expect(result).toBeNull();
  });

  it("renvoie null si le mot de passe du coach est faux", async () => {
    const hash = await hashPassword("bonmotdepasse");
    const findCoach = async () => ({
      id: "c1",
      email: "coach@test.fr",
      motDePasse: hash,
      nom: "Coach",
    });
    const result = await authenticate(
      { email: "coach@test.fr", password: "faux" },
      { findCoach, findEleve: aucunEleve },
    );
    expect(result).toBeNull();
  });

  it("renvoie null si l'entrée est malformée", async () => {
    const result = await authenticate(
      { email: "x", password: "" },
      { findCoach: aucunCoach, findEleve: aucunEleve },
    );
    expect(result).toBeNull();
  });
});

describe("authenticate — élève", () => {
  async function eleve(overrides: Partial<EleveAuthRecord> = {}): Promise<EleveAuthRecord> {
    return {
      id: "e1",
      email: "sam@exemple.be",
      prenom: "Sam",
      nom: "Dupont",
      motDePasse: await hashPassword("motdepasse8"),
      statutCompte: "VALIDE",
      archive: false,
      ...overrides,
    };
  }

  it("connecte un élève validé avec le rôle eleve", async () => {
    const record = await eleve();
    const result = await authenticate(
      { email: "sam@exemple.be", password: "motdepasse8" },
      { findCoach: aucunCoach, findEleve: async () => record },
    );
    expect(result).toEqual({
      id: "e1",
      email: "sam@exemple.be",
      name: "Sam Dupont",
      role: "eleve",
    });
  });

  it("connecte aussi un élève en attente (il verra l'écran d'attente)", async () => {
    const record = await eleve({ statutCompte: "EN_ATTENTE" });
    const result = await authenticate(
      { email: "sam@exemple.be", password: "motdepasse8" },
      { findCoach: aucunCoach, findEleve: async () => record },
    );
    expect(result?.role).toBe("eleve");
  });

  it("refuse un élève sans compte", async () => {
    const record = await eleve({ statutCompte: "AUCUN" });
    const result = await authenticate(
      { email: "sam@exemple.be", password: "motdepasse8" },
      { findCoach: aucunCoach, findEleve: async () => record },
    );
    expect(result).toBeNull();
  });

  it("refuse un élève sans mot de passe", async () => {
    const record = await eleve({ motDePasse: null });
    const result = await authenticate(
      { email: "sam@exemple.be", password: "motdepasse8" },
      { findCoach: aucunCoach, findEleve: async () => record },
    );
    expect(result).toBeNull();
  });

  it("refuse un élève archivé", async () => {
    const record = await eleve({ archive: true });
    const result = await authenticate(
      { email: "sam@exemple.be", password: "motdepasse8" },
      { findCoach: aucunCoach, findEleve: async () => record },
    );
    expect(result).toBeNull();
  });

  it("refuse un mauvais mot de passe", async () => {
    const record = await eleve();
    const result = await authenticate(
      { email: "sam@exemple.be", password: "mauvais!!" },
      { findCoach: aucunCoach, findEleve: async () => record },
    );
    expect(result).toBeNull();
  });

  it("cherche l'élève avec l'email en minuscules", async () => {
    const recherches: string[] = [];
    await authenticate(
      { email: "Sam@Exemple.BE", password: "motdepasse8" },
      {
        findCoach: aucunCoach,
        findEleve: async (email) => {
          recherches.push(email);
          return null;
        },
      },
    );
    expect(recherches).toEqual(["sam@exemple.be"]);
  });
});
