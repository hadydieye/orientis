import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // metadataBase rend absolues les URL d'images sociales : sans elle, Next
  // avertit au build et les plateformes reçoivent un chemin relatif inutilisable.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "Orientis",
    template: "%s — Orientis",
  },
  description: "Orientation post-bac en Guinée",
  // app/icon.png, app/apple-icon.png, app/favicon.ico et
  // app/opengraph-image.png sont détectés automatiquement par l'App Router :
  // aucune déclaration manuelle de <link> ou de og:image n'est nécessaire.
  openGraph: {
    title: "Orientis",
    description:
      "Le catalogue des formations post-bac en Guinée : établissements, filières, conditions d'admission.",
    siteName: "Orientis",
    locale: "fr_GN",
    type: "website",
  },
};

// Racine minimale : le chrome public (navbar, aurora) vit dans (site)/layout,
// le back-office a le sien. Les deux ne partagent que la police et les tokens.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}
