-- Administration des rôles : lecture et écriture de user_roles par les admins.
--
-- État avant : la seule policy était select_own_roles (chacun voit sa propre
-- ligne). Aucune policy INSERT / DELETE — attribuer un rôle passait donc
-- forcément par du SQL manuel dans le dashboard, ou par la clé service_role.
--
-- Sur la récursion, qui est la vraie question ici :
-- poser une policy sur user_roles qui appelle has_role() revient à interroger
-- user_roles depuis une policy sur user_roles. Ce serait récursif si has_role
-- était une fonction ordinaire. Elle est SECURITY DEFINER : son SELECT
-- s'exécute avec les droits du propriétaire de la fonction, pour qui RLS ne
-- s'applique pas (la table n'est pas en FORCE ROW LEVEL SECURITY). La policy
-- n'est donc pas réévaluée à l'intérieur — pas de boucle.
--
-- C'est le point que la note de lib/queries/admin.ts laissait en suspens.
--
-- Sans UPDATE : un rôle s'ajoute ou se retire, il ne se modifie pas. La
-- contrainte unique (user_id, role) rend d'ailleurs un UPDATE équivalent à un
-- couple delete + insert.

create policy admin_read_all on user_roles for select
  to authenticated
  using (public.has_role('admin'));

create policy admin_insert on user_roles for insert
  to authenticated
  with check (public.has_role('admin'));

create policy admin_delete on user_roles for delete
  to authenticated
  using (public.has_role('admin'));

-- Note : le garde-fou « ne pas retirer le dernier admin » n'est PAS ici.
-- Une policy ne peut pas raisonner sur l'état global de la table après
-- l'opération sans un trigger, et un trigger renverrait une erreur brute.
-- Le contrôle vit dans le handler (app/admin/users/[id]/roles/[role]/route.ts),
-- qui compte les admins avant d'agir et renvoie un 409 explicite.
