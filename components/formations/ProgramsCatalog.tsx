"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Info, SearchX } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { ProgramListCard } from "@/components/formations/ProgramListCard";
import { LEVEL_LABEL } from "@/lib/labels";
import { cn } from "@/lib/cn";
import type { CatalogProgram } from "@/lib/queries/programs";

const ALL = "tous";
/** Valeur réservée : les formations dont le domaine n'est pas renseigné. */
const NO_DOMAIN = "__sans__";

type SortKey = "nom" | "etablissement" | "niveau";

const SORTS: Array<{ value: SortKey; label: string }> = [
  { value: "nom", label: "Nom (A→Z)" },
  { value: "etablissement", label: "Établissement" },
  { value: "niveau", label: "Niveau" },
];

const LEVEL_ORDER = ["licence", "master", "doctorat", "bts", "autre"];

function normalize(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function Pill({
  active, ...props
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
    />
  );
}

export function ProgramsCatalog({
  programs, domains, levels, institutions,
}: {
  programs: CatalogProgram[];
  domains: string[];
  levels: string[];
  institutions: Array<{ id: string; name: string }>;
}) {
  const params = useSearchParams();

  const [query, setQuery] = useState(() => params.get("q") ?? "");
  const [level, setLevel] = useState(() => {
    const v = params.get("niveau");
    return v && levels.includes(v) ? v : ALL;
  });
  const [domain, setDomain] = useState(() => {
    const v = params.get("domaine");
    return v && (domains.includes(v) || v === NO_DOMAIN) ? v : ALL;
  });
  const [institution, setInstitution] = useState(() => {
    const v = params.get("etablissement");
    return v && institutions.some((i) => i.id === v) ? v : ALL;
  });
  const [sort, setSort] = useState<SortKey>(() => {
    const v = params.get("tri");
    return v === "etablissement" || v === "niveau" ? v : "nom";
  });

  // History API : l'URL reste partageable sans navigation ni re-fetch serveur.
  function syncUrl(next: Partial<Record<string, string>>) {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === ALL || value === "nom") sp.delete(key);
      else sp.set(key, value);
    }
    const qs = sp.toString();
    window.history.replaceState(
      null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname
    );
  }

  const withoutDomain = useMemo(
    () => programs.filter((p) => !p.domain).length,
    [programs]
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());

    const result = programs.filter((p) => {
      if (level !== ALL && p.level !== level) return false;
      if (domain === NO_DOMAIN && p.domain) return false;
      if (domain !== ALL && domain !== NO_DOMAIN && p.domain !== domain) return false;
      if (institution !== ALL && p.institutionId !== institution) return false;
      if (!q) return true;
      return (
        normalize(p.name).includes(q) ||
        normalize(p.specialty ?? "").includes(q) ||
        normalize(p.departmentName).includes(q) ||
        normalize(p.institutionName).includes(q)
      );
    });

    return result.sort((a, b) => {
      if (sort === "etablissement") {
        return (
          a.institutionName.localeCompare(b.institutionName, "fr") ||
          a.name.localeCompare(b.name, "fr")
        );
      }
      if (sort === "niveau") {
        return (
          LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level) ||
          a.name.localeCompare(b.name, "fr")
        );
      }
      return a.name.localeCompare(b.name, "fr");
    });
  }, [programs, query, level, domain, institution, sort]);

  const hasActiveFilters =
    query !== "" || level !== ALL || domain !== ALL || institution !== ALL;

  function reset() {
    setQuery(""); setLevel(ALL); setDomain(ALL); setInstitution(ALL);
    syncUrl({ q: "", niveau: "", domaine: "", etablissement: "" });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <GlassInput
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); syncUrl({ q: e.target.value }); }}
              placeholder="Rechercher une formation, un département, un établissement..."
              aria-label="Rechercher une formation"
            />
          </div>
          <div className="sm:w-56">
            <GlassSelect
              value={sort}
              aria-label="Trier par"
              onChange={(e) => {
                const v = e.target.value as SortKey;
                setSort(v); syncUrl({ tri: v });
              }}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>Trier par : {s.label}</option>
              ))}
            </GlassSelect>
          </div>
        </div>

        <div
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
          role="group"
          aria-label="Filtrer par niveau"
        >
          <Pill active={level === ALL} onClick={() => { setLevel(ALL); syncUrl({ niveau: "" }); }}>
            Tous les niveaux
          </Pill>
          {levels.map((l) => (
            <Pill key={l} active={level === l} onClick={() => { setLevel(l); syncUrl({ niveau: l }); }}>
              {LEVEL_LABEL[l] ?? l}
            </Pill>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="sm:flex-1">
            <label className="sr-only" htmlFor="filtre-etablissement">Établissement</label>
            <GlassSelect
              id="filtre-etablissement"
              value={institution}
              onChange={(e) => { setInstitution(e.target.value); syncUrl({ etablissement: e.target.value }); }}
            >
              <option value={ALL}>Tous les établissements ({institutions.length})</option>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </GlassSelect>
          </div>
          <div className="sm:w-72">
            <label className="sr-only" htmlFor="filtre-domaine">Domaine</label>
            <GlassSelect
              id="filtre-domaine"
              value={domain}
              onChange={(e) => { setDomain(e.target.value); syncUrl({ domaine: e.target.value }); }}
            >
              <option value={ALL}>Tous les domaines</option>
              {domains.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
              <option value={NO_DOMAIN}>Domaine non renseigné ({withoutDomain})</option>
            </GlassSelect>
          </div>
        </div>

        {/* Le champ domain n'est presque jamais rempli : le dire évite de
            faire passer un manque de données pour un filtre cassé. */}
        {withoutDomain > 0 && (
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-dark">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Le domaine n&apos;est renseigné que sur {programs.length - withoutDomain} formation
            {programs.length - withoutDomain > 1 ? "s" : ""} sur {programs.length} : filtrer
            par domaine masque donc l&apos;essentiel du catalogue. Le filtre par
            établissement est plus fiable en attendant que ce champ soit complété.
          </p>
        )}
      </div>

      <p className="text-sm text-muted" aria-live="polite">
        <span className="font-semibold tabular-nums text-foreground">{filtered.length}</span>{" "}
        formation{filtered.length > 1 ? "s" : ""}
        {filtered.length !== programs.length && ` sur ${programs.length}`}
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-panel border border-glass-border bg-glass-1 px-6 py-16 text-center">
          <SearchX className="h-8 w-8 text-muted-dark" aria-hidden />
          <h2 className="mt-4 font-semibold">Aucune formation trouvée</h2>
          <p className="mt-2 max-w-sm text-sm text-muted">
            Aucun résultat ne correspond à cette combinaison de filtres. Essaie
            un autre niveau, un autre établissement, ou une recherche plus large.
          </p>
          {hasActiveFilters && (
            <GlassButton variant="secondary" className="mt-6" onClick={reset}>
              Réinitialiser les filtres
            </GlassButton>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProgramListCard key={p.id} program={p} />
          ))}
        </div>
      )}
    </div>
  );
}
