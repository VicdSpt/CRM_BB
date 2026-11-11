import type { Metadata } from "next";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { requireCoach } from "@/lib/auth/require-coach";
import { lienInscription } from "@/lib/eleves/invitation";
import { BoutonRetour } from "@/components/bouton-retour";
import { PartageInvitation } from "./partage-invitation";

export const metadata: Metadata = { title: "Inviter un élève" };

// Le coach invite un élève : QR code à scanner (à afficher ou imprimer) et lien à envoyer,
// tous deux vers la page d'inscription. L'adresse vient de la requête, pas du code.
export default async function InviterElevePage() {
  await requireCoach();
  const h = await headers();
  const lien = lienInscription({
    host: h.get("host"),
    forwardedHost: h.get("x-forwarded-host"),
    forwardedProto: h.get("x-forwarded-proto"),
  });

  // Image PNG en data URL : affichée à l'écran et téléchargeable telle quelle.
  const qr = lien
    ? await QRCode.toDataURL(lien, { width: 1024, margin: 2, errorCorrectionLevel: "M" })
    : null;

  return (
    <main className="mx-auto w-full max-w-md p-4">
      <BoutonRetour href="/eleves">Élèves</BoutonRetour>
      <h1 className="mt-4 mb-1 text-2xl font-semibold">Inviter un élève</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        L&apos;élève scanne le QR code avec l&apos;appareil photo de son téléphone, ou ouvre le
        lien, puis crée son compte. Tu le valides ensuite dans « À valider ».
      </p>

      {lien && qr ? (
        <>
          <div className="mb-6 rounded-2xl border bg-white p-4 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element -- image générée (data URL) */}
            <img
              src={qr}
              alt="QR code vers la page d'inscription"
              className="mx-auto aspect-square w-full max-w-72"
            />
          </div>
          <PartageInvitation lien={lien} qr={qr} />
        </>
      ) : (
        <p className="text-sm text-red-600">Impossible de déterminer l&apos;adresse du site.</p>
      )}
    </main>
  );
}
