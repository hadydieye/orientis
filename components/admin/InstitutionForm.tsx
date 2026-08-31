"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassSelect } from "@/components/ui/GlassSelect";

export type InstitutionFormValues = {
  name: string;
  type: string;
  status: string;
  description: string;
  city: string;
  commune: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  facebook: string;
  founded_year: string;
  latitude: string;
  longitude: string;
  recognition_status: string;
};

export const EMPTY_INSTITUTION: InstitutionFormValues = {
  name: "", type: "public", status: "universite", description: "", city: "",
  commune: "", address: "", phone: "", email: "", website: "", facebook: "",
  founded_year: "", latitude: "", longitude: "", recognition_status: "",
};

function Field({
  id, label, children, hint,
}: {
  id: string; label: string; children: React.ReactNode; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-dark">{hint}</p>}
    </div>
  );
}

export function InstitutionForm({
  initial,
  institutionId,
}: {
  initial: InstitutionFormValues;
  institutionId?: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(institutionId);
  const set = (k: keyof InstitutionFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setValues((v) => ({ ...v, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    // Les champs vides sont omis plutôt qu'envoyés en "" : la base attend
    // NULL, et un numérique vide ferait échouer l'insert.
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) {
      const s = String(v).trim();
      if (s === "") continue;
      if (k === "founded_year") payload[k] = Number.parseInt(s, 10);
      else if (k === "latitude" || k === "longitude") payload[k] = Number(s);
      else payload[k] = s;
    }

    try {
      const res = await fetch(
        isEdit ? `/institutions/${institutionId}` : "/institutions",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `Échec (${res.status})`);
        setPending(false);
        return;
      }
      router.push("/admin/institutions");
      router.refresh();
    } catch {
      setError("Erreur réseau");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex max-w-3xl flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field id="name" label="Nom *">
            <GlassInput id="name" required value={values.name} onChange={set("name")} />
          </Field>
        </div>

        <Field id="type" label="Type *">
          <GlassSelect id="type" value={values.type} onChange={set("type")}>
            <option value="public">Public</option>
            <option value="prive">Privé</option>
          </GlassSelect>
        </Field>

        <Field id="status" label="Nature *">
          <GlassSelect id="status" value={values.status} onChange={set("status")}>
            <option value="universite">Université</option>
            <option value="institut">Institut</option>
            <option value="ecole">École</option>
          </GlassSelect>
        </Field>

        <div className="sm:col-span-2">
          <Field id="description" label="Description">
            <textarea
              id="description"
              rows={4}
              value={values.description}
              onChange={set("description")}
              className="w-full rounded-input border border-glass-border bg-glass-1 px-4 py-2.5 text-sm text-foreground outline-none transition-[border-color,box-shadow] duration-200 ease-out placeholder:text-muted-dark focus:border-primary focus:shadow-[0_0_0_3px_rgba(108,99,255,0.15)]"
            />
          </Field>
        </div>

        <Field id="city" label="Ville">
          <GlassInput id="city" value={values.city} onChange={set("city")} />
        </Field>
        <Field id="commune" label="Commune">
          <GlassInput id="commune" value={values.commune} onChange={set("commune")} />
        </Field>

        <div className="sm:col-span-2">
          <Field id="address" label="Adresse">
            <GlassInput id="address" value={values.address} onChange={set("address")} />
          </Field>
        </div>

        <Field id="phone" label="Téléphone">
          <GlassInput id="phone" type="tel" value={values.phone} onChange={set("phone")} />
        </Field>
        <Field id="email" label="E-mail">
          <GlassInput id="email" type="email" value={values.email} onChange={set("email")} />
        </Field>

        <Field id="website" label="Site web">
          <GlassInput id="website" type="url" placeholder="https://" value={values.website} onChange={set("website")} />
        </Field>
        <Field id="facebook" label="Facebook">
          <GlassInput id="facebook" type="url" placeholder="https://" value={values.facebook} onChange={set("facebook")} />
        </Field>

        <Field id="founded_year" label="Année de fondation">
          <GlassInput
            id="founded_year" type="number" min={1800} max={2100}
            value={values.founded_year} onChange={set("founded_year")}
          />
        </Field>
        <Field id="recognition_status" label="Statut de reconnaissance">
          <GlassInput
            id="recognition_status"
            value={values.recognition_status}
            onChange={set("recognition_status")}
          />
        </Field>

        <Field id="latitude" label="Latitude" hint="Décimal, ex : 9.6412">
          <GlassInput id="latitude" type="number" step="any" value={values.latitude} onChange={set("latitude")} />
        </Field>
        <Field id="longitude" label="Longitude" hint="Décimal, ex : -13.5784">
          <GlassInput id="longitude" type="number" step="any" value={values.longitude} onChange={set("longitude")} />
        </Field>
      </div>

      {!isEdit && (
        <p className="rounded-card border border-glass-border bg-background p-4 text-xs leading-relaxed text-muted">
          La soumission est créée avec le statut <strong>pending</strong> :
          c&apos;est la policy RLS <code>contributeur_insert</code> qui
          l&apos;impose, elle exige aussi le rôle <code>contributeur</code>.
          Elle n&apos;apparaîtra sur le site public qu&apos;après validation
          par un admin.
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
          {pending ? "Enregistrement..." : isEdit ? "Enregistrer" : "Soumettre"}
        </button>
        <Link
          href="/admin/institutions"
          className="rounded-button px-3 py-2 text-sm text-muted outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
        >
          Annuler
        </Link>
      </div>
    </form>
  );
}
