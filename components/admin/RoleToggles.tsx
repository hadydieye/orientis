"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, X } from "lucide-react";

const ROLES = ["admin", "contributeur"] as const;
type Role = (typeof ROLES)[number];

/**
 * Un bouton bascule par rôle.
 *
 * L'état est porté par le serveur : après chaque action on rafraîchit plutôt
 * que de deviner localement. Le refus du dernier admin arrive en 409 avec son
 * message, affiché tel quel sous la ligne — c'est le serveur qui sait combien
 * d'admins il reste, pas le client.
 */
export function RoleToggles({
  userId,
  email,
  roles,
  isSelf,
}: {
  userId: string;
  email: string | null;
  roles: string[];
  isSelf: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(role: Role, has: boolean) {
    setBusy(role);
    setError(null);
    try {
      const res = has
        ? await fetch(`/admin/users/${userId}/roles/${role}`, { method: "DELETE" })
        : await fetch(`/admin/users/${userId}/roles`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role }),
          });

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
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {ROLES.map((role) => {
          const has = roles.includes(role);
          return (
            <button
              key={role}
              type="button"
              onClick={() => toggle(role, has)}
              disabled={busy !== null}
              aria-pressed={has}
              aria-label={`${has ? "Retirer" : "Attribuer"} le rôle ${role}${email ? ` à ${email}` : ""}`}
              className={
                has
                  ? "inline-flex items-center gap-1.5 rounded-pill border border-primary/40 bg-primary/20 px-3 py-1.5 text-xs font-medium text-foreground outline-none transition-colors duration-150 ease-out hover:border-error/40 hover:bg-error/15 hover:text-error disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary"
                  : "inline-flex items-center gap-1.5 rounded-pill border border-glass-border bg-background px-3 py-1.5 text-xs text-muted outline-none transition-colors duration-150 ease-out hover:border-success/40 hover:bg-success/15 hover:text-success disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary"
              }
            >
              {busy === role ? (
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              ) : has ? (
                <Check className="h-3 w-3" aria-hidden />
              ) : (
                <Plus className="h-3 w-3" aria-hidden />
              )}
              {role}
            </button>
          );
        })}
      </div>

      {isSelf && (
        <span className="text-[11px] text-muted-dark">votre compte</span>
      )}

      {error && (
        <span
          role="alert"
          className="flex max-w-md items-start gap-1 text-right text-[11px] leading-relaxed text-error"
        >
          <X className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
          {error}
        </span>
      )}
    </div>
  );
}
