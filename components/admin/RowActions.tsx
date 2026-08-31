"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { DeleteConfirmModal } from "@/components/admin/DeleteConfirmModal";

/**
 * Bloc d'actions d'une ligne, partagé par les 6 tables du back-office.
 *
 * Approuver / Rejeter ne sont proposés qu'aux admins, et seulement quand ils
 * changent quelque chose : pas de bouton « Approuver » sur une ligne déjà
 * approuvée. Supprimer est réservé aux admins, seul rôle couvert par la
 * policy admin_delete.
 */
export function RowActions({
  table,
  id,
  label,
  entityLabel,
  reviewStatus,
  isAdmin,
  editHref,
}: {
  table: string;
  id: string;
  label: string;
  entityLabel: string;
  reviewStatus: string;
  isAdmin: boolean;
  editHref: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "approve" | "reject">(null);
  const [error, setError] = useState<string | null>(null);

  async function moderate(action: "approve" | "reject") {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/admin/${table}/${id}/${action}`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `Échec (${res.status})`);
        setBusy(null);
        return;
      }
      router.refresh();
      setBusy(null);
    } catch {
      setError("Erreur réseau");
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href={editHref}
          className="rounded text-xs text-secondary outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
        >
          Modifier
        </Link>

        {isAdmin && reviewStatus !== "approved" && (
          <button
            type="button"
            onClick={() => moderate("approve")}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-button border border-success/30 bg-success/15 px-2.5 py-1 text-xs font-medium text-success outline-none transition-opacity duration-150 ease-out hover:opacity-80 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary"
          >
            {busy === "approve" ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            ) : (
              <Check className="h-3 w-3" aria-hidden />
            )}
            Approuver
          </button>
        )}

        {isAdmin && reviewStatus !== "rejected" && (
          <button
            type="button"
            onClick={() => moderate("reject")}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-button border border-warning/30 bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning outline-none transition-opacity duration-150 ease-out hover:opacity-80 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary"
          >
            {busy === "reject" ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            ) : (
              <X className="h-3 w-3" aria-hidden />
            )}
            Rejeter
          </button>
        )}

        {isAdmin && (
          <DeleteConfirmModal
            table={table}
            id={id}
            label={label}
            entityLabel={entityLabel}
            onDeleted={() => router.refresh()}
          />
        )}
      </div>
      {error && <span className="text-[11px] text-error">{error}</span>}
    </div>
  );
}
