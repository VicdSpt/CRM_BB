"use client";

import { useSyncExternalStore } from "react";
import { Copy, Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const MESSAGE = "Crée ton compte pour réserver tes cours de boxe :";

const sansAbonnement = () => () => {};
// Le partage natif (WhatsApp, SMS…) n'existe que sur certains appareils, surtout mobiles.
const partageDisponible = () => typeof navigator.share === "function";

// Lien d'inscription à copier, partager ou télécharger en QR code (image PNG).
export function PartageInvitation({ lien, qr }: { lien: string; qr: string }) {
  const peutPartager = useSyncExternalStore(sansAbonnement, partageDisponible, () => false);

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(lien);
      toast.success("Lien copié.");
    } catch {
      toast.error("Copie impossible : sélectionne le lien à la main.");
    }
  };

  const partager = async () => {
    try {
      await navigator.share({ title: "Inscription", text: MESSAGE, url: lien });
    } catch {
      // Partage annulé par l'utilisateur : rien à signaler.
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Lien d&apos;inscription</span>
        <p className="bg-muted rounded-md px-3 py-2 font-mono text-sm break-all select-all">
          {lien}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={copier}>
          <Copy className="size-4" /> Copier le lien
        </Button>
        {peutPartager ? (
          <Button type="button" variant="outline" onClick={partager}>
            <Share2 className="size-4" /> Partager
          </Button>
        ) : null}
        <Button
          variant="outline"
          nativeButton={false}
          render={<a href={qr} download="inscription-qr-code.png" />}
        >
          <Download className="size-4" /> Télécharger le QR code
        </Button>
      </div>
    </div>
  );
}
