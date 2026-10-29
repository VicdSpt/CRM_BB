import { describe, it, expect } from "vitest";
import {
  empreinteIp,
  ipDepuisEntetes,
  LIMITES,
  messageTropDeTentatives,
  verdictLimite,
} from "./limite";

const now = new Date(2026, 9, 29, 12, 0);
const ilYa = (minutes: number) => new Date(now.getTime() - minutes * 60_000);

describe("verdictLimite", () => {
  const limite = { max: 5, fenetreMinutes: 15 };

  it("laisse passer sous le seuil", () => {
    expect(verdictLimite([ilYa(1), ilYa(2), ilYa(3), ilYa(4)], limite, now)).toEqual({
      bloque: false,
    });
  });

  it("bloque au seuil, jusqu'à la sortie de la plus ancienne tentative de la fenêtre", () => {
    // La plus ancienne date de 3 min : elle sort de la fenêtre de 15 min dans 12 min.
    expect(verdictLimite([ilYa(1), ilYa(1), ilYa(2), ilYa(2), ilYa(3)], limite, now)).toEqual({
      bloque: true,
      minutesRestantes: 12,
    });
  });

  it("ignore les tentatives sorties de la fenêtre", () => {
    expect(verdictLimite([ilYa(16), ilYa(20), ilYa(30), ilYa(1), ilYa(2)], limite, now)).toEqual({
      bloque: false,
    });
  });

  it("annonce au moins 1 minute restante", () => {
    const presqueFini = [14.9, 14.9, 14.9, 14.9, 14.9].map(ilYa);
    expect(verdictLimite(presqueFini, limite, now)).toEqual({ bloque: true, minutesRestantes: 1 });
  });
});

describe("LIMITES", () => {
  it("reprend les seuils validés", () => {
    expect(LIMITES.connexionEmail).toEqual({ max: 5, fenetreMinutes: 15 });
    expect(LIMITES.connexionIp).toEqual({ max: 20, fenetreMinutes: 15 });
    expect(LIMITES.inscriptionIp).toEqual({ max: 5, fenetreMinutes: 60 });
  });
});

describe("messageTropDeTentatives", () => {
  it("donne le temps d'attente", () => {
    expect(messageTropDeTentatives(12)).toBe("Trop de tentatives. Réessaie dans 12 minutes.");
  });

  it("accorde au singulier", () => {
    expect(messageTropDeTentatives(1)).toBe("Trop de tentatives. Réessaie dans 1 minute.");
  });
});

describe("empreinteIp", () => {
  it("est stable pour une même IP et ne contient pas l'IP en clair", () => {
    const a = empreinteIp("203.0.113.7", "secret");
    expect(a).toBe(empreinteIp("203.0.113.7", "secret"));
    expect(a).not.toContain("203.0.113.7");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("diffère d'une IP à l'autre", () => {
    expect(empreinteIp("203.0.113.7", "secret")).not.toBe(empreinteIp("203.0.113.8", "secret"));
  });
});

describe("ipDepuisEntetes", () => {
  it("prend la première adresse de x-forwarded-for (celle du visiteur)", () => {
    const h = new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    expect(ipDepuisEntetes(h)).toBe("203.0.113.7");
  });

  it("se rabat sur x-real-ip, puis sur une valeur fixe", () => {
    expect(ipDepuisEntetes(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(ipDepuisEntetes(new Headers())).toBe("inconnue");
  });
});
