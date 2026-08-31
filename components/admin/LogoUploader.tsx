"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Building2, Loader2, Trash2, Upload } from "lucide-react";
import { formatBytes, removeObject, uploadLogo } from "@/lib/storage/images";

/**
 * Logo d'établissement : une seule image, remplacée sur place.
 *
 * L'aperçu montre l'ancien et le nouveau côte à côte tant que
 * l'enregistrement n'est pas fait, pour qu'un remplacement ne soit jamais une
 * surprise.
 */
export function LogoUploader({
  institutionId,
  currentUrl,
}: {
  institutionId: string;
  currentUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [stats, setStats] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(currentUrl);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { url, image } = await uploadLogo(institutionId, file);
      setPreview(url);
      setStats(
        `${image.width}×${image.height} · ${formatBytes(image.originalBytes)} → ${formatBytes(image.blob.size)} (${image.ext})`
      );

      const res = await fetch(`/institutions/${institutionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo_url: url }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `Enregistrement refusé (${res.status})`);
        setBusy(false);
        return;
      }
      setSaved(url);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function clearLogo() {
    setBusy(true);
    setError(null);
    try {
      for (const ext of ["webp", "jpg", "jpeg", "png"]) {
        await removeObject(`${institutionId}/logo.${ext}`).catch(() => {});
      }
      const res = await fetch(`/institutions/${institutionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo_url: null }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `Échec (${res.status})`);
        setBusy(false);
        return;
      }
      setSaved(null);
      setPreview(null);
      setStats(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-card border border-glass-border bg-background p-5">
      <div>
        <h2 className="text-sm font-semibold">Logo</h2>
        <p className="mt-1 text-xs text-muted">
          Redimensionné à 1200 px de large maximum et converti en WebP dans le
          navigateur avant l&apos;envoi.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-wider text-muted-dark">
            Actuel
          </span>
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-panel border border-glass-border bg-glass-2">
            {saved ? (
              <Image src={saved} alt="" width={80} height={80} className="h-full w-full object-cover" unoptimized />
            ) : (
              <Building2 className="h-7 w-7 text-secondary" aria-hidden />
            )}
          </div>
        </div>

        {preview && preview !== saved && (
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-success">
              Nouveau
            </span>
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-panel border border-success/40 bg-glass-2">
              <Image src={preview} alt="" width={80} height={80} className="h-full w-full object-cover" unoptimized />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-button border border-glass-border bg-glass-1 px-3 py-2 text-sm outline-none transition-colors duration-150 ease-out hover:bg-glass-2 focus-within:ring-2 focus-within:ring-primary">
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Upload className="h-4 w-4" aria-hidden />
            )}
            {saved ? "Remplacer le logo" : "Choisir un logo"}
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={busy}
              onChange={onPick}
            />
          </label>

          {saved && (
            <button
              type="button"
              onClick={clearLogo}
              disabled={busy}
              className="inline-flex w-fit items-center gap-1.5 rounded-button border border-error/30 bg-error/10 px-2.5 py-1 text-xs font-medium text-error outline-none transition-opacity duration-150 ease-out hover:opacity-80 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Trash2 className="h-3 w-3" aria-hidden />
              Retirer le logo
            </button>
          )}

          {stats && <p className="text-xs text-muted-dark">{stats}</p>}
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-card border border-error/30 bg-error/10 p-3 text-sm text-error">
          {error}
        </p>
      )}
    </section>
  );
}
