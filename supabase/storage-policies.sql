-- ============================================================================
-- POLITIQUES STORAGE (à exécuter après avoir créé les 2 buckets)
-- ============================================================================
--
-- AVANT : créer dans Dashboard > Storage :
--   1. bucket "fingerprints" (Public: OFF)
--   2. bucket "wiretaps"     (Public: OFF)
-- ============================================================================

-- Lecture : tout enquêteur authentifié
create policy "Lecture empreintes authentifiés"
  on storage.objects for select
  using (bucket_id = 'fingerprints' and auth.role() = 'authenticated');

create policy "Lecture écoutes authentifiés"
  on storage.objects for select
  using (bucket_id = 'wiretaps' and auth.role() = 'authenticated');

-- Écriture / suppression : MJ uniquement
create policy "MJ upload empreintes"
  on storage.objects for insert
  with check (
    bucket_id = 'fingerprints'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'mj')
  );

create policy "MJ supprime empreintes"
  on storage.objects for delete
  using (
    bucket_id = 'fingerprints'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'mj')
  );

create policy "MJ upload écoutes"
  on storage.objects for insert
  with check (
    bucket_id = 'wiretaps'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'mj')
  );

create policy "MJ supprime écoutes"
  on storage.objects for delete
  using (
    bucket_id = 'wiretaps'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'mj')
  );
