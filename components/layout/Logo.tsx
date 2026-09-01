import Image from "next/image";
import logoMark from "@/public/logo-mark.png";
import { cn } from "@/lib/cn";

/**
 * Marque Orientis : symbole + mot-symbole.
 *
 * Le logo est un SYMBOLE seul (épingle de carte et ruban), sans texte. Le mot
 * « Orientis » reste donc affiché à côté partout où la marque doit être
 * lisible — le symbole seul n'identifie rien pour un premier visiteur.
 * `withWordmark={false}` est réservé aux emplacements contraints en largeur.
 *
 * La source est `logo-mark.png` (128 px, 17 ko) et non l'original de 1254 px
 * (962 ko) : à 28-40 px d'affichage, même sur écran à forte densité, le 128 px
 * suffit. Sur la connexion instable que vise le projet, la différence compte.
 */
export function Logo({
  size = 32,
  withWordmark = true,
  className,
  textClassName,
  priority = false,
}: {
  size?: number;
  withWordmark?: boolean;
  className?: string;
  textClassName?: string;
  priority?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src={logoMark}
        alt={withWordmark ? "" : "Orientis"}
        width={size}
        height={size}
        priority={priority}
        className="shrink-0"
        // Le symbole est déjà transparent et calibré : pas de recadrage.
        style={{ width: size, height: size }}
      />
      {withWordmark && (
        <span
          className={cn(
            "bg-linear-to-r from-primary to-secondary bg-clip-text font-bold tracking-tight text-transparent",
            textClassName ?? "text-lg"
          )}
        >
          Orientis
        </span>
      )}
    </span>
  );
}
