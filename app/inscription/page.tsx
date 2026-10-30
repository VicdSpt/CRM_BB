import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InscriptionForm } from "./inscription-form";

export default function InscriptionPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Crée ton compte</CardTitle>
          <CardDescription>
            Ton coach validera ton inscription avant que tu accèdes aux cours.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <InscriptionForm />
          <p className="text-muted-foreground text-center text-sm">
            Déjà inscrit ?{" "}
            <Link href="/login" className="text-primary underline">
              Se connecter
            </Link>
          </p>
          <p className="text-muted-foreground text-center text-xs">
            Tes données servent uniquement à la gestion de tes cours :{" "}
            <Link href="/confidentialite" className="underline">
              politique de confidentialité
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
