import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import { estDoublonUnique } from "./prisma-erreurs";

const erreurPrisma = (code: string) =>
  new Prisma.PrismaClientKnownRequestError("erreur", { code, clientVersion: "test" });

describe("estDoublonUnique", () => {
  it("reconnaît une violation de contrainte d'unicité (P2002)", () => {
    expect(estDoublonUnique(erreurPrisma("P2002"))).toBe(true);
  });

  it("ignore les autres erreurs Prisma", () => {
    expect(estDoublonUnique(erreurPrisma("P2025"))).toBe(false);
  });

  it("ignore les erreurs ordinaires", () => {
    expect(estDoublonUnique(new Error("boum"))).toBe(false);
  });
});
