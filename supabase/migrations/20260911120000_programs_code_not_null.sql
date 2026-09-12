-- Verrouillage de programs.code après l'import des 200 formations 2026.
--
-- La contrainte d'unicité (programs_code_key) avait été posée avec le schéma
-- ParcourSup ; l'obligation de présence ne pouvait pas l'être tant que les 121
-- programs 2025, dont le code était null, étaient encore en base.
alter table public.programs
  alter column code set not null;
