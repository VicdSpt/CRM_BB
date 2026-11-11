import { describe, it, expect } from "vitest";
import { lienInscription } from "./invitation";

describe("lienInscription", () => {
  it("reprend l'adresse du site derrière le proxy (Vercel)", () => {
    expect(
      lienInscription({
        host: "interne:3000",
        forwardedHost: "mon-site.example",
        forwardedProto: "https",
      }),
    ).toBe("https://mon-site.example/inscription");
  });

  it("utilise l'hôte de la requête en local, en http", () => {
    expect(lienInscription({ host: "localhost:3000" })).toBe("http://localhost:3000/inscription");
    expect(lienInscription({ host: "192.168.1.21:3000" })).toBe(
      "http://192.168.1.21:3000/inscription",
    );
  });

  it("passe en https par défaut pour un vrai nom de domaine", () => {
    expect(lienInscription({ host: "mon-site.example" })).toBe(
      "https://mon-site.example/inscription",
    );
  });

  it("ne garde que le premier hôte d'une liste et refuse un hôte absent", () => {
    expect(
      lienInscription({ forwardedHost: "a.example, b.example", forwardedProto: "https" }),
    ).toBe("https://a.example/inscription");
    expect(lienInscription({})).toBeNull();
  });
});
