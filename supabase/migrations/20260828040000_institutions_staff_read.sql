-- Lecture des contributions en attente par le personnel du back-office.
--
-- État avant cette migration, sur institutions (les policies SELECT se
-- combinent en OR) :
--   * public_read          -> review_status = 'approved'
--   * select_own_or_admin  -> created_by = auth.uid() OR has_role('admin')
--
-- Un ADMIN voyait donc déjà toutes les lignes, y compris 'pending'. En
-- revanche un CONTRIBUTEUR ne voyait que ses propres soumissions : il ne
-- pouvait pas consulter la file de modération complète.
--
-- On ajoute une policy dédiée au personnel, qui couvre explicitement les deux
-- rôles via has_role(), conformément au besoin du back-office.
--
-- Portée : cette policy élargit la visibilité — un contributeur verra les
-- soumissions des autres contributeurs, pas seulement les siennes.

create policy staff_read_all on institutions for select
  to authenticated
  using (public.has_role('admin') or public.has_role('contributeur'));
