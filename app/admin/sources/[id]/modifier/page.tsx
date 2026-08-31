import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { EntityForm } from "@/components/admin/EntityForm";
import { sourceFields } from "@/components/admin/forms/SourceFields";
import { getAdminSource, getAdminSources } from "@/lib/queries/admin-catalog";
import { getAdminSession } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export default async function EditSourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row, all, session] = await Promise.all([
    getAdminSource(id),
    getAdminSources(),
    getAdminSession(),
  ]);
  if (!row) notFound();

  const usage = all.find((s) => s.id === id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/sources"
          className="inline-flex items-center gap-1.5 rounded text-sm text-muted outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Sources
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">{row.label}</h1>
        {usage && (
          <p className="mt-1 text-sm text-muted">
            Utilisée par <strong>{usage.total}</strong> ligne
            {usage.total > 1 ? "s" : ""} du catalogue
            {usage.total > 0
              ? ` (${usage.admissionRequirements} condition${usage.admissionRequirements > 1 ? "s" : ""} d'admission, ${usage.fees} ligne${usage.fees > 1 ? "s" : ""} de frais)`
              : ""}
            .
          </p>
        )}
      </div>

      {usage && usage.total > 0 && (
        <p className="rounded-card border border-glass-border bg-background p-4 text-xs leading-relaxed text-muted">
          Modifier le type ou le statut de cette source change la mention de
          fiabilité affichée sur {usage.total} fiche
          {usage.total > 1 ? "s" : ""} publique{usage.total > 1 ? "s" : ""}.
          Seule la combinaison <strong className="text-foreground">officiel + vérifié</strong>{" "}
          fait autorité ; tout le reste s&apos;affiche « Non-officiel, à vérifier ».
        </p>
      )}

      {session?.isAdmin ? (
        <EntityForm
          fields={sourceFields()}
          initial={{
            label: str(row.label),
            url: str(row.url),
            source_type: str(row.source_type),
            status: str(row.status),
            verified_at: str(row.verified_at),
          }}
          table="sources"
          rowId={id}
          backHref="/admin/sources"
        />
      ) : (
        <p className="flex items-start gap-2 rounded-card border border-warning/30 bg-warning/10 p-4 text-sm leading-relaxed text-foreground">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
          <span>Modification réservée aux administrateurs.</span>
        </p>
      )}
    </div>
  );
}
