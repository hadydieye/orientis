"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { cascadePhrase, type CascadeCounts } from "@/lib/admin/cascade-phrase";

/**
 * Modale de confirmation de suppression, partagée par les 6 tables.
 *
 * Les comptes en cascade sont récupérés à l'ouverture via
 * `GET /admin/cascade/:table/:id`, pas figés au rendu de la page : ce qui est
 * annoncé correspond à l'état de la base au moment où l'on confirme.
 */
export function DeleteConfirmModal({
  table,
  id,
  label,
  entityLabel,
  onDeleted,
}: {
  /** Table côté API (`academic_units`, `fees`, ...). */
  table: string;
  id: string;
  /** Nom lisible de la ligne, affiché dans la question. */
  label: string;
  /** « cette unité », « ce département »... */
  entityLabel: string;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<CascadeCounts | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, pending]);

  async function openModal() {
    setOpen(true);
    setError(null);
    setCounts(null);
    setLoadingCounts(true);
    try {
      const res = await fetch(`/admin/cascade/${table}/${id}`);
      setCounts(res.ok ? await res.json() : {});
    } catch {
      setCounts({});
    } finally {
      setLoadingCounts(false);
    }
  }

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/${table}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `Échec (${res.status})`);
        setPending(false);
        return;
      }
      setOpen(false);
      setPending(false);
      onDeleted();
    } catch {
      setError("Erreur réseau");
      setPending(false);
    }
  }

  const cascade = counts ? cascadePhrase(counts) : null;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-1.5 rounded-button border border-error/30 bg-error/10 px-2.5 py-1 text-xs font-medium text-error outline-none transition-opacity duration-150 ease-out hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Trash2 className="h-3 w-3" aria-hidden />
        Supprimer
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !pending) setOpen(false);
          }}
        >
          <div
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`del-title-${id}`}
            aria-describedby={`del-desc-${id}`}
            className="w-full max-w-md animate-[fade-in-up_0.2s_ease-out] rounded-modal border border-glass-border bg-background p-6 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-error/15 text-error">
                <AlertTriangle className="h-4.5 w-4.5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 id={`del-title-${id}`} className="text-base font-bold">
                  Supprimer {entityLabel} ?
                </h2>
                <p className="mt-1 break-words text-sm text-muted">{label}</p>
              </div>
            </div>

            <div id={`del-desc-${id}`} className="mt-4 text-sm leading-relaxed">
              {loadingCounts ? (
                <p className="flex items-center gap-2 text-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Calcul des lignes liées...
                </p>
              ) : cascade ? (
                <p className="rounded-card border border-error/30 bg-error/10 p-3 text-error">
                  Cette suppression entraînera aussi celle de{" "}
                  <strong>{cascade}</strong>, par cascade en base.
                </p>
              ) : (
                <p className="rounded-card border border-glass-border bg-glass-2 p-3 text-muted">
                  Aucune ligne liée : la suppression ne touchera que cette
                  entrée.
                </p>
              )}
              <p className="mt-3 text-muted">Cette action est irréversible.</p>
            </div>

            {error && (
              <p
                role="alert"
                className="mt-3 rounded-card border border-error/30 bg-error/10 p-3 text-sm text-error"
              >
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded-button px-3 py-2 text-sm text-muted outline-none transition-colors duration-150 ease-out hover:text-foreground disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={pending || loadingCounts}
                className="inline-flex items-center gap-2 rounded-button bg-error px-4 py-2 text-sm font-semibold text-white outline-none transition-opacity duration-150 ease-out hover:opacity-90 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {pending ? "Suppression..." : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
