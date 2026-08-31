-- Correctif découvert en test : INSERT/UPDATE avec RETURNING (Prefer: return=representation,
-- utilisé par .select().single() côté supabase-js) applique aussi la policy SELECT à la ligne
-- retournée. Une ligne 'pending' fraîchement créée par un CONTRIBUTEUR ne satisfait pas
-- public_read (review_status = 'approved'), donc POST /institutions et PATCH /institutions/:id
-- échouaient en 42501 bien que l'insert/update lui-même soit autorisé.
--
-- On ajoute une policy SELECT supplémentaire (les policies SELECT se combinent en OR) :
-- l'auteur voit toujours ses propres lignes, et un ADMIN voit tout (nécessaire pour la
-- modération, y compris les items encore en attente).

create policy select_own_or_admin on institutions for select
  to authenticated
  using (created_by = auth.uid() or public.has_role('admin'));
