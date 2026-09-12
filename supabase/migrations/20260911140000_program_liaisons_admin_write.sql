-- Écriture admin sur les deux tables de liaison des formations.
--
-- Les 6 tables créées avec le schéma ParcourSup n'ont qu'une policy de lecture
-- publique : l'import les remplit avec la clé service role, qui contourne RLS.
-- Le back-office, lui, passe par le client authentifié : sans policy
-- d'écriture, le formulaire « Formation » ne pouvait pas enregistrer les
-- établissements rattachés ni les profils d'entrée.
--
-- Portée volontairement limitée à `program_institutions` et `program_profils`,
-- les deux seules tables éditées depuis l'interface. `competences`, `metiers`,
-- `secteurs` et `employeurs` restent en lecture seule : elles sont alimentées
-- par l'import et n'ont pas d'écran de saisie.
--
-- Admin uniquement, à la différence des tables de catalogue : ces lignes n'ont
-- ni `review_status` ni `created_by`, donc le circuit de modération par
-- contributeur ne peut pas s'y appliquer.

create policy admin_insert on public.program_institutions
  for insert to authenticated with check (has_role('admin'));
create policy admin_delete on public.program_institutions
  for delete to authenticated using (has_role('admin'));

create policy admin_insert on public.program_profils
  for insert to authenticated with check (has_role('admin'));
create policy admin_delete on public.program_profils
  for delete to authenticated using (has_role('admin'));
