"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { ReviewBadge } from "@/components/admin/ReviewBadge";
import { formatBytes, removeObject, uploadPhoto } from "@/lib/storage/images";

export type AdminPhoto = {
  id: string;
  photoUrl: string;
  caption: string | null;
  storagePath: string | null;
  reviewStatus: string;
};

/**
 * Galerie d'administration : envoi multiple, légende par photo, suppression.
 *
 * L'ordre des opérations compte. À l'ajout, le fichier part d'abord vers
 * Storage puis la ligne est créée : si l'insert échoue, il reste un objet
 * orphelin, qu'on retire aussitôt. À la suppression, la ligne part en premier
 * et le fichier ensuite : l'inverse laisserait une fiche pointant vers une
 * image disparue.
 */
export function PhotosManager({
  institutionId,
  photos,
  canDelete,
}: {
  institutionId: string;
  photos: AdminPhoto[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [captions, setCaptions] = useState<Record<string, string>>(
    Object.fromEntries(photos.map((p) => [p.id, p.caption ?? ""]))
  );

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setBusy(true);
    setError(null);

    let done = 0;
    for (const file of files) {
      setProgress(`${done + 1}/${files.length} — ${file.name}`);
      let uploaded: { path: string; url: string } | null = null;
      try {
        const { path, url, image } = await uploadPhoto(institutionId, file);
        uploaded = { path, url };
        setProgress(
          `${done + 1}/${files.length} — ${file.name} · ${formatBytes(image.originalBytes)} → ${formatBytes(image.blob.size)}`
        );

        const res = await fetch("/institution_photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            institution_id: institutionId,
            photo_url: url,
            storage_path: path,
            sort_order: photos.length + done,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          // L'objet vient d'être écrit mais aucune ligne ne le référence :
          // on le retire pour ne pas laisser de fichier orphelin.
          await removeObject(path).catch(() => {});
          uploaded = null;
          throw new Error(body.error ?? `Enregistrement refusé (${res.status})`);
        }
        done++;
      } catch (err) {
        if (uploaded) await removeObject(uploaded.path).catch(() => {});
        setError(err instanceof Error ? err.message : "Échec de l'envoi.");
        break;
      }
    }

    setBusy(false);
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  async function saveCaption(id: string) {
    setError(null);
    const res = await fetch(`/institution_photos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption: captions[id] || null }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? `Légende non enregistrée (${res.status})`);
      return;
    }
    router.refresh();
  }

  async function deletePhoto(photo: AdminPhoto) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/institution_photos/${photo.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `Suppression refusée (${res.status})`);
        setBusy(false);
        return;
      }
      // La ligne est partie : le fichier peut suivre sans risque de laisser
      // une fiche pointant vers une image absente.
      if (photo.storagePath) await removeObject(photo.storagePath).catch(() => {});
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-card border border-glass-border bg-background p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">
            Photos{" "}
            <span className="font-normal text-muted">({photos.length})</span>
          </h2>
          <p className="mt-1 text-xs text-muted">
            Envoi multiple. Chaque image est redimensionnée à 1200 px et
            convertie en WebP avant l&apos;envoi.
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-button border border-glass-border bg-glass-1 px-3 py-2 text-sm outline-none transition-colors duration-150 ease-out hover:bg-glass-2 focus-within:ring-2 focus-within:ring-primary">
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <ImagePlus className="h-4 w-4" aria-hidden />
          )}
          Ajouter des photos
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            disabled={busy}
            onChange={onPick}
          />
        </label>
      </div>

      {progress && <p className="text-xs text-muted">{progress}</p>}

      {photos.length === 0 ? (
        <p className="text-sm text-muted">
          Aucune photo. La galerie n&apos;apparaîtra pas sur la fiche publique
          tant qu&apos;aucune photo n&apos;est approuvée.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-2 rounded-card border border-glass-border bg-glass-1 p-3"
            >
              <div className="relative aspect-video overflow-hidden rounded-button bg-glass-2">
                <Image
                  src={p.photoUrl}
                  alt={p.caption ?? ""}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                  unoptimized
                />
              </div>

              <ReviewBadge status={p.reviewStatus} />

              <label className="sr-only" htmlFor={`caption-${p.id}`}>
                Légende
              </label>
              <input
                id={`caption-${p.id}`}
                value={captions[p.id] ?? ""}
                placeholder="Légende (optionnelle)"
                onChange={(e) =>
                  setCaptions((c) => ({ ...c, [p.id]: e.target.value }))
                }
                onBlur={() => saveCaption(p.id)}
                className="w-full rounded-input border border-glass-border bg-background px-3 py-1.5 text-xs text-foreground outline-none transition-[border-color] duration-150 ease-out placeholder:text-muted-dark focus:border-primary"
              />

              {canDelete && (
                <button
                  type="button"
                  onClick={() => deletePhoto(p)}
                  disabled={busy}
                  className="inline-flex w-fit items-center gap-1.5 rounded-button border border-error/30 bg-error/10 px-2.5 py-1 text-xs font-medium text-error outline-none transition-opacity duration-150 ease-out hover:opacity-80 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Trash2 className="h-3 w-3" aria-hidden />
                  Supprimer
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="rounded-card border border-error/30 bg-error/10 p-3 text-sm text-error">
          {error}
        </p>
      )}
    </section>
  );
}
