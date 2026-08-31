-- Écriture sur sources : réservée aux ADMIN.
--
-- L'état avant cette migration, constaté par test avec une session admin :
--   INSERT -> 201  (policy admin_insert déjà en place)
--   UPDATE -> 200 avec un tableau VIDE, la ligne est inchangée
--   DELETE -> 200 avec un tableau VIDE, la ligne survit
--
-- Autrement dit, les deux échouaient SILENCIEUSEMENT en ayant l'air de
-- réussir — le même piège que sur les tables du catalogue avant
-- admin_delete_policies. Les handlers renvoient déjà une erreur explicite
-- dans ce cas ; cette migration leur donne le droit correspondant.
--
-- Pas de policy pour les contributeurs : la création d'une source reste
-- réservée aux admins (décision prise avec le formulaire
-- admission_requirements, qui ne propose que des sources existantes). Une
-- source est ce qui porte la traçabilité de tout le catalogue : la laisser
-- créer librement viderait le dispositif de son sens.
--
-- La lecture reste publique (policy public_read de la migration initiale) :
-- les fiches publiques affichent le label et la fiabilité de leurs sources.

create policy admin_update on sources for update
  to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

-- La suppression reste en outre bloquée par les clés étrangères :
-- admission_requirements.source_id et fees.source_id sont en
-- `on delete restrict`. Le handler compte les références AVANT de tenter la
-- suppression, pour renvoyer un message lisible plutôt qu'une violation de
-- contrainte brute.
create policy admin_delete on sources for delete
  to authenticated
  using (public.has_role('admin'));
