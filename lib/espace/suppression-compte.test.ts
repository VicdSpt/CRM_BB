import { describe, it, expect } from "vitest";
import {
  CONFIRMATION_SUPPRESSION,
  DONNEES_ANONYMISEES,
  confirmationValide,
  modeSuppression,
} from "./suppression-compte";

describe("modeSuppression", () => {
  it("supprime la fiche d'un élève sans aucun historique", () => {
    expect(modeSuppression({ participations: 0, packs: 0, paiements: 0 })).toBe("supprimer");
  });

  it("anonymise dès qu'il reste un cours, un pack ou un paiement", () => {
    expect(modeSuppression({ participations: 1, packs: 0, paiements: 0 })).toBe("anonymiser");
    expect(modeSuppression({ participations: 0, packs: 1, paiements: 0 })).toBe("anonymiser");
    expect(modeSuppression({ participations: 0, packs: 0, paiements: 1 })).toBe("anonymiser");
  });
});

describe("DONNEES_ANONYMISEES", () => {
  it("efface toutes les données personnelles et ferme le compte", () => {
    expect(DONNEES_ANONYMISEES).toEqual({
      prenom: "Élève",
      nom: "supprimé",
      email: null,
      telephone: null,
      adresse: null,
      notes: null,
      motDePasse: null,
      statutCompte: "AUCUN",
      archive: true,
      inscriptionPrenom: null,
      inscriptionNom: null,
      inscriptionTelephone: null,
    });
  });
});

describe("confirmationValide", () => {
  it("accepte le mot de confirmation, sans tenir compte de la casse ni des espaces", () => {
    expect(confirmationValide(CONFIRMATION_SUPPRESSION)).toBe(true);
    expect(confirmationValide("  supprimer ")).toBe(true);
  });

  it("refuse tout autre texte", () => {
    expect(confirmationValide("")).toBe(false);
    expect(confirmationValide("oui")).toBe(false);
    expect(confirmationValide(null)).toBe(false);
  });
});
