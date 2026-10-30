import { describe, it, expect } from "vitest";
import { nomFichierSauvegarde, urlProdDepuisEnv } from "./sauvegarde";

const HOTE = "ep-prod-123.eu.aws.neon.tech";

describe("urlProdDepuisEnv", () => {
  it("trouve l'URL de prod dans la ligne DATABASE_URL commentée", () => {
    const env = [
      `# DATABASE_URL="postgresql://u:p@${HOTE}/db?sslmode=require"`,
      `DATABASE_URL="postgresql://u:p@ep-dev-456.eu.aws.neon.tech/db"`,
    ].join("\n");
    expect(urlProdDepuisEnv(env, HOTE)).toBe(`postgresql://u:p@${HOTE}/db?sslmode=require`);
  });

  it("accepte une valeur sans guillemets et des fins de ligne Windows", () => {
    const env = `#DATABASE_URL=postgresql://u:p@${HOTE}/db\r\nTZ=Europe/Brussels\r\n`;
    expect(urlProdDepuisEnv(env, HOTE)).toBe(`postgresql://u:p@${HOTE}/db`);
  });

  it("ignore une ligne commentée qui ne pointe pas sur l'hôte de prod", () => {
    const env = `# DATABASE_URL="postgresql://u:p@ep-autre.neon.tech/db"`;
    expect(urlProdDepuisEnv(env, HOTE)).toBeNull();
  });

  it("refuse de deviner sans hôte de prod", () => {
    const env = `# DATABASE_URL="postgresql://u:p@${HOTE}/db"`;
    expect(urlProdDepuisEnv(env, "")).toBeNull();
  });
});

describe("nomFichierSauvegarde", () => {
  it("date le fichier à la minute, sans caractère interdit sous Windows", () => {
    expect(nomFichierSauvegarde(new Date("2026-10-30T09:05:00Z"), "prod")).toBe(
      "crm-bb-prod-2026-10-30_09-05.json",
    );
  });
});
