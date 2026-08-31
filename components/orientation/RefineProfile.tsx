"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Compass, Loader2 } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { cn } from "@/lib/cn";

const INTERESTS = [
  "Santé",
  "Ingénierie",
  "Informatique",
  "Économie et gestion",
  "Droit",
  "Lettres et langues",
  "Sciences sociales",
  "Agronomie",
  "Enseignement",
  "Mines et géologie",
];

type Status = "idle" | "saving" | "saved" | "error";

/**
 * Champs complémentaires. Ville et intérêts entrent dans le score et
 * relancent le calcul à l'enregistrement ; le budget est collecté mais ne
 * peut rien pondérer tant qu'aucun frais n'est enregistré en base — c'est dit
 * dans l'interface plutôt que laissé croire.
 */
export function RefineProfile({
  cities,
  onApply,
  applying,
}: {
  cities: string[];
  onApply: (preferences: { city: string | null; interests: string[] }) => void;
  applying?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [budget, setBudget] = useState("");
  const [status, setStatus] = useState<Status>("idle");

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
    const budgetValue = Number(budget.replace(/\s/g, "").replace(",", "."));
    try {
      const res = await fetch("/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interests: interests.length > 0 ? interests : undefined,
          city: city || undefined,
          budget:
            budget.trim() !== "" && !Number.isNaN(budgetValue)
              ? budgetValue
              : undefined,
        }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
    // Le recalcul ne dépend pas de la réussite de l'enregistrement : les
    // préférences sont dans l'état local, les résultats doivent bouger même
    // si la sauvegarde du profil échoue.
    onApply({ city: city || null, interests });
  }

  if (!open) {
    return (
      <GlassButton variant="secondary" onClick={() => setOpen(true)}>
        <Compass className="h-4 w-4" aria-hidden />
        Affiner mon profil
      </GlassButton>
    );
  }

  return (
    <div className="w-full animate-step-in rounded-panel border border-glass-border bg-glass-1 p-5 text-left sm:p-6">
      <h3 className="font-semibold">Affiner mon profil</h3>
      <p className="mt-1 text-sm text-muted">
        La ville et les centres d&apos;intérêt entrent dans le score et
        reclassent les résultats ci-dessus.{" "}
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
          <label htmlFor="refine-budget" className="text-sm font-medium">
            Budget annuel maximum (GNF)
          </label>
          <div className="mt-2">
            <GlassInput
              id="refine-budget"
              type="number"
              inputMode="numeric"
              min={0}
              value={budget}
              onChange={(e) => {
                setBudget(e.target.value);
                setStatus("idle");
              }}
              placeholder="Ex : 500000"
              aria-describedby="refine-budget-help"
            />
            {/* La table des frais est vide : aucun montant n'est enregistré,
                le budget ne peut donc rien filtrer ni pondérer. Le dire vaut
                mieux que de laisser croire qu'il compte. */}
            <p id="refine-budget-help" className="mt-2 text-xs leading-relaxed text-muted-dark">
              Enregistré sur votre profil, mais sans effet sur le score :
              aucun frais de scolarité n&apos;est encore renseigné dans le
              catalogue.
            </p>
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
              : "Appliquer à mes résultats"}
        </GlassButton>

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
