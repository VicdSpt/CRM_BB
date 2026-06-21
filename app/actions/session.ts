"use server";

import { signOut } from "@/auth";

export async function deconnexion(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
