import { describe, it, expect } from "vitest";
import { decoderFlash, encoderFlash } from "./flash";

describe("message flash", () => {
  it("encode puis décode le message, son identifiant et son ton (succès par défaut)", () => {
    const valeur = encoderFlash("Élève archivé", 1730000000000);
    expect(decoderFlash(valeur)).toEqual({
      id: "1730000000000",
      ton: "succes",
      message: "Élève archivé",
    });
  });

  it("transporte le ton « alerte » des suppressions et annulations", () => {
    const valeur = encoderFlash("Séance supprimée.", 1, "alerte");
    expect(decoderFlash(valeur)).toEqual({ id: "1", ton: "alerte", message: "Séance supprimée." });
  });

  it("garde les caractères spéciaux du message (accents, |, ;)", () => {
    const valeur = encoderFlash("Payé | 50 € ; ok", 1);
    expect(valeur).not.toMatch(/[;\s]/);
    expect(decoderFlash(valeur)?.message).toBe("Payé | 50 € ; ok");
  });

  it("ignore un cookie absent, vide ou mal formé", () => {
    expect(decoderFlash(undefined)).toBeNull();
    expect(decoderFlash("")).toBeNull();
    expect(decoderFlash("pas-de-separateur")).toBeNull();
    expect(decoderFlash("123|succes|")).toBeNull();
    expect(decoderFlash("123|inconnu|Bonjour")).toBeNull();
    expect(decoderFlash("123|succes|%E0%A4%A")).toBeNull();
  });
});
