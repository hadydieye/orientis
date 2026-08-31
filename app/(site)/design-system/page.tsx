import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassPanel } from "@/components/ui/GlassPanel";

const swatches = [
  { name: "background", var: "--background" },
  { name: "background-secondary", var: "--background-secondary" },
  { name: "background-tertiary", var: "--background-tertiary" },
  { name: "primary", var: "--primary" },
  { name: "secondary", var: "--secondary" },
  { name: "accent", var: "--accent" },
  { name: "highlight", var: "--highlight" },
  { name: "foreground", var: "--foreground" },
  { name: "muted", var: "--muted" },
  { name: "muted-dark", var: "--muted-dark" },
  { name: "success", var: "--success" },
  { name: "warning", var: "--warning" },
  { name: "error", var: "--error" },
];

function Section({
  title,
  delay = 0,
  children,
}: {
  title: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <section
      className="animate-fade-in-up flex flex-col gap-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-4 pb-24 sm:px-6">
      <div className="animate-fade-in-up flex flex-col gap-2">
        <h1 className="text-3xl font-bold sm:text-4xl">Aurora Glass</h1>
        <p className="max-w-xl text-muted">
          Fondations du design system Orientis — tokens et composants de
          base, à valider visuellement avant de construire les pages.
        </p>
      </div>

      <Section title="Couleurs" delay={40}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {swatches.map((s) => (
            <div key={s.name} className="flex flex-col gap-2">
              <div
                className="h-16 rounded-card border border-glass-border"
                style={{ background: `var(${s.var})` }}
              />
              <span className="text-xs text-muted">{s.name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Boutons" delay={80}>
        <div className="flex flex-wrap items-center gap-4">
          <GlassButton variant="primary">Trouver ma voie</GlassButton>
          <GlassButton variant="secondary">En savoir plus</GlassButton>
          <GlassButton variant="primary" disabled>
            Indisponible
          </GlassButton>
        </div>
      </Section>

      <Section title="Champs de saisie" delay={120}>
        <div className="flex max-w-sm flex-col gap-3">
          <GlassInput placeholder="Rechercher une formation..." />
          <GlassInput placeholder="Champ désactivé" disabled />
        </div>
      </Section>

      <Section title="Badges" delay={160}>
        <div className="flex flex-wrap gap-3">
          <GlassBadge variant="neutral">Neutre</GlassBadge>
          <GlassBadge variant="success">Admissible</GlassBadge>
          <GlassBadge variant="warning">À vérifier</GlassBadge>
          <GlassBadge variant="error">Complet</GlassBadge>
        </div>
      </Section>

      <Section title="Cartes (GlassCard)" delay={200}>
        <div className="grid gap-4 sm:grid-cols-3">
          <GlassCard variant="1" className="p-5">
            <h3 className="font-semibold">Variant 1</h3>
            <p className="mt-1 text-sm text-muted">
              Fond glass-1, le plus discret. Survolez pour voir l&apos;effet
              de lift.
            </p>
          </GlassCard>
          <GlassCard variant="2" className="p-5">
            <h3 className="font-semibold">Variant 2</h3>
            <p className="mt-1 text-sm text-muted">
              Fond glass-2, un cran plus visible.
            </p>
          </GlassCard>
          <GlassCard variant="3" className="p-5">
            <h3 className="font-semibold">Variant 3</h3>
            <p className="mt-1 text-sm text-muted">
              Fond glass-3, pour les cartes mises en avant.
            </p>
          </GlassCard>
        </div>
        <p className="text-xs text-muted-dark">
          Pour les listes denses de petites cartes, passez{" "}
          <code className="rounded bg-glass-2 px-1 py-0.5">blur={"{"}false{"}"}</code>{" "}
          — fond plat sans backdrop-blur, pour la performance mobile.
        </p>
      </Section>

      <Section title="Panneau (GlassPanel)" delay={240}>
        <GlassPanel variant="2" className="p-8">
          <h3 className="text-lg font-semibold">
            Section de contenu plus large
          </h3>
          <p className="mt-2 max-w-xl text-sm text-muted">
            GlassPanel reprend le même traitement visuel que GlassCard avec un
            radius plus généreux (24px), pensé pour des sections entières
            plutôt que des éléments de liste.
          </p>
        </GlassPanel>
      </Section>
    </main>
  );
}
