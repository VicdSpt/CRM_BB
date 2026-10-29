import type { NextConfig } from "next";

const enDev = process.env.NODE_ENV === "development";

// Politique de contenu : uniquement les ressources du site lui-même.
// 'unsafe-inline' reste nécessaire pour les scripts injectés par Next.js et par le thème
// clair/sombre ; 'unsafe-eval' et les websockets ne servent qu'au rechargement à chaud en dev.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${enDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${enDev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  // Connexion Google : le formulaire part vers Auth.js, qui redirige vers Google.
  "form-action 'self' https://accounts.google.com",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // L'app n'utilise pas next/image : on désactive l'optimisation d'images, ce qui
  // retire une surface d'attaque (cf. failles du point d'accès /_next/image).
  images: { unoptimized: true },
  // Ne pas annoncer la technologie utilisée (en-tête X-Powered-By).
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          // Interdit l'affichage du site dans une iframe (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
