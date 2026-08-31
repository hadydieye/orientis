-- Orientis MVP — initial schema
-- Catalogue d'orientation universitaire (Guinée) : lecture publique, pas de multi-tenant.

-- =========================================================================
-- Référentiels indépendants
-- =========================================================================

create table sources (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  url text,
  source_type text not null check (source_type in ('officiel', 'etudiant', 'tiers')),
  verified_at date,
  status text not null default 'a_verifier' check (status in ('verifie', 'a_verifier', 'obsolete'))
);

create table academic_years (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  start_date date,
  end_date date,
  is_current boolean not null default false
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  accepted_format text
);

-- =========================================================================
-- Hiérarchie institutionnelle
-- =========================================================================

create table institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('public', 'prive')),
  status text not null check (status in ('universite', 'institut', 'ecole')),
  description text,
  city text,
  commune text,
  address text,
  phone text,
  email text,
  website text,
  facebook text,
  founded_year int,
  latitude numeric,
  longitude numeric,
  logo_url text,
  recognition_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Entité unifiée : faculté / institut / centre rattaché à une institution.
create table academic_units (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete cascade,
  name text not null,
  type text not null check (type in ('faculte', 'institut', 'centre')),
  description text,
  address text,
  contact text,
  website text,
  created_at timestamptz not null default now()
);

create table departments (
  id uuid primary key default gen_random_uuid(),
  academic_unit_id uuid not null references academic_units(id) on delete cascade,
  name text not null,
  description text,
  contact text,
  created_at timestamptz not null default now()
);

create table programs (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  name text not null,
  code text,
  description text,
  level text not null check (level in ('licence', 'master', 'doctorat', 'bts', 'autre')),
  domain text,
  specialty text,
  duration_years numeric,
  degree_awarded text,
  language text not null default 'fr',
  curriculum text,
  career_prospects text,
  further_studies text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================================
-- Admission, frais, procédures — versionnés par année académique
-- =========================================================================

create table admission_requirements (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  academic_year_id uuid not null references academic_years(id) on delete restrict,
  accepted_series text[],
  min_average numeric,
  subject_min_grades jsonb,
  age_limit int,
  requires_competition boolean,
  requires_interview boolean,
  other_conditions text,
  source_id uuid references sources(id) on delete restrict,
  verified_at date,
  unique (program_id, academic_year_id)
);

create table fees (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  academic_year_id uuid not null references academic_years(id) on delete restrict,
  fee_type text not null check (fee_type in ('inscription', 'scolarite', 'dossier', 'concours', 'autre')),
  amount numeric,
  currency text not null default 'GNF',
  frequency text not null check (frequency in ('unique', 'annuel', 'semestriel', 'mensuel')),
  conditions text,
  source_id uuid references sources(id) on delete restrict,
  verified_at date
);

create table application_procedures (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  academic_year_id uuid not null references academic_years(id) on delete restrict
);

create table application_steps (
  id uuid primary key default gen_random_uuid(),
  procedure_id uuid not null references application_procedures(id) on delete cascade,
  step_number int not null,
  title text not null,
  description text,
  cost numeric,
  link text,
  deadline date,
  is_mandatory boolean,
  unique (procedure_id, step_number)
);

create table program_documents (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  original_or_copy text not null check (original_or_copy in ('original', 'copie', 'indifferent')),
  is_mandatory boolean,
  unique (program_id, document_id)
);

-- =========================================================================
-- Index sur les clés étrangères
-- =========================================================================

create index idx_academic_units_institution_id on academic_units(institution_id);
create index idx_departments_academic_unit_id on departments(academic_unit_id);
create index idx_programs_department_id on programs(department_id);
create index idx_admission_requirements_program_id on admission_requirements(program_id);
create index idx_admission_requirements_academic_year_id on admission_requirements(academic_year_id);
create index idx_admission_requirements_source_id on admission_requirements(source_id);
create index idx_fees_program_id on fees(program_id);
create index idx_fees_academic_year_id on fees(academic_year_id);
create index idx_fees_source_id on fees(source_id);
create index idx_application_procedures_program_id on application_procedures(program_id);
create index idx_application_procedures_academic_year_id on application_procedures(academic_year_id);
create index idx_application_steps_procedure_id on application_steps(procedure_id);
create index idx_program_documents_program_id on program_documents(program_id);
create index idx_program_documents_document_id on program_documents(document_id);

-- =========================================================================
-- Row Level Security — catalogue en lecture publique
-- =========================================================================

alter table institutions enable row level security;
alter table academic_units enable row level security;
alter table departments enable row level security;
alter table programs enable row level security;
alter table admission_requirements enable row level security;
alter table fees enable row level security;
alter table application_procedures enable row level security;
alter table application_steps enable row level security;
alter table documents enable row level security;
alter table program_documents enable row level security;
alter table sources enable row level security;
alter table academic_years enable row level security;

create policy public_read on institutions for select using (true);
create policy public_read on academic_units for select using (true);
create policy public_read on departments for select using (true);
create policy public_read on programs for select using (true);
create policy public_read on admission_requirements for select using (true);
create policy public_read on fees for select using (true);
create policy public_read on application_procedures for select using (true);
create policy public_read on application_steps for select using (true);
create policy public_read on documents for select using (true);
create policy public_read on program_documents for select using (true);
create policy public_read on sources for select using (true);
create policy public_read on academic_years for select using (true);
