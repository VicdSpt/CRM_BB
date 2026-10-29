import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { googleActif } from "@/auth";
import { estCodeErreurGoogle, MESSAGES_ERREUR_GOOGLE } from "@/lib/auth/connexion-google";
import { loginGoogle } from "./actions";
import { LoginForm } from "./login-form";

export { type LoginState } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  const messageGoogle = estCodeErreurGoogle(erreur) ? MESSAGES_ERREUR_GOOGLE[erreur] : null;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Connexion</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {messageGoogle ? (
            <p
              role="alert"
              className="rounded-md border border-red-500/40 p-3 text-sm text-red-600"
            >
              {messageGoogle}
            </p>
          ) : null}
          <LoginForm />
          {googleActif ? (
            <>
              <div className="text-muted-foreground flex items-center gap-3 text-xs">
                <span className="bg-border h-px flex-1" />
                ou
                <span className="bg-border h-px flex-1" />
              </div>
              <form action={loginGoogle}>
                <Button type="submit" variant="outline" className="w-full">
                  <LogoGoogle />
                  Continuer avec Google
                </Button>
              </form>
              <p className="text-muted-foreground -mt-2 text-center text-xs">
                Pour les élèves ayant déjà un compte avec la même adresse Gmail.
              </p>
            </>
          ) : null}
          <p className="text-muted-foreground text-center text-sm">
            Pas encore de compte ?{" "}
            <Link href="/inscription" className="text-primary underline">
              Créer un compte élève
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

// Logo « G » officiel de Google (couleurs imposées par sa charte).
function LogoGoogle() {
  return (
    <svg viewBox="0 0 48 48" className="size-4" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
