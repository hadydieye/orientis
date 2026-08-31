import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FinalCta } from "@/components/home/FinalCta";
import { Hero } from "@/components/home/Hero";
import { InstitutionCard } from "@/components/home/InstitutionCard";
import { Section } from "@/components/home/Section";
import { StatsBar } from "@/components/home/StatsBar";
import { getHomeData } from "@/lib/queries/home";

// Landing publique : régénérée en arrière-plan plutôt que rendue à chaque
// requête — le public cible est sur mobile bas de gamme et connexion instable.
export const revalidate = 3600;

export default async function Home() {
  const { stats, categories, popularInstitutions, cityCounts } =
    await getHomeData();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-20 px-4 pb-24 sm:gap-24 sm:px-6">
      <Hero cities={cityCounts} />

      <Section delay={80} aria-label="Chiffres clés">
        <StatsBar stats={stats} />
      </Section>

      <Section delay={160} className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">
            Explorer par catégorie
          </h2>
          <p className="mt-2 text-sm text-muted sm:text-base">
            Les filières les mieux représentées dans le catalogue, par unité de
            rattachement.
          </p>
        </div>
        <CategoryGrid categories={categories} />
      </Section>

      <Section delay={240} className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">
            Établissements populaires
          </h2>
          <p className="mt-2 text-sm text-muted sm:text-base">
            Les établissements dont le catalogue est le plus fourni.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popularInstitutions.map((institution) => (
            <InstitutionCard key={institution.id} institution={institution} />
          ))}
        </div>
      </Section>

      <Section delay={320}>
        <FinalCta />
      </Section>
    </main>
  );
}
