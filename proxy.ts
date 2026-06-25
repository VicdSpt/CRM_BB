import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Anciennement `middleware.ts` (déprécié en Next 16, renommé en `proxy`).
export const { auth: proxy } = NextAuth(authConfig);

export default proxy;

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
