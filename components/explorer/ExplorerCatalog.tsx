"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchX } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { InstitutionListCard } from "@/components/explorer/InstitutionListCard";
import { cn } from "@/lib/cn";
import type { CatalogInstitution } from "@/lib/queries/institutions";

type TypeFilter = "tous" | "public" | "prive";
type SortKey = "nom" | "formations" | "ville";

const TYPE_FILTERS: Array<{ value: TypeFilter; label: string }> = [
  { value: "tous", label: "Tous" },
  { value: "public", label: "Public" },
  { value: "prive", label: "Privé" },
];

const SORTS: Array<{ value: SortKey; label: string }> = [
  { value: "nom", label: "Nom (A→Z)" },
  { value: "formations", label: "Nombre de formations" },
  { value: "ville", label: "Ville" },
];

/** Comparaison insensible aux accents et à la casse ("labe" trouve "Labé"). */
function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function Pill({
  active,
  children,
  ...props
}: React.ComponentProps<"button"> & { active: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-pill border px-3.5 py-1.5 text-sm transition-[background-color,border-color,color] duration-200 ease-out",
        active
          ? "border-primary/40 bg-primary/20 text-foreground"
          : "border-glass-border bg-glass-1 text-muted hover:border-glass-border-hover hover:text-foreground"
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ExplorerCatalog({
  institutions,
  cities,
}: {
  institutions: CatalogInstitution[];
  cities: string[];
}) {
  const params = useSearchParams();

  const [query, setQuery] = useState(() => params.get("q") ?? "");
  const [type, setType] = useState<TypeFilter>(() => {
    const v = params.get("type");
    return v === "public" || v === "prive" ? v : "tous";
  });
  const [city, setCity] = useState(() => {
    const v = params.get("ville");
    return v && cities.includes(v) ? v : "toutes";
  });
  const [sort, setSort] = useState<SortKey>(() => {
    const v = params.get("tri");
    return v === "formations" || v === "ville" ? v : "nom";
  });

  // L'URL est mise à jour via l'History API native : le lien reste
  // partageable sans déclencher de navigation ni de re-fetch serveur.
  function syncUrl(next: Partial<Record<string, string>>) {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === "tous" || value === "toutes" || value === "nom") {
        sp.delete(key);
      } else {
        sp.set(key, value);
      }
    }
    const qs = sp.toString();
    window.history.replaceState(
      null,
      "",
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname
    );
  }

  const filtered = useMemo(() => {
    const q = normalize(query.trim());

    const result = institutions.filter((i) => {
      if (type !== "tous" && i.type !== (type === "public" ? "public" : "prive"))
        return false;
      if (city !== "toutes" && i.city !== city) return false;
      if (!q) return true;
      return (
        normalize(i.name).includes(q) || normalize(i.city ?? "").includes(q)
      );
    });

    return result.sort((a, b) => {
      if (sort === "formations") {
        return (
          b.programCount - a.programCount || a.name.localeCompare(b.name, "fr")
        );
      }
      if (sort === "ville") {
        return (
          (a.city ?? "").localeCompare(b.city ?? "", "fr") ||
          a.name.localeCompare(b.name, "fr")
        );
      }
      return a.name.localeCompare(b.name, "fr");
    });
  }, [institutions, query, type, city, sort]);

  const hasActiveFilters =
    query !== "" || type !== "tous" || city !== "toutes";

  function reset() {
    setQuery("");
    setType("tous");
    setCity("toutes");
    syncUrl({ q: "", type: "", ville: "" });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <GlassInput
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                syncUrl({ q: e.target.value });
              }}
              placeholder="Rechercher un établissement ou une ville..."
              aria-label="Rechercher un établissement"
            />
          </div>
          <div className="sm:w-56">
            <GlassSelect
              value={sort}
              aria-label="Trier par"
              onChange={(e) => {
                const v = e.target.value as SortKey;
                setSort(v);
                syncUrl({ tri: v });
              }}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  Trier par : {s.label}
                </option>
              ))}
            </GlassSelect>
          </div>
        </div>

        <div
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
          role="group"
          aria-label="Filtrer par statut"
        >
          {TYPE_FILTERS.map((f) => (
            <Pill
              key={f.value}
              active={type === f.value}
              onClick={() => {
                setType(f.value);
                syncUrl({ type: f.value });
              }}
            >
              {f.label}
            </Pill>
          ))}
        </div>

        <div
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
          role="group"
          aria-label="Filtrer par ville"
        >
          <Pill
            active={city === "toutes"}
            onClick={() => {
              setCity("toutes");
              syncUrl({ ville: "" });
            }}
          >
            Toutes les villes
          </Pill>
          {cities.map((c) => (
            <Pill
              key={c}
              active={city === c}
              onClick={() => {
                setCity(c);
                syncUrl({ ville: c });
              }}
            >
              {c}
            </Pill>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted" aria-live="polite">
        <span className="font-semibold tabular-nums text-foreground">
          {filtered.length}
        </span>{" "}
        établissement{filtered.length > 1 ? "s" : ""}
        {filtered.length !== institutions.length &&
          ` sur ${institutions.length}`}
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-panel border border-glass-border bg-glass-1 px-6 py-16 text-center">
          <SearchX className="h-8 w-8 text-muted-dark" aria-hidden />
          <h2 className="mt-4 font-semibold">Aucun établissement trouvé</h2>
          <p className="mt-2 max-w-sm text-sm text-muted">
            Aucun résultat ne correspond à cette combinaison de filtres. Essaie
            une autre ville, un autre statut, ou une recherche plus large.
          </p>
          {hasActiveFilters && (
            <GlassButton
              variant="secondary"
              className="mt-6"
              onClick={reset}
            >
              Réinitialiser les filtres
            </GlassButton>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((institution) => (
            <InstitutionListCard
              key={institution.id}
              institution={institution}
            />
          ))}
        </div>
      )}
    </div>
  );
}
