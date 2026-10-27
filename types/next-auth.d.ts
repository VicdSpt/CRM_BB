import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/auth/roles";

// Le rôle et l'id voyagent dans le JWT, puis dans la session.
declare module "next-auth" {
  interface User {
    role?: Role;
  }
  interface Session {
    user: { id: string; role?: Role } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
  }
}
