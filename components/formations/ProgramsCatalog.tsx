"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchX } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { ProgramListCard } from "@/components/formations/ProgramListCard";
import { PROFIL_LABEL } from "@/lib/labels";
import { normalizeText } from "@/lib/orientation/interests";
import { cn } from "@/lib/cn";
import type { CatalogProgram } from "@/lib/queries/programs";

const ALL = "tous";

type SortKey = "nom" | "etablissement" | "type";

const SORTS: Array<{ value: SortKey; label: string }> = [
  { value: "nom", label: "Nom (A→Z)" },
  { value: "etablissement", label: "Établissement" },
  { value: "type", label: "Type de diplôme" },
];

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
  programs, typeDiplomes, categories, profils, institutions,
}: {
  programs: CatalogProgram[];
  typeDiplomes: string[];
  categories: string[];
  profils: string[];
  institutions: Array<{ id: string; name: string; sigle: string | null }>;
}) {
  const params = useSearchParams();

  const [query, setQuery] = useState(() => params.get("q") ?? "");
  const [typeDiplome, setTypeDiplome] = useState(() => {
    const v = params.get("diplome");
    return v && typeDiplomes.includes(v) ? v : ALL;
  });
  const [categorie, setCategorie] = useState(() => {
    const v = params.get("categorie");
    return v && categories.includes(v) ? v : ALL;
  });
  const [profil, setProfil] = useState(() => {
    const v = params.get("profil");
    return v && profils.includes(v) ? v : ALL;
  });
  const [institution, setInstitution] = useState(() => {
    const v = params.get("etablissement");
    return v && institutions.some((i) => i.id === v) ? v : ALL;
  });
  const [sort, setSort] = useState<SortKey>(() => {
    const v = params.get("tri");
    return v === "etablissement" || v === "type" ? v : "nom";
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

  const filtered = useMemo(() => {
    // La recherche est normalisée des deux côtés : « Genie civil » et
    // « génie civil » donnent le même résultat.
    const q = normalizeText(query);

    const result = programs.filter((p) => {
      if (typeDiplome !== ALL && p.typeDiplome !== typeDiplome) return false;
      if (categorie !== ALL && p.categorie !== categorie) return false;
      if (profil !== ALL && !p.profils.includes(profil)) return false;
      if (
        institution !== ALL &&
        !p.institutions.some((i) => i.id === institution)
      )
        return false;
      if (!q) return true;
      return (
        normalizeText(p.name).includes(q) ||
        normalizeText(p.code).includes(q) ||
        p.institutions.some(
          (i) =>
            normalizeText(i.name).includes(q) ||
            normalizeText(i.sigle).includes(q)
        )
      );
    });

    const firstSigle = (p: CatalogProgram) =>
      p.institutions[0]?.sigle ?? p.institutions[0]?.name ?? "￿";

    return result.sort((a, b) => {
      if (sort === "etablissement") {
        return (
          firstSigle(a).localeCompare(firstSigle(b), "fr") ||
          a.name.localeCompare(b.name, "fr")
        );
      }
      if (sort === "type") {
        return (
          typeDiplomes.indexOf(a.typeDiplome ?? "") -
            typeDiplomes.indexOf(b.typeDiplome ?? "") ||
          a.name.localeCompare(b.name, "fr")
        );
      }
      return a.name.localeCompare(b.name, "fr");
    });
  }, [programs, query, typeDiplome, categorie, profil, institution, sort, typeDiplomes]);

  const hasActiveFilters =
    query !== "" ||
    typeDiplome !== ALL ||
    categorie !== ALL ||
    profil !== ALL ||
    institution !== ALL;

  function reset() {
    setQuery(""); setTypeDiplome(ALL); setCategorie(ALL);
    setProfil(ALL); setInstitution(ALL);
    syncUrl({ q: "", diplome: "", categorie: "", profil: "", etablissement: "" });
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
              placeholder="Rechercher une formation, un code, un établissement..."
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
          aria-label="Filtrer par type de diplôme"
        >
          <Pill
            active={typeDiplome === ALL}
            onClick={() => { setTypeDiplome(ALL); syncUrl({ diplome: "" }); }}
          >
            Tous les diplômes
          </Pill>
          {typeDiplomes.map((t) => (
            <Pill
              key={t}
              active={typeDiplome === t}
              onClick={() => { setTypeDiplome(t); syncUrl({ diplome: t }); }}
            >
              {t}
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
                <option key={i.id} value={i.id}>
                  {i.sigle ? `${i.sigle} — ${i.name}` : i.name}
                </option>
              ))}
            </GlassSelect>
          </div>
          <div className="sm:w-72">
            <label className="sr-only" htmlFor="filtre-categorie">Catégorie</label>
            <GlassSelect
              id="filtre-categorie"
              value={categorie}
              onChange={(e) => { setCategorie(e.target.value); syncUrl({ categorie: e.target.value }); }}
            >
              <option value={ALL}>Toutes les catégories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </GlassSelect>
          </div>
          <div className="sm:w-72">
            <label className="sr-only" htmlFor="filtre-profil">Profil d&apos;entrée</label>
            <GlassSelect
              id="filtre-profil"
              value={profil}
              onChange={(e) => { setProfil(e.target.value); syncUrl({ profil: e.target.value }); }}
            >
              <option value={ALL}>Tous les profils d&apos;entrée</option>
              {profils.map((p) => (
                <option key={p} value={p}>{PROFIL_LABEL[p] ?? p}</option>
              ))}
            </GlassSelect>
          </div>
        </div>
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
            un autre diplôme, un autre établissement, ou une recherche plus large.
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
