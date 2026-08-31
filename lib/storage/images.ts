import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/storage/compress";

export { compressImage, formatBytes, MAX_WIDTH } from "@/lib/storage/compress";
export type { CompressedImage } from "@/lib/storage/compress";

export const BUCKET = "institution-images";

/** URL publique d'un objet du bucket. */
export function publicUrl(path: string) {
  return createClient().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Envoie le logo à `{institution_id}/logo.{ext}`.
 *
 * Le chemin est déterministe et `upsert` est actif : remplacer un logo écrase
 * le fichier précédent au lieu d'accumuler des orphelins. L'extension pouvant
 * changer (webp -> jpg), les anciennes variantes sont retirées d'abord.
 */
export async function uploadLogo(institutionId: string, file: File) {
  const supabase = createClient();
  const image = await compressImage(file);
  const path = `${institutionId}/logo.${image.ext}`;

  const stale = ["webp", "jpg", "jpeg", "png"]
    .filter((e) => e !== image.ext)
    .map((e) => `${institutionId}/logo.${e}`);
  await supabase.storage.from(BUCKET).remove(stale);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, image.blob, { contentType: image.contentType, upsert: true });
  if (error) throw new Error(error.message);

  // Paramètre de version : l'URL publique étant stable, le CDN et le
  // navigateur serviraient sinon l'ancienne image après un remplacement.
  return { path, url: `${publicUrl(path)}?v=${Date.now()}`, image };
}

/** Envoie une photo à `{institution_id}/photos/{uuid}.{ext}`. */
export async function uploadPhoto(institutionId: string, file: File) {
  const supabase = createClient();
  const image = await compressImage(file);
  const path = `${institutionId}/photos/${crypto.randomUUID()}.${image.ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, image.blob, { contentType: image.contentType, upsert: false });
  if (error) throw new Error(error.message);

  return { path, url: publicUrl(path), image };
}

/**
 * Supprime un objet du bucket.
 *
 * Attention : l'URL publique passe par un CDN. Après suppression, l'objet est
 * bien absent du stockage (404 en accès direct authentifié, absent du
 * listing), mais son URL publique continue de répondre 200 depuis le cache de
 * bordure pendant un temps. Ce n'est pas un problème ici :
 *  - une photo supprimée disparaît de la galerie parce que sa ligne
 *    institution_photos a disparu, pas parce que le fichier a disparu ;
 *  - un logo remplacé reçoit une URL avec `?v=` neuf, qui contourne le cache ;
 *  - les photos sont écrites sous un uuid, donc jamais réécrites.
 * Seul quelqu'un qui détient déjà l'URL exacte peut encore voir la copie
 * cachée.
 */
export async function removeObject(path: string) {
  const { error } = await createClient().storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}
