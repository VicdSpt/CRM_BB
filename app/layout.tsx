import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppShell } from "@/components/app-shell";
import { auth } from "@/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRM-BB",
  description: "CRM pour coach sportif — rendez-vous, élèves, finances.",
};

// viewportFit "cover" : nécessaire pour que env(safe-area-inset-*) fonctionne
// sur iPhone (barre d'onglets au-dessus de la barre d'accueil iOS).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Le rôle choisit le menu (coach ou élève), quelle que soit l'URL affichée.
  const session = await auth();
  const role = session?.user?.role ?? null;

  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppShell role={role}>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
