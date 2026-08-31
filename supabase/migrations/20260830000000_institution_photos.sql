-- Table des photos d'établissement + policies Storage du bucket
-- institution-images.
--
-- CHOIX : institution_photos porte son PROPRE review_status.
--
-- L'alternative — faire dépendre la visibilité d'une photo du seul statut de
-- l'établissement parent — est plus simple mais publie sans relecture. Une
-- image est le contenu contributeur le plus risqué du catalogue : contenu
-- offensant, photo sans droits, capture d'écran d'un tiers. Une erreur y est
-- plus visible et moins rattrapable qu'une faute de frappe dans un champ
-- texte. Un contributeur pourrait sinon ajouter une image publiée
-- immédiatement sur une fiche déjà approuvée, sans qu'aucun admin la voie.
--
-- Conserver review_status garde aussi le motif uniforme : la fabrique de
-- handlers (lib/api/crud.ts), RowActions et les filtres du back-office
-- fonctionnent sans cas particulier.
--
-- La visibilité publique exige les DEUX conditions : la photo approuvée ET
-- son établissement approuvé. Une fiche non publiée n'expose donc pas ses
-- images par la bande.

create table institution_photos (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete cascade,
  photo_url text not null,
  caption text,
  -- Chemin dans le bucket, conservé pour pouvoir supprimer le fichier :
  -- photo_url est une URL publique, dont le chemin n'est pas trivial à
  -- reconstituer de façon fiable.
  storage_path text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'rejected'))
);

create index institution_photos_institution_id_idx
  on institution_photos (institution_id);

alter table institution_photos enable row level security;

-- Lecture publique : photo approuvée ET établissement approuvé.
create policy public_read on institution_photos for select
  to anon, authenticated
  using (
    review_status = 'approved'
    and exists (
      select 1 from institutions i
      where i.id = institution_photos.institution_id
        and i.review_status = 'approved'
    )
  );

-- Le staff voit tout, y compris les photos en attente.
create policy staff_read_all on institution_photos for select
  to authenticated
  using (public.has_role('admin') or public.has_role('contributeur'));

create policy contributeur_insert on institution_photos for insert
  to authenticated
  with check (
    (public.has_role('contributeur') or public.has_role('admin'))
    and created_by = auth.uid()
    and review_status = 'pending'
  );

create policy contributeur_update_own_pending on institution_photos for update
  to authenticated
  using (created_by = auth.uid() and review_status = 'pending')
  with check (created_by = auth.uid() and review_status = 'pending');

create policy admin_update on institution_photos for update
  to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy admin_delete on institution_photos for delete
  to authenticated
  using (public.has_role('admin'));

-- =========================================================================
-- Policies Storage sur le bucket institution-images
-- =========================================================================
--
-- Ce sont des policies RLS sur storage.objects, pas sur une table publique :
-- elles ne peuvent pas être posées par l'API REST, seulement en SQL.
--
-- Le bucket est déclaré public : la lecture passe par le CDN sans consulter
-- storage.objects. La policy de SELECT ci-dessous ne sert donc que pour un
-- listing authentifié (l'API list() du client Storage), pas pour l'affichage
-- des images sur le site.
--
-- L'ÉCRITURE est réservée au staff. Sans ces policies, un utilisateur
-- authentifié sans rôle pourrait écrire dans le bucket : c'est le
-- comportement par défaut de Supabase Storage une fois le bucket créé.

create policy "institution_images_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'institution-images');

create policy "institution_images_staff_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'institution-images'
    and (public.has_role('admin') or public.has_role('contributeur'))
  );

create policy "institution_images_staff_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'institution-images'
    and (public.has_role('admin') or public.has_role('contributeur'))
  )
  with check (
    bucket_id = 'institution-images'
    and (public.has_role('admin') or public.has_role('contributeur'))
  );

-- Suppression réservée aux admins, comme admin_delete sur les tables du
-- catalogue : un contributeur peut ajouter une image, pas en effacer une.
create policy "institution_images_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'institution-images'
    and public.has_role('admin')
  );
