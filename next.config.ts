import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // L'app n'utilise pas next/image : on désactive l'optimisation d'images, ce qui
  // retire une surface d'attaque (cf. failles du point d'accès /_next/image).
  images: { unoptimized: true },
};

export default nextConfig;
