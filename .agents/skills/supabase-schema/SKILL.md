---
name: supabase-schema
description: Canonical schema for site_content, leads, projects, project_updates tables. Use whenever writing Supabase queries, migrations, or executor functions for this project.
---

# Supabase Backend Schema

This skill defines the canonical database schema, triggers, and row-level security (RLS) policies for the Spatial Web Headquarters project. Use this reference when writing database migrations, Supabase queries, or executor functions in the backend.

## 1. Full Schema (DDL)

```sql
-- ============================================
-- EXTENSIONS
-- ============================================
create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ============================================
-- TABLE: site_content
-- Drives all editable text on the spatial site
-- ============================================
create table site_content (
  section_id   text primary key,
  content      text not null default '',
  updated_at   timestamptz not null default now()
);

comment on table site_content is 'Key-value content blocks rendered on the spatial site overlays. section_id examples: hero_heading, hero_subheading, services_heading, service_web_design, about_heading, about_bio.';

-- ============================================
-- TABLE: leads
-- Captured from the Contact overlay lead form
-- ============================================
create table leads (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text not null,
  message      text,
  status       text not null default 'new'
               check (status in ('new', 'contacted', 'converted')),
  created_at   timestamptz not null default now()
);

create index idx_leads_status on leads (status);
create index idx_leads_created_at on leads (created_at desc);

-- ============================================
-- TABLE: projects
-- Client project/order records, drives status tracker
-- ============================================
create table projects (
  id           uuid primary key default gen_random_uuid(),
  client_name  text not null,
  status       text not null default 'received'
               check (status in ('received', 'in_progress', 'review', 'completed')),
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_projects_client_name on projects (client_name);
create index idx_projects_status on projects (status);

-- ============================================
-- TABLE: project_updates (P2 stretch — status history)
-- ============================================
create table project_updates (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects(id) on delete cascade,
  old_status   text,
  new_status   text not null,
  note         text,
  created_at   timestamptz not null default now()
);

create index idx_project_updates_project_id on project_updates (project_id);
```

## 2. Triggers & Functions

### 2.1 Auto-update `updated_at` on `site_content` and `projects`

```sql
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_site_content_updated_at
  before update on site_content
  for each row execute function set_updated_at();

create trigger trg_projects_updated_at
  before update on projects
  for each row execute function set_updated_at();
```

### 2.2 Auto-log status changes into `project_updates` (P2 stretch)

```sql
create or replace function log_project_status_change()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into project_updates (project_id, old_status, new_status, note)
    values (new.id, old.status, new.status, new.note);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_log_project_status_change
  after update on projects
  for each row execute function log_project_status_change();
```

## 3. Row Level Security (RLS)

```sql
alter table site_content enable row level security;
alter table leads enable row level security;
alter table projects enable row level security;
alter table project_updates enable row level security;

-- site_content: public read (site needs it), writes only via service role (admin backend route)
create policy "public read site_content" on site_content
  for select using (true);
create policy "service write site_content" on site_content
  for all using (auth.role() = 'service_role');

-- leads: public insert (lead form), no public read (privacy), admin backend reads via service role
create policy "public insert leads" on leads
  for insert with check (true);
create policy "service read/write leads" on leads
  for all using (auth.role() = 'service_role');

-- projects: public read (status lookup), writes only via service role
create policy "public read projects" on projects
  for select using (true);
create policy "service write projects" on projects
  for all using (auth.role() = 'service_role');

-- project_updates: read alongside projects, no public write
create policy "public read project_updates" on project_updates
  for select using (true);
create policy "service write project_updates" on project_updates
  for all using (auth.role() = 'service_role');
```

## 4. Realtime Configuration

```sql
alter publication supabase_realtime add table site_content;
alter publication supabase_realtime add table leads;
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table project_updates;
```
