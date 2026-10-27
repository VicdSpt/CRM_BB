import { describe, it, expect } from "vitest";
import { routeAutorisee } from "./roles";

describe("routeAutorisee", () => {
  it("laisse un visiteur non connecté sur les pages publiques", () => {
    expect(routeAutorisee("/login", null)).toEqual({ ok: true });
    expect(routeAutorisee("/inscription", null)).toEqual({ ok: true });
  });

  it("renvoie un visiteur non connecté vers /login", () => {
    expect(routeAutorisee("/", null)).toEqual({ redirect: "/login" });
    expect(routeAutorisee("/espace", null)).toEqual({ redirect: "/login" });
  });

  it("renvoie un utilisateur connecté des pages publiques vers son accueil", () => {
    expect(routeAutorisee("/login", "coach")).toEqual({ redirect: "/" });
    expect(routeAutorisee("/inscription", "eleve")).toEqual({ redirect: "/espace" });
  });

  it("interdit les pages coach à un élève", () => {
    expect(routeAutorisee("/finances", "eleve")).toEqual({ redirect: "/espace" });
    expect(routeAutorisee("/eleves/abc", "eleve")).toEqual({ redirect: "/espace" });
    expect(routeAutorisee("/", "eleve")).toEqual({ redirect: "/espace" });
  });

  it("autorise l'espace élève à un élève (préfixe strict)", () => {
    expect(routeAutorisee("/espace", "eleve")).toEqual({ ok: true });
    expect(routeAutorisee("/espace/profil", "eleve")).toEqual({ ok: true });
    expect(routeAutorisee("/espaceX", "eleve")).toEqual({ redirect: "/espace" });
  });

  it("renvoie le coach de l'espace élève vers son accueil", () => {
    expect(routeAutorisee("/espace", "coach")).toEqual({ redirect: "/" });
  });

  it("autorise les pages coach au coach", () => {
    expect(routeAutorisee("/planning", "coach")).toEqual({ ok: true });
    expect(routeAutorisee("/", "coach")).toEqual({ ok: true });
  });
});
