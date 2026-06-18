import { describe, it, expect } from "vitest";
import { authenticateCoach, credentialsSchema } from "./credentials";
import { hashPassword } from "./password";

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
});

describe("authenticateCoach", () => {
  it("renvoie l'utilisateur (sans hash) quand les identifiants sont valides", async () => {
    const hash = await hashPassword("bonmotdepasse");
    const find = async () => ({
      id: "c1",
      email: "coach@test.fr",
      motDePasse: hash,
      nom: "Coach",
    });
    const result = await authenticateCoach(
      { email: "coach@test.fr", password: "bonmotdepasse" },
      find,
    );
    expect(result).toEqual({ id: "c1", email: "coach@test.fr", nom: "Coach" });
  });

  it("renvoie null si le coach n'existe pas", async () => {
    const find = async () => null;
    const result = await authenticateCoach({ email: "absent@test.fr", password: "x" }, find);
    expect(result).toBeNull();
  });

  it("renvoie null si le mot de passe est faux", async () => {
    const hash = await hashPassword("bonmotdepasse");
    const find = async () => ({
      id: "c1",
      email: "coach@test.fr",
      motDePasse: hash,
      nom: "Coach",
    });
    const result = await authenticateCoach({ email: "coach@test.fr", password: "faux" }, find);
    expect(result).toBeNull();
  });

  it("renvoie null si l'entrée est malformée", async () => {
    const find = async () => null;
    const result = await authenticateCoach({ email: "x", password: "" }, find);
    expect(result).toBeNull();
  });
});
