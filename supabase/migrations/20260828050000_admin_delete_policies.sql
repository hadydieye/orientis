-- Policies DELETE pour les ADMIN sur les 6 tables du catalogue.
--
-- Découvert en test : sans policy DELETE, PostgREST renvoie HTTP 200 avec un
-- tableau VIDE et la ligne reste en base. La suppression échoue donc
-- silencieusement, en ayant l'air d'avoir réussi — c'est le pire des cas.
--
-- Le handler DELETE (lib/api/crud.ts) détecte déjà ce cas et renvoie un 403
-- explicite plutôt qu'un faux succès. Une fois cette migration appliquée, il
-- renverra 200 avec le nombre de lignes réellement supprimées.
--
-- Réservé aux ADMIN : un contributeur peut soumettre et corriger sa
-- contribution tant qu'elle est en attente, mais jamais supprimer une ligne.
--
-- Attention aux suppressions en cascade déjà définies dans le schéma initial :
-- supprimer une academic_unit supprime ses departments, donc ses programs,
-- donc leurs admission_requirements et fees (on delete cascade).

create policy admin_delete on institutions for delete
  to authenticated using (public.has_role('admin'));

create policy admin_delete on academic_units for delete
  to authenticated using (public.has_role('admin'));

create policy admin_delete on departments for delete
  to authenticated using (public.has_role('admin'));

create policy admin_delete on programs for delete
  to authenticated using (public.has_role('admin'));

create policy admin_delete on admission_requirements for delete
  to authenticated using (public.has_role('admin'));

create policy admin_delete on fees for delete
  to authenticated using (public.has_role('admin'));
