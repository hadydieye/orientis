-- Moteur de recommandation : matching série/moyenne en base (réutilisable en SQL et via RPC).
-- SECURITY INVOKER (par défaut) : les tables programs/admission_requirements sont déjà en
-- lecture publique via RLS (policy public_read), aucun besoin de contourner RLS ici.

create or replace function public.recommend_programs(p_series text, p_average numeric)
returns setof programs
language sql
stable
as $$
  select distinct p.*
  from programs p
  join admission_requirements ar on ar.program_id = p.id
  where p_series = any(ar.accepted_series)
    and ar.min_average <= p_average
$$;
