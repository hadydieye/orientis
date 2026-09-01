import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  InstitutionForm,
  type InstitutionFormValues,
} from "@/components/admin/InstitutionForm";
import { getAdminInstitution } from "@/lib/queries/admin";
import { getAdminInstitutionPhotos } from "@/lib/queries/admin-catalog";
import { getAdminSession } from "@/lib/auth/admin";
import { LogoUploader } from "@/components/admin/LogoUploader";
import { PhotosManager } from "@/components/admin/PhotosManager";
import { ReviewBadge } from "@/components/admin/ReviewBadge";

export const dynamic = "force-dynamic";

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export default async function EditInstitutionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [institution, photos, session] = await Promise.all([
    getAdminInstitution(id),
    getAdminInstitutionPhotos(id),
    getAdminSession(),
  ]);

  if (!institution) notFound();

  const initial: InstitutionFormValues = {
    name: str(institution.name),
    type: str(institution.type) || "public",
    status: str(institution.status) || "universite",
    description: str(institution.description),
    city: str(institution.city),
    commune: str(institution.commune),
    address: str(institution.address),
    phone: str(institution.phone),
    email: str(institution.email),
    website: str(institution.website),
    facebook: str(institution.facebook),
    founded_year: str(institution.founded_year),
    latitude: str(institution.latitude),
    longitude: str(institution.longitude),
    recognition_status: str(institution.recognition_status),
  };

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
          {institution.name}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Statut de validation <ReviewBadge status={institution.review_status} short={false} className="ml-1 align-middle" />
        </p>
      </div>

      <LogoUploader institutionId={id} currentUrl={institution.logo_url} />

      <PhotosManager
        institutionId={id}
        photos={photos}
        canDelete={session?.isAdmin ?? false}
        canModerate={session?.isAdmin ?? false}
      />

      <InstitutionForm initial={initial} institutionId={id} />
    </div>
  );
}
