import Image from "next/image";
import type { InstitutionPhoto } from "@/lib/queries/institution-detail";

/**
 * Galerie de la fiche établissement.
 *
 * Ne rend rien du tout quand il n'y a aucune photo : pas de section vide, pas
 * de titre orphelin. Les vignettes sont en `object-cover` sur un ratio fixe
 * pour que la grille ne bouge pas pendant le chargement — important sur
 * connexion instable.
 */
export function PhotoGallery({ photos }: { photos: InstitutionPhoto[] }) {
  if (photos.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-bold tracking-tight">
        Photos{" "}
        <span className="text-sm font-normal text-muted">
          ({photos.length})
        </span>
      </h2>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => (
          <li key={photo.id} className="flex flex-col gap-2">
            {/* Pas de backdrop-filter : grille d'images, fond plat. */}
            <div className="relative aspect-video overflow-hidden rounded-card border border-glass-border bg-glass-1">
              <Image
                src={photo.url}
                alt={photo.caption ?? ""}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
            {photo.caption && (
              <p className="text-xs leading-relaxed text-muted">
                {photo.caption}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
