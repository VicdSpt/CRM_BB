import { describe, it, expect } from "vitest";
import { forceMotDePasse, messageMotDePasseFaible, reglesMotDePasse } from "./force-mot-de-passe";

describe("reglesMotDePasse", () => {
  it("détecte chaque type de caractère", () => {
    expect(reglesMotDePasse("Abcdef1!")).toEqual({
      longueur: true,
      minuscule: true,
      majuscule: true,
      chiffre: true,
      symbole: true,
    });
  });

  it("signale ce qui manque", () => {
    expect(reglesMotDePasse("abc")).toEqual({
      longueur: false,
      minuscule: true,
      majuscule: false,
      chiffre: false,
      symbole: false,
    });
  });

  it("compte les lettres accentuées comme des lettres, pas comme des symboles", () => {
    expect(reglesMotDePasse("éÉ").minuscule).toBe(true);
    expect(reglesMotDePasse("éÉ").majuscule).toBe(true);
    expect(reglesMotDePasse("éÉ").symbole).toBe(false);
  });
});

describe("forceMotDePasse", () => {
  it("vaut 0 pour un champ vide", () => {
    expect(forceMotDePasse("")).toBe(0);
  });

  it("monte avec le nombre de règles respectées", () => {
    expect(forceMotDePasse("abc")).toBe(1); // 1 règle sur 5 : faible
    expect(forceMotDePasse("abc1")).toBe(1); // 2 règles : faible
    expect(forceMotDePasse("abcdefg1")).toBe(2); // 3 règles : moyen
    expect(forceMotDePasse("Abcdefg1")).toBe(3); // 4 règles : bon
    expect(forceMotDePasse("Abcdef1!")).toBe(4); // 5 règles : fort
  });
});

describe("messageMotDePasseFaible", () => {
  it("ne renvoie rien quand toutes les règles sont respectées", () => {
    expect(messageMotDePasseFaible("Abcdef1!")).toBeNull();
  });

  it("liste ce qui manque", () => {
    expect(messageMotDePasseFaible("abcdefg1")).toBe(
      "Mot de passe trop faible : il manque une majuscule et un symbole.",
    );
  });

  it("liste tous les manques, longueur comprise", () => {
    expect(messageMotDePasseFaible("abc")).toBe(
      "Mot de passe trop faible : il manque au moins 8 caractères, une majuscule, un chiffre et un symbole.",
    );
  });
});
