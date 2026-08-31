import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { EntityForm } from "@/components/admin/EntityForm";
import { EMPTY_SOURCE, sourceFields } from "@/components/admin/forms/SourceFields";
import { getAdminSession } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function NewSourcePage() {
  const session = await getAdminSession();

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
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Nouvelle source</h1>
      </div>

      {session?.isAdmin ? (
        <EntityForm
          fields={sourceFields()}
          initial={EMPTY_SOURCE}
          table="sources"
          backHref="/admin/sources"
          submitLabel="Créer la source"
        />
      ) : (
        <p className="flex items-start gap-2 rounded-card border border-warning/30 bg-warning/10 p-4 text-sm leading-relaxed text-foreground">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
          <span>
            La création de sources est réservée aux administrateurs. Une source
            porte la traçabilité de tout le catalogue : les formulaires de
            conditions d&apos;admission et de frais ne proposent que des sources
            existantes, jamais d&apos;en créer une.
          </span>
        </p>
      )}
    </div>
  );
}
