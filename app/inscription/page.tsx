import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InscriptionForm } from "./inscription-form";

export default function InscriptionPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Créer mon compte</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <InscriptionForm />
          <p className="text-muted-foreground text-center text-sm">
            Déjà inscrit ?{" "}
            <Link href="/login" className="text-primary underline">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
