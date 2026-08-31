"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

/**
 * Actions d'une ligne source.
 *
 * Le bouton Supprimer n'est pas affiché quand la source est référencée : la
 * suppression serait refusée de toute façon (clé étrangère en
 * `on delete restrict`), autant le dire avant le clic plutôt qu'après.
 */
export function SourceRowActions({
  id,
  label,
  referenceCount,
  isAdmin,
}: {
  id: string;
  label: string;
  referenceCount: number;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function remove() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/sources/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `Échec (${res.status})`);
        setPending(false);
        setConfirming(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Erreur réseau");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center justify-end gap-3">
        {isAdmin && (
          <Link
            href={`/admin/sources/${id}/modifier`}
            className="rounded text-xs text-secondary outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
          >
            Modifier
          </Link>
        )}

        {isAdmin && referenceCount === 0 && !confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-1.5 rounded-button border border-error/30 bg-error/10 px-2.5 py-1 text-xs font-medium text-error outline-none transition-opacity duration-150 ease-out hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Trash2 className="h-3 w-3" aria-hidden />
            Supprimer
          </button>
        )}

        {confirming && (
          <span className="flex items-center gap-2">
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-button bg-error px-2.5 py-1 text-xs font-semibold text-white outline-none transition-opacity duration-150 ease-out hover:opacity-90 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary"
            >
              {pending && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
              Confirmer
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="rounded text-xs text-muted outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
            >
              Annuler
            </button>
          </span>
        )}

        {isAdmin && referenceCount > 0 && (
          <span
            className="text-xs text-muted-dark"
            title={`${label} est utilisée par ${referenceCount} ligne(s) du catalogue`}
          >
            utilisée · non supprimable
          </span>
        )}
      </div>
      {error && <span className="max-w-xs text-right text-[11px] text-error">{error}</span>}
    </div>
  );
}
