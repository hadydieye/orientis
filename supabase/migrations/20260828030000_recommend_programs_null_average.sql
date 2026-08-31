-- Corrige recommend_programs : un seuil inconnu ne doit plus exclure la ligne.
--
-- Avant : `ar.min_average <= p_average`.
-- En SQL, `NULL <= 14` vaut NULL, donc toute formation dont le seuil n'est pas
-- renseigné était éliminée silencieusement du résultat — sans distinction entre
-- « seuil trop élevé » et « seuil inconnu ».
--
-- Après : min_average NULL est traité comme « aucun seuil connu », la formation
-- est donc proposée. Le front affiche « Seuil non communiqué » à la place
-- d'un chiffre, avec le même badge de fiabilité que les autres.

create or replace function public.recommend_programs(p_series text, p_average numeric)
returns setof programs
language sql
stable
as $$
  select distinct p.*
  from programs p
  join admission_requirements ar on ar.program_id = p.id
  where p_series = any(ar.accepted_series)
    and (ar.min_average is null or ar.min_average <= p_average)
$$;
