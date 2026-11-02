import { describe, it, expect } from "vitest";
import { decoderFlash, encoderFlash } from "./flash";

describe("message flash", () => {
  it("encode puis décode le message et son identifiant", () => {
    const valeur = encoderFlash("Élève archivé", 1730000000000);
    expect(decoderFlash(valeur)).toEqual({ id: "1730000000000", message: "Élève archivé" });
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
    expect(decoderFlash("123|")).toBeNull();
    expect(decoderFlash("123|%E0%A4%A")).toBeNull();
  });
});
