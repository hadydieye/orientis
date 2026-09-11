-- Le moteur de recommandation passe du couple (série, moyenne) au profil
-- d'entrée ParcourSup.
--
-- L'ancienne version joignait admission_requirements pour comparer la moyenne
-- du candidat à un seuil minimal. Cette table est vide depuis le remplacement
-- des données 2025 : la fonction renvoyait 0 ligne quels que soient ses
-- arguments. Aucune donnée 2026 ne porte de seuil d'admission, donc p_average
-- n'a plus rien derrière lui et disparaît de la signature.
--
-- Le filtrage est STRICT sur le profil demandé : SE ne ramène pas SE-FA. La
-- signification exacte du suffixe -FA n'est pas documentée par la source, et
-- élargir le filtre sans la connaître reviendrait à inventer une équivalence.

drop function if exists public.recommend_programs(text, numeric);

create function public.recommend_programs(p_profil public.profil_entree)
returns setof public.programs
language sql
stable
as $$
  select p.*
  from public.programs p
  join public.program_profils pp on pp.program_id = p.id
  where pp.profil = p_profil
  order by p.name;
$$;
