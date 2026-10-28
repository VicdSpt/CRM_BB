import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export { type LoginState } from "./actions";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Connexion</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <LoginForm />
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
