import {
  GUINEA_CITY_POINTS,
  GUINEA_PATH,
  GUINEA_VIEWBOX,
} from "@/components/home/guinea-geometry";
import type { CityCount } from "@/lib/queries/home";

// Le tracé et les coordonnées des villes viennent de components/home/
// guinea-geometry.ts, généré depuis Natural Earth (domaine public).
// Ici on ne fait que décider de quel côté poser chaque label, pour éviter
// que les villes proches (Conakry/Coyah, Dalaba/Mamou) se chevauchent.
const LABEL_LAYOUT: Record<string, { anchor: "start" | "end"; dy?: number }> = {
  Conakry: { anchor: "end" },
  Coyah: { anchor: "start", dy: 9 },
  Kindia: { anchor: "end" },
  Boké: { anchor: "start" },
  Labé: { anchor: "start" },
  Dalaba: { anchor: "end" },
  Mamou: { anchor: "start" },
  Faranah: { anchor: "start" },
  Kankan: { anchor: "start" },
  "N'Zérékoré": { anchor: "end" },
};

export function GuineaOutline({
  cities = [],
  className,
}: {
  cities?: CityCount[];
  className?: string;
}) {
  // On ne place que les villes réellement présentes en base ET dont on a
  // la position projetée. Une ville inconnue est ignorée plutôt que mal placée.
  const placed = cities.flatMap((city) => {
    const point = GUINEA_CITY_POINTS[city.city];
    if (!point) return [];
    const layout = LABEL_LAYOUT[city.city] ?? { anchor: "start" as const };
    return [{ ...city, ...point, ...layout }];
  });

  return (
    <svg
      viewBox={GUINEA_VIEWBOX}
      fill="none"
      aria-hidden
      className={className}
      role="presentation"
    >
      <defs>
        <linearGradient id="guinea-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--secondary)" />
          <stop offset="100%" stopColor="var(--primary)" />
        </linearGradient>
      </defs>

      {/* Glow diffus sous le contour. */}
      <path
        d={GUINEA_PATH}
        stroke="url(#guinea-stroke)"
        strokeWidth="5"
        strokeLinejoin="round"
        opacity="0.3"
        style={{ filter: "blur(9px)" }}
      />
      {/* Intérieur à peine teinté — pas d'aplat. */}
      <path d={GUINEA_PATH} fill="url(#guinea-stroke)" opacity="0.05" />
      {/* Contour fin net. */}
      <path
        d={GUINEA_PATH}
        stroke="url(#guinea-stroke)"
        strokeWidth="1"
        strokeLinejoin="round"
        opacity="0.7"
      />

      {placed.map((city) => {
        const offset = city.anchor === "start" ? 5.5 : -5.5;
        return (
          // pointer-events-auto : le SVG parent est en pointer-events-none pour
          // ne pas gêner la sélection du texte du Hero ; seuls les points
          // réagissent au survol.
          <g key={city.city} className="group/city pointer-events-auto">
            {/* React 19 n'accepte qu'un unique enfant texte dans <title> :
                un tableau d'enfants sortirait vide. */}
            <title>{`${city.city} — ${city.institutionCount} établissement${
              city.institutionCount > 1 ? "s" : ""
            }`}</title>
            <circle
              cx={city.x}
              cy={city.y}
              r="5"
              className="fill-secondary opacity-15 transition-opacity duration-200 ease-out group-hover/city:opacity-40"
            />
            <circle
              cx={city.x}
              cy={city.y}
              r="1.8"
              className="fill-secondary opacity-75 transition-opacity duration-200 ease-out group-hover/city:opacity-100"
            />
            <text
              x={city.x + offset}
              y={city.y + (city.dy ?? 0)}
              dy="2.2"
              textAnchor={city.anchor}
              fontSize="7"
              className="fill-muted opacity-70 transition-opacity duration-200 ease-out group-hover/city:fill-foreground group-hover/city:opacity-100"
            >
              {city.city}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
