-- ============================================================================
-- POLICE-OS // Schema Supabase
-- Exécuter dans l'ordre : Editor > SQL Editor > New Query > Run
-- ============================================================================

-- -----------------------------------------------------------------------------
-- 1. PROFILS UTILISATEURS (étend auth.users avec grade + rôle RP)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  badge           text unique not null,               -- "4472"
  grade           text not null default 'Inspecteur', -- "Inspecteur", "Commissaire"...
  nom             text not null,
  role            text not null default 'investigator'
                  check (role in ('investigator', 'mj')),
  created_at      timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Tous les enquêteurs voient tous les profils"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Un utilisateur édite son propre profil"
  on public.profiles for update
  using (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- 2. EMPREINTES (base AFIS)
-- -----------------------------------------------------------------------------
create table public.fingerprints (
  id              uuid primary key default gen_random_uuid(),
  filename        text not null,                     -- clé de matching
  storage_path    text not null,                     -- chemin dans le bucket
  nom             text not null,
  prenom          text,
  fiche           text,
  naissance       text,
  antecedents     text,
  notes           text,
  uploaded_by     uuid references public.profiles(id),
  created_at      timestamptz not null default now()
);

create index idx_fingerprints_filename on public.fingerprints (lower(filename));

alter table public.fingerprints enable row level security;

create policy "Tout enquêteur lit les empreintes"
  on public.fingerprints for select
  using (auth.role() = 'authenticated');

create policy "Seul un MJ upload/supprime"
  on public.fingerprints for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'mj'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'mj'));

-- -----------------------------------------------------------------------------
-- 3. ÉCOUTES TÉLÉPHONIQUES
-- -----------------------------------------------------------------------------
create table public.wiretaps (
  id              uuid primary key default gen_random_uuid(),
  filename        text not null,
  storage_path    text not null,
  suspect         text not null,
  ligne           text not null,                     -- "06 12 34 56 78"
  date_captation  text,                              -- libellé RP
  duree           text,                              -- "03:42"
  mandat          text,
  transcription   text,
  uploaded_by     uuid references public.profiles(id),
  created_at      timestamptz not null default now()
);

alter table public.wiretaps enable row level security;

create policy "Tout enquêteur lit les écoutes"
  on public.wiretaps for select
  using (auth.role() = 'authenticated');

create policy "Seul un MJ gère les écoutes"
  on public.wiretaps for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'mj'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'mj'));

-- -----------------------------------------------------------------------------
-- 4. CONVERSATIONS AVEC LE MAGISTRAT (historique sauvegardé)
-- -----------------------------------------------------------------------------
create table public.magistrat_conversations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  title           text not null default 'Nouvelle requête',
  archived        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_mag_conv_user on public.magistrat_conversations (user_id, updated_at desc);

create table public.magistrat_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.magistrat_conversations(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant', 'system')),
  content         text not null,
  created_at      timestamptz not null default now()
);

create index idx_mag_msg_conv on public.magistrat_messages (conversation_id, created_at);

alter table public.magistrat_conversations enable row level security;
alter table public.magistrat_messages enable row level security;

-- Un enquêteur ne voit QUE ses conversations. Les MJ voient tout (audit).
create policy "Propriétaire voit ses conversations"
  on public.magistrat_conversations for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'mj')
  );

create policy "Propriétaire crée et édite ses conversations"
  on public.magistrat_conversations for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Messages visibles si conversation accessible"
  on public.magistrat_messages for select
  using (
    exists (
      select 1 from public.magistrat_conversations c
      where c.id = conversation_id
      and (c.user_id = auth.uid()
           or exists (select 1 from public.profiles where id = auth.uid() and role = 'mj'))
    )
  );

create policy "Propriétaire insère des messages"
  on public.magistrat_messages for insert
  with check (
    exists (select 1 from public.magistrat_conversations
            where id = conversation_id and user_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- 5. TRIGGER : met à jour `updated_at` de la conversation à chaque message
-- -----------------------------------------------------------------------------
create or replace function public.touch_conversation()
returns trigger language plpgsql as $$
begin
  update public.magistrat_conversations
     set updated_at = now()
   where id = new.conversation_id;
  return new;
end;
$$;

create trigger trg_touch_conversation
after insert on public.magistrat_messages
for each row execute function public.touch_conversation();

-- -----------------------------------------------------------------------------
-- 6. TRIGGER : crée automatiquement un profile quand un user s'inscrit
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, badge, nom, grade, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'badge', substr(new.id::text, 1, 4)),
    coalesce(new.raw_user_meta_data->>'nom', 'Sans nom'),
    coalesce(new.raw_user_meta_data->>'grade', 'Inspecteur'),
    coalesce(new.raw_user_meta_data->>'role', 'investigator')
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 7. REALTIME : activer les souscriptions live sur les 3 tables partagées
-- -----------------------------------------------------------------------------
alter publication supabase_realtime add table public.fingerprints;
alter publication supabase_realtime add table public.wiretaps;
alter publication supabase_realtime add table public.magistrat_messages;
