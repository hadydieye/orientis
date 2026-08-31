/**
 * Compression d'image côté navigateur.
 *
 * Module volontairement sans dépendance (pas de client Supabase, pas de
 * React) : il n'utilise que des API du navigateur, ce qui le rend chargeable
 * tel quel dans un navigateur de test. Le code testé est donc exactement le
 * code livré.
 */

/** Largeur maximale après redimensionnement. Au-delà, aucun gain visible sur
 *  une fiche d'établissement, et le poids explose sur connexion instable. */
export const MAX_WIDTH = 1200;
const QUALITY = 0.82;

export type CompressedImage = {
  blob: Blob;
  ext: string;
  contentType: string;
  width: number;
  height: number;
  /** Poids d'origine, pour afficher le gain à l'utilisateur. */
  originalBytes: number;
  /** true si l'original a été conservé tel quel, le ré-encodage l'ayant alourdi. */
  passthrough: boolean;
};

/**
 * Redimensionne et recompresse une image avant tout envoi.
 *
 * WebP quand le navigateur sait l'encoder, JPEG sinon — `toBlob` renvoie
 * silencieusement du PNG si on lui demande un type non supporté, d'où la
 * vérification du type réellement produit plutôt qu'une confiance aveugle.
 *
 * Une image déjà plus étroite que MAX_WIDTH n'est pas agrandie : on la
 * recompresse seulement.
 */
const PASSTHROUGH: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export async function compressImage(file: Blob): Promise<CompressedImage> {
  const bitmap = await createImageBitmap(file);
  const bitmapWidth = bitmap.width;
  const bitmapHeight = bitmap.height;
  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible dans ce navigateur.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", QUALITY)
  );

  let encoded = blob && blob.type === "image/webp" ? blob : null;
  let ext = "webp";
  let contentType = "image/webp";

  if (!encoded) {
    // Repli JPEG : le navigateur n'a pas encodé en WebP.
    const jpeg = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY)
    );
    if (!jpeg) throw new Error("Échec de la compression de l'image.");
    encoded = jpeg;
    ext = "jpg";
    contentType = "image/jpeg";
  }

  // Le ré-encodage peut GROSSIR le fichier : cas courant d'un logo, PNG
  // d'aplats que la compression sans perte gère mieux que le WebP avec perte.
  // Mesuré dans Chrome : un PNG de 70 ko ressortait à 139 ko.
  //
  // On garde alors l'original — mais SEULEMENT s'il n'avait pas besoin d'être
  // redimensionné. Au-delà de MAX_WIDTH, la version réduite l'emporte même si
  // elle pèse plus lourd : une image de 3000x2000 coûte 24 Mo de bitmap à
  // décoder, ce qui compte davantage que quelques dizaines de kilo-octets sur
  // les appareils Android d'entrée de gamme visés.
  const passthroughExt = PASSTHROUGH[file.type];
  if (scale === 1 && passthroughExt && file.size <= encoded.size) {
    return {
      blob: file,
      ext: passthroughExt,
      contentType: file.type,
      width: bitmapWidth,
      height: bitmapHeight,
      originalBytes: file.size,
      passthrough: true,
    };
  }

  return {
    blob: encoded, ext, contentType,
    width, height, originalBytes: file.size, passthrough: false,
  };
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} ko`;
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
}
