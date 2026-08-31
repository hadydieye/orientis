-- Étend contributeur_update_own_pending aux 5 tables restantes du catalogue.
--
-- Jusqu'ici cette policy n'existait que sur institutions : ailleurs, seule
-- admin_update autorisait un UPDATE. Un CONTRIBUTEUR ne pouvait donc pas
-- corriger sa propre soumission après l'avoir envoyée.
--
-- Clauses identiques à celles d'institutions :
--   using      -> quelles lignes existantes il peut viser
--   with check -> à quoi la ligne doit ressembler APRÈS modification
--
-- Le `with check` impose review_status = 'pending' sur la ligne résultante :
-- un contributeur ne peut donc pas s'auto-approuver en passant son propre
-- review_status à 'approved'. La modération reste le monopole des routes
-- approve / reject, couvertes par admin_update.
--
-- Une fois la ligne approuvée ou rejetée, la clause `using` ne la sélectionne
-- plus : elle devient intouchable pour son auteur, seul un admin peut encore
-- la modifier.
--
-- Les policies UPDATE permissives se combinent en OR : admin_update continue
-- de donner aux admins l'accès complet, sur toutes les lignes.
--
-- Note sur l'existant : created_by est NULL sur les 306 lignes déjà en base
-- (semées via service_role, hors RLS). Cette policy ne change donc rien pour
-- elles — elle ne concerne que les contributions à venir.

create policy contributeur_update_own_pending on academic_units for update
  to authenticated
  using (created_by = auth.uid() and review_status = 'pending')
  with check (created_by = auth.uid() and review_status = 'pending');

create policy contributeur_update_own_pending on departments for update
  to authenticated
  using (created_by = auth.uid() and review_status = 'pending')
  with check (created_by = auth.uid() and review_status = 'pending');

create policy contributeur_update_own_pending on programs for update
  to authenticated
  using (created_by = auth.uid() and review_status = 'pending')
  with check (created_by = auth.uid() and review_status = 'pending');

create policy contributeur_update_own_pending on admission_requirements for update
  to authenticated
  using (created_by = auth.uid() and review_status = 'pending')
  with check (created_by = auth.uid() and review_status = 'pending');

create policy contributeur_update_own_pending on fees for update
  to authenticated
  using (created_by = auth.uid() and review_status = 'pending')
  with check (created_by = auth.uid() and review_status = 'pending');
