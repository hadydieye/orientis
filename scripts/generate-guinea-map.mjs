/**
 * Génère le tracé SVG de la Guinée à partir de données géographiques réelles.
 *
 * Source  : Natural Earth (domaine public) via le paquet npm `world-atlas`
 *           (countries-50m.json, TopoJSON).
 * Sortie  : components/home/guinea-geometry.ts — un path SVG statique + les
 *           villes déjà projetées.
 *
 * Le tracé est figé dans un fichier TS pour qu'aucune librairie géo
 * (d3-geo, topojson-client) ni aucun TopoJSON ne parte dans le bundle client.
 * Relancer avec :  node scripts/generate-guinea-map.mjs
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import { geoMercator, geoPath, geoContains } from "d3-geo";
import { feature } from "topojson-client";

const require = createRequire(import.meta.url);
const topology = require("world-atlas/countries-50m.json");

// ISO 3166-1 numérique. 324 = Guinée.
// À ne pas confondre avec 624 Guinée-Bissau, 226 Guinée équatoriale,
// 598 Papouasie-Nouvelle-Guinée.
const GUINEA_ID = "324";

const countries = feature(topology, topology.objects.countries);
const guinea = countries.features.find((f) => String(f.id) === GUINEA_ID);

if (!guinea) throw new Error(`Pays ${GUINEA_ID} introuvable dans countries-50m`);
if (guinea.properties?.name !== "Guinea") {
  throw new Error(
    `L'entité ${GUINEA_ID} s'appelle "${guinea.properties?.name}", pas "Guinea"`
  );
}

// Coordonnées GPS réelles des villes (lat, lon).
const CITIES = {
  Conakry: [9.6412, -13.5784],
  Kindia: [10.057, -12.865],
  Coyah: [9.7167, -13.3833],
  Boké: [10.9333, -14.3],
  Labé: [11.3167, -12.2833],
  Mamou: [10.3833, -12.0833],
  Dalaba: [10.7, -12.2833],
  Kankan: [10.3833, -9.3],
  Faranah: [10.0333, -10.75],
  "N'Zérékoré": [7.75, -8.8167],
};

const WIDTH = 320;
const PAD = 10;

// 1er passage : ajuster à la largeur pour déduire la hauteur naturelle.
const probe = geoMercator().fitWidth(WIDTH - PAD * 2, guinea);
const probeBounds = geoPath(probe).bounds(guinea);
const HEIGHT = Math.ceil(probeBounds[1][1] - probeBounds[0][1]) + PAD * 2;

// 2e passage : ajuster à la boîte finale, tracé et villes partagent la
// même projection — les points ne peuvent donc pas dériver du contour.
const projection = geoMercator().fitExtent(
  [
    [PAD, PAD],
    [WIDTH - PAD, HEIGHT - PAD],
  ],
  guinea
);

const d = geoPath(projection)(guinea).replace(/-?\d+\.\d+/g, (n) =>
  String(Math.round(Number(n) * 10) / 10)
);

const cities = Object.entries(CITIES).map(([name, [lat, lon]]) => {
  if (!geoContains(guinea, [lon, lat])) {
    throw new Error(`${name} (${lat}, ${lon}) tombe hors du polygone Guinée`);
  }
  const [x, y] = projection([lon, lat]);
  return { name, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
});

const out = `// GÉNÉRÉ — ne pas éditer à la main.
// Source : Natural Earth (domaine public) via world-atlas/countries-50m.json,
// pays ISO 3166-1 numérique 324 (Guinea), projection Mercator (d3-geo).
// Régénérer : node scripts/generate-guinea-map.mjs

export const GUINEA_VIEWBOX = "0 0 ${WIDTH} ${HEIGHT}";

export const GUINEA_PATH =
  "${d}";

/** Villes projetées avec la MÊME projection que le tracé. */
export const GUINEA_CITY_POINTS: Record<string, { x: number; y: number }> = {
${cities.map((c) => `  ${JSON.stringify(c.name)}: { x: ${c.x}, y: ${c.y} },`).join("\n")}
};
`;

fs.writeFileSync("components/home/guinea-geometry.ts", out);

console.log(`✓ ${guinea.properties.name} (id ${guinea.id})`);
console.log(`  viewBox 0 0 ${WIDTH} ${HEIGHT}`);
console.log(`  path : ${d.length} caractères`);
console.log(`  villes projetées et vérifiées dans le polygone : ${cities.length}`);
for (const c of cities) console.log(`    ${c.name.padEnd(12)} x=${c.x} y=${c.y}`);
