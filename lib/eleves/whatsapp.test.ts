import { describe, it, expect } from "vitest";
import { lienWhatsApp } from "./whatsapp";

describe("lienWhatsApp", () => {
  it("convertit un numéro belge national (0…) avec l'indicatif +32", () => {
    expect(lienWhatsApp("0470 12 34 56")).toBe("https://wa.me/32470123456");
    expect(lienWhatsApp("0470/12.34.56")).toBe("https://wa.me/32470123456");
  });

  it("garde un numéro déjà international (+ ou 00)", () => {
    expect(lienWhatsApp("+32 470 12 34 56")).toBe("https://wa.me/32470123456");
    expect(lienWhatsApp("0033 6 12 34 56 78")).toBe("https://wa.me/33612345678");
    expect(lienWhatsApp("+33 (0)6 12 34 56 78")).toBe("https://wa.me/33612345678");
  });

  it("ne fait pas de lien pour un numéro vide ou incompréhensible", () => {
    expect(lienWhatsApp(null)).toBeNull();
    expect(lienWhatsApp("")).toBeNull();
    expect(lienWhatsApp("pas de téléphone")).toBeNull();
    expect(lienWhatsApp("0470")).toBeNull();
  });
});
