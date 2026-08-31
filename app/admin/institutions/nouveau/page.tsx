import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  EMPTY_INSTITUTION,
  InstitutionForm,
} from "@/components/admin/InstitutionForm";

export const dynamic = "force-dynamic";

export default function NewInstitutionPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/institutions"
          className="inline-flex items-center gap-1.5 rounded text-sm text-muted outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Établissements
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">
          Nouvel établissement
        </h1>
      </div>

      <p className="rounded-card border border-glass-border bg-background p-4 text-xs leading-relaxed text-muted">
        Le logo et les photos s&apos;ajoutent après l&apos;enregistrement : les
        fichiers sont rangés sous <code>institution-images/{"{id}"}/</code>, et
        cet identifiant n&apos;existe qu&apos;une fois la fiche créée.
      </p>

      <InstitutionForm initial={EMPTY_INSTITUTION} />
    </div>
  );
}
