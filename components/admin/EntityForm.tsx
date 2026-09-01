"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, BadgeCheck, Loader2, Search } from "lucide-react";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { RELIABILITY_LABEL, isOfficialSource } from "@/lib/labels";

export type FormOption = { value: string; label: string; group?: string; meta?: string };

export type FieldSpec =
  | { kind: "text" | "url" | "email" | "tel"; name: string; label: string; required?: boolean; placeholder?: string; hint?: string; wide?: boolean }
  | { kind: "number"; name: string; label: string; required?: boolean; min?: number; max?: number; step?: string; hint?: string; wide?: boolean }
  | { kind: "textarea"; name: string; label: string; rows?: number; hint?: string }
  | { kind: "select"; name: string; label: string; options: FormOption[]; required?: boolean; hint?: string; placeholder?: string; wide?: boolean }
  | { kind: "searchSelect"; name: string; label: string; options: FormOption[]; required?: boolean; hint?: string }
  | { kind: "multiselect"; name: string; label: string; options: FormOption[]; hint?: string }
  | { kind: "sourceSelect"; name: string; label: string; options: FormOption[]; hint?: string };

export type FormValues = Record<string, string | string[]>;

/** Champs numériques : convertis avant envoi, pour ne pas poster "" ou "13". */
export type NumericField = string;

function Field({
  id, label, hint, children, wide,
}: {
  id: string; label: string; hint?: string; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-dark">{hint}</p>}
    </div>
  );
}

const textareaClass =
  "w-full rounded-input border border-glass-border bg-glass-1 px-4 py-2.5 text-sm text-foreground outline-none transition-[border-color,box-shadow] duration-200 ease-out placeholder:text-muted-dark focus:border-primary focus:shadow-[0_0_0_3px_rgba(108,99,255,0.15)]";

/** Regroupe des options en <optgroup> quand un `group` est présent. */
function GroupedOptions({ options }: { options: FormOption[] }) {
  const grouped = options.some((o) => o.group);
  if (!grouped) {
    return (
      <>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
            {o.meta ? ` — ${o.meta}` : ""}
          </option>
        ))}
      </>
    );
  }
  const groups = new Map<string, FormOption[]>();
  for (const o of options) {
    const g = o.group ?? "Autres";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(o);
  }
  return (
    <>
      {[...groups.entries()].map(([g, list]) => (
        <optgroup key={g} label={g}>
          {list.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
              {o.meta ? ` — ${o.meta}` : ""}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}

/** Sélecteur filtrable : indispensable au-delà de quelques dizaines d'options. */
function SearchSelect({
  id, options, value, onChange, required,
}: {
  id: string; options: FormOption[]; value: string;
  onChange: (v: string) => void; required?: boolean;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(needle) ||
        (o.group ?? "").toLowerCase().includes(needle)
    );
  }, [q, options]);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <GlassInput
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Filtrer parmi ${options.length} entrées...`}
          aria-label="Filtrer la liste"
          className="pl-9"
        />
      </div>
      <GlassSelect
        id={id}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        size={1}
      >
        <option value="">— Sélectionner —</option>
        <GroupedOptions options={filtered} />
      </GlassSelect>
      <p className="text-xs text-muted-dark">
        {filtered.length} / {options.length} affichées
        {selected ? ` · sélection : ${selected.label}` : ""}
      </p>
    </div>
  );
}

/** Fiabilité de la source, affichée en direct sous le sélecteur. */
function SourceReliability({ option }: { option: FormOption | undefined }) {
  if (!option) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-dark">
        Aucune source sélectionnée — la donnée s&apos;affichera en «&nbsp;Source
        inconnue&nbsp;» sur le site public.
      </p>
    );
  }
  const [sourceType, status] = (option.meta ?? "").split("/");
  const official = isOfficialSource({ sourceType, status });
  return (
    <p
      className={
        official
          ? "inline-flex w-fit items-center gap-1.5 rounded-pill border border-success/30 bg-success/15 px-2.5 py-1 text-xs font-medium text-success"
          : "inline-flex w-fit items-center gap-1.5 rounded-pill border border-warning/30 bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning"
      }
    >
      {official ? (
        <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
      )}
      {official ? RELIABILITY_LABEL.official : RELIABILITY_LABEL.unofficial}
      <span className="font-normal opacity-80">
        ({sourceType || "?"} / {status || "?"})
      </span>
    </p>
  );
}

export function EntityForm({
  fields,
  initial,
  numericFields = [],
  table,
  rowId,
  backHref,
  submitLabel,
}: {
  fields: FieldSpec[];
  initial: FormValues;
  numericFields?: NumericField[];
  /** Segment d'API : `academic_units`, `fees`... */
  table: string;
  rowId?: string;
  backHref: string;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(rowId);
  const setValue = (name: string, v: string | string[]) =>
    setValues((prev) => ({ ...prev, [name]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    // Un champ vide n'est jamais envoyé en "" : la base attend NULL, et un
    // numérique vide ferait échouer l'insert.
    //
    // Mais « vide » recouvre deux intentions distinctes en modification :
    // un champ resté vide (à omettre, pour laisser jouer les valeurs par
    // défaut) et un champ QUE L'ON VIENT DE VIDER (à envoyer en null, pour
    // effacer la valeur). Sans cette distinction, une valeur déjà en base ne
    // pouvait plus jamais être effacée depuis le formulaire.
    const wasFilled = (k: string) => {
      const init = initial[k];
      return Array.isArray(init) ? init.length > 0 : String(init ?? "").trim() !== "";
    };

    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) {
      if (Array.isArray(v)) {
        if (v.length > 0) payload[k] = v;
        else if (isEdit && wasFilled(k)) payload[k] = null;
        continue;
      }
      const s = v.trim();
      if (s === "") {
        if (isEdit && wasFilled(k)) payload[k] = null;
        continue;
      }
      payload[k] = numericFields.includes(k) ? Number(s) : s;
    }

    try {
      const res = await fetch(isEdit ? `/${table}/${rowId}` : `/${table}`, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `Échec (${res.status})`);
        setPending(false);
        return;
      }
      router.push(backHref);
      router.refresh();
    } catch {
      setError("Erreur réseau");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex max-w-3xl flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => {
          const raw = values[f.name];
          const value = Array.isArray(raw) ? raw : (raw ?? "");

          switch (f.kind) {
            case "textarea":
              return (
                <Field key={f.name} id={f.name} label={f.label} hint={f.hint} wide>
                  <textarea
                    id={f.name}
                    rows={f.rows ?? 4}
                    value={value as string}
                    onChange={(e) => setValue(f.name, e.target.value)}
                    className={textareaClass}
                  />
                </Field>
              );

            case "number":
              return (
                <Field key={f.name} id={f.name} label={f.label} hint={f.hint} wide={f.wide}>
                  <GlassInput
                    id={f.name}
                    type="number"
                    required={f.required}
                    min={f.min}
                    max={f.max}
                    step={f.step ?? "any"}
                    value={value as string}
                    onChange={(e) => setValue(f.name, e.target.value)}
                  />
                </Field>
              );

            case "select":
              return (
                <Field key={f.name} id={f.name} label={f.label} hint={f.hint} wide={f.wide}>
                  <GlassSelect
                    id={f.name}
                    required={f.required}
                    value={value as string}
                    onChange={(e) => setValue(f.name, e.target.value)}
                  >
                    <option value="">{f.placeholder ?? "— Sélectionner —"}</option>
                    <GroupedOptions options={f.options} />
                  </GlassSelect>
                </Field>
              );

            case "searchSelect":
              return (
                <Field key={f.name} id={f.name} label={f.label} hint={f.hint} wide>
                  <SearchSelect
                    id={f.name}
                    options={f.options}
                    value={value as string}
                    required={f.required}
                    onChange={(v) => setValue(f.name, v)}
                  />
                </Field>
              );

            case "multiselect": {
              const selected = (Array.isArray(raw) ? raw : []) as string[];
              return (
                <Field key={f.name} id={f.name} label={f.label} hint={f.hint} wide>
                  <div
                    id={f.name}
                    role="group"
                    aria-label={f.label}
                    className="flex flex-wrap gap-2"
                  >
                    {f.options.map((o) => {
                      const on = selected.includes(o.value);
                      return (
                        <button
                          key={o.value}
                          type="button"
                          aria-pressed={on}
                          onClick={() =>
                            setValue(
                              f.name,
                              on
                                ? selected.filter((s) => s !== o.value)
                                : [...selected, o.value]
                            )
                          }
                          className={
                            on
                              ? "rounded-pill border border-primary/40 bg-primary/20 px-3 py-1.5 text-sm text-foreground outline-none transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-primary"
                              : "rounded-pill border border-glass-border bg-background px-3 py-1.5 text-sm text-muted outline-none transition-colors duration-150 ease-out hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
                          }
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-dark">
                    {selected.length === 0
                      ? "Aucune série sélectionnée — la colonne restera NULL (aucune série connue), et non « toutes séries »."
                      : `Sélection : ${selected.join(", ")}`}
                  </p>
                </Field>
              );
            }

            case "sourceSelect":
              return (
                <Field key={f.name} id={f.name} label={f.label} hint={f.hint} wide>
                  <GlassSelect
                    id={f.name}
                    value={value as string}
                    onChange={(e) => setValue(f.name, e.target.value)}
                  >
                    <option value="">— Aucune source —</option>
                    {f.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label} — {o.meta}
                      </option>
                    ))}
                  </GlassSelect>
                  <SourceReliability
                    option={f.options.find((o) => o.value === value)}
                  />
                </Field>
              );

            default:
              return (
                <Field key={f.name} id={f.name} label={f.label} hint={f.hint} wide={f.wide}>
                  <GlassInput
                    id={f.name}
                    type={f.kind === "text" ? "text" : f.kind}
                    required={f.required}
                    placeholder={f.placeholder}
                    value={value as string}
                    onChange={(e) => setValue(f.name, e.target.value)}
                  />
                </Field>
              );
          }
        })}
      </div>

      {!isEdit && (
        <p className="rounded-card border border-glass-border bg-background p-4 text-xs leading-relaxed text-muted">
          La soumission est créée avec le statut <strong>pending</strong> :
          c&apos;est le serveur qui force <code>review_status</code> et{" "}
          <code>created_by</code>, la policy RLS <code>contributeur_insert</code>{" "}
          le vérifie. Elle n&apos;apparaîtra sur le site public qu&apos;après
          validation par un admin.
        </p>
      )}

      {error && (
        <p className="rounded-card border border-error/30 bg-error/10 p-3 text-sm text-error" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-button bg-linear-to-r from-primary to-secondary px-5 py-2.5 text-sm font-semibold text-white outline-none transition-opacity duration-150 ease-out hover:opacity-90 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {pending ? "Enregistrement..." : (submitLabel ?? (isEdit ? "Enregistrer" : "Soumettre"))}
        </button>
        <Link
          href={backHref}
          className="rounded-button px-3 py-2 text-sm text-muted outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
        >
          Annuler
        </Link>
      </div>
    </form>
  );
}
