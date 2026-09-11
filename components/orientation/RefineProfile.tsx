"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Compass, Loader2 } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { INTERESTS } from "@/lib/orientation/interests";
import { cn } from "@/lib/cn";

type Status = "idle" | "saving" | "saved" | "error";

/**
 * Champs complémentaires : ville, centres d'intérêt et catégorie de diplôme.
 * Les trois entrent dans le score ET filtrent la liste.
 *
 * Le budget a été retiré : la table des frais est vide et aucun montant n'est
 * publié par la source, donc le champ ne pouvait ni filtrer ni pondérer.
 */
export function RefineProfile({
  cities,
  categories,
  onApply,
  applying,
  active,
  filterEnabled,
  onToggleFilter,
  matchCount,
}: {
  cities: string[];
  categories: string[];
  onApply: (preferences: {
    city: string | null;
    interests: string[];
    categorie: string | null;
  }) => void;
  applying?: boolean;
  /** Critères actuellement appliqués, pour le résumé replié. */
  active: { city: string | null; interests: string[]; categorie: string | null };
  filterEnabled: boolean;
  onToggleFilter: (on: boolean) => void;
  /** Nombre de formations retenues par le filtre, si actif. */
  matchCount: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [interests, setInterests] = useState<string[]>(active.interests);
  const [city, setCity] = useState(active.city ?? "");
  const [categorie, setCategorie] = useState(active.categorie ?? "");
  const [status, setStatus] = useState<Status>("idle");

  const hasActive =
    Boolean(active.city) ||
    active.interests.length > 0 ||
    Boolean(active.categorie);

  function toggle(interest: string) {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
    setStatus("idle");
  }

  async function save() {
    setStatus("saving");
    try {
      const res = await fetch("/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interests: interests.length > 0 ? interests : undefined,
          city: city || undefined,
        }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
    // Le recalcul ne dépend pas de la réussite de l'enregistrement : les
    // préférences sont dans l'état local, les résultats doivent bouger même
    // si la sauvegarde du profil échoue.
    onApply({ city: city || null, interests, categorie: categorie || null });
    setOpen(false);
  }

  if (!open) {
    return (
      <div className="flex w-full flex-col items-center gap-3 rounded-panel border border-glass-border bg-glass-1 p-4 sm:flex-row sm:justify-between sm:p-5">
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <span className="text-sm font-medium">
            {hasActive ? "Profil affiné" : "Affiner mon profil"}
          </span>
          <span className="text-xs leading-relaxed text-muted">
            {hasActive ? (
              <>
                {[
                  active.city ? `ville : ${active.city}` : null,
                  active.interests.length
                    ? `intérêts : ${active.interests.join(", ")}`
                    : null,
                  active.categorie ? `catégorie : ${active.categorie}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                {filterEnabled && matchCount !== null
                  ? ` — ${matchCount} formation${matchCount > 1 ? "s" : ""} retenue${matchCount > 1 ? "s" : ""}`
                  : " — filtre désactivé"}
              </>
            ) : (
              "Ville, centres d'intérêt et catégorie : ils filtrent les résultats, pas seulement leur ordre."
            )}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {hasActive && (
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={filterEnabled}
                onChange={(e) => onToggleFilter(e.target.checked)}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              Filtrer
            </label>
          )}
          <GlassButton variant="secondary" onClick={() => setOpen(true)}>
            <Compass className="h-4 w-4" aria-hidden />
            {hasActive ? "Modifier" : "Choisir mes critères"}
          </GlassButton>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-step-in rounded-panel border border-glass-border bg-glass-1 p-5 text-left sm:p-6">
      <h3 className="font-semibold">Affiner mon profil</h3>
      <p className="mt-1 text-sm text-muted">
        La ville, les centres d&apos;intérêt et la catégorie{" "}
        <strong className="text-foreground">filtrent</strong> les résultats
        ci-dessous : seules les formations qui y répondent restent affichées.
        Le score, lui, continue de les classer.{" "}
        <Link
          href="/orientation/score"
          className="rounded text-secondary outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
        >
          Comment calculons-nous ce score&nbsp;?
        </Link>
      </p>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium">Centres d&apos;intérêt</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {INTERESTS.map((interest) => {
            const active = interests.includes(interest);
            return (
              <button
                key={interest}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(interest)}
                className={cn(
                  "rounded-pill border px-3 py-1.5 text-sm outline-none transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:ring-primary",
                  active
                    ? "border-primary/40 bg-primary/20 text-foreground"
                    : "border-glass-border bg-glass-1 text-muted hover:border-glass-border-hover hover:text-foreground"
                )}
              >
                {interest}
              </button>
            );
          })}
        </div>
        {/* Dire sur quoi porte la recherche évite de prendre un résultat
            vide pour un filtre cassé. */}
        <p className="mt-3 text-xs leading-relaxed text-muted-dark">
          La correspondance est cherchée dans l&apos;intitulé de la formation
          et dans les métiers auxquels elle mène. Ne rien cocher n&apos;écarte
          rien.
        </p>
      </fieldset>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="refine-city" className="text-sm font-medium">
            Ville souhaitée
          </label>
          <div className="mt-2">
            <GlassSelect
              id="refine-city"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setStatus("idle");
              }}
            >
              <option value="">Peu importe</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </GlassSelect>
          </div>
        </div>

        <div>
          <label htmlFor="refine-categorie" className="text-sm font-medium">
            Catégorie de diplôme
          </label>
          <div className="mt-2">
            <GlassSelect
              id="refine-categorie"
              value={categorie}
              onChange={(e) => {
                setCategorie(e.target.value);
                setStatus("idle");
              }}
            >
              <option value="">Peu importe</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </GlassSelect>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <GlassButton
          variant="primary"
          onClick={save}
          disabled={status === "saving" || applying}
        >
          {(status === "saving" || applying) && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          )}
          {applying
            ? "Recalcul..."
            : status === "saving"
              ? "Enregistrement..."
              : "Appliquer et filtrer"}
        </GlassButton>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-button px-3 py-2 text-sm text-muted outline-none transition-colors duration-150 ease-out hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
        >
          Annuler
        </button>

        {status === "saved" && (
          <span
            className="inline-flex items-center gap-1.5 text-sm text-success"
            role="status"
          >
            <Check className="h-4 w-4" aria-hidden />
            Profil enregistré et résultats reclassés
          </span>
        )}
        {status === "error" && (
          <span className="text-sm text-error" role="alert">
            L&apos;enregistrement a échoué. Réessaie plus tard.
          </span>
        )}
      </div>
    </div>
  );
}
