import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password helpers", () => {
  it("hache un mot de passe et le hash diffère du clair", async () => {
    const hash = await hashPassword("secret123");
    expect(hash).not.toBe("secret123");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("vérifie un mot de passe correct", async () => {
    const hash = await hashPassword("secret123");
    expect(await verifyPassword("secret123", hash)).toBe(true);
  });

  it("rejette un mot de passe incorrect", async () => {
    const hash = await hashPassword("secret123");
    expect(await verifyPassword("mauvais", hash)).toBe(false);
  });
});
