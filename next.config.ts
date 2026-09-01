import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

/**
 * Hôtes autorisés à requêter le serveur de développement.
 *
 * Next bloque par défaut les requêtes cross-origin vers les ressources de dev
 * (`/_next/static/*`) : seul l'hôte d'initialisation (localhost) est accepté.
 * Ouvrir le site depuis un téléphone du réseau local envoie
 * `Origin: http://<ip-lan>:3000`, les chunks JS reviennent en 403, React
 * n'hydrate jamais — la page s'affiche mais AUCUN bouton ne répond.
 *
 * Les adresses IPv4 privées de la machine sont calculées au démarrage plutôt
 * qu'écrites en dur : elles changent avec le réseau (Wi-Fi, partage de
 * connexion), et une valeur figée redonnerait le même symptôme au prochain
 * changement d'IP.
 *
 * Sans effet en production : ce contrôle n'existe qu'en développement.
 */
function localNetworkHosts(): string[] {
  const hosts = new Set<string>(["localhost", "127.0.0.1"]);
  for (const addrs of Object.values(networkInterfaces())) {
    for (const a of addrs ?? []) {
      if (a.family === "IPv4" && !a.internal) hosts.add(a.address);
    }
  }
  return [...hosts];
}

const nextConfig: NextConfig = {
  allowedDevOrigins: localNetworkHosts(),
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
