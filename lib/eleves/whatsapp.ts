// Lien « wa.me » qui ouvre une conversation WhatsApp avec l'élève.
// Le téléphone est saisi librement : on le ramène au format international sans « + »
// ni séparateurs. Un numéro national (0…) prend l'indicatif belge par défaut.
const INDICATIF_PAR_DEFAUT = "32";

export function lienWhatsApp(telephone: string | null | undefined): string | null {
  if (!telephone) return null;
  // « +33 (0)6… » : le (0) national se retire avant le reste.
  let n = telephone.replace(/\(0\)/g, "").replace(/[\s./()-]/g, "");
  if (n.startsWith("+")) n = n.slice(1);
  else if (n.startsWith("00")) n = n.slice(2);
  else if (n.startsWith("0")) n = INDICATIF_PAR_DEFAUT + n.slice(1);
  // Norme E.164 : 15 chiffres au plus ; en dessous de 8, ce n'est pas un vrai numéro.
  if (!/^\d{8,15}$/.test(n)) return null;
  return `https://wa.me/${n}`;
}
