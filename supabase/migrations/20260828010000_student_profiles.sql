-- Profil étudiant : visiteur anonyme (user_id null) ou utilisateur authentifié (user_id = auth.uid()).

create table student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  series text,
  average numeric,
  subject_grades jsonb,
  interests text[],
  city text,
  budget numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table student_profiles enable row level security;

-- Pas de policy publique : un visiteur non authentifié n'a pas d'auth.uid(), donc aucune
-- de ces policies ne peut matcher une ligne anonyme (user_id is null). L'accès aux lignes
-- anonymes est géré côté application par la route /profile via le client service_role,
-- l'identifiant de la ligne étant renvoyé au visiteur dans un cookie httpOnly.
create policy select_own on student_profiles for select
  to authenticated
  using (user_id = auth.uid());

create policy insert_own on student_profiles for insert
  to authenticated
  with check (user_id = auth.uid());

create policy update_own on student_profiles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
