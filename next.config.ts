import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Les logos et photos d'établissement sont servis par Supabase Storage
    // (bucket public institution-images). Sans cette autorisation, next/image
    // refuse l'URL distante et la balise échoue à l'exécution — ce qui ne se
    // voyait pas tant que logo_url était NULL partout.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ouidfjfgwbpbbnqhhkil.supabase.co",
        pathname: "/storage/v1/object/public/institution-images/**",
      },
    ],
  },
};

export default nextConfig;
