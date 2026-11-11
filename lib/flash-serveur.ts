import { cookies } from "next/headers";
import { COOKIE_FLASH, encoderFlash, type TonFlash } from "@/lib/flash";

// À appeler dans une Server Action réussie : Next réaffiche la page (ou la cible
// d'un redirect) et le layout montre le message, puis le navigateur efface le cookie.
// Lisible côté client (pas httpOnly) : il ne contient qu'un texte de confirmation.
// Ton « alerte » (rouge) pour une suppression ou une annulation, « succes » (vert) sinon.
export async function flash(message: string, ton: TonFlash = "succes"): Promise<void> {
  (await cookies()).set(COOKIE_FLASH, encoderFlash(message, Date.now(), ton), {
    path: "/",
    maxAge: 10,
    sameSite: "lax",
  });
}
