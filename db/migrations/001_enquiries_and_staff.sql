-- Rama Cares — first schema: public enquiries + staff logins.
-- Applied by `bun run db:migrate` (scripts/db-migrate.ts). Never edit an applied file;
-- add a new numbered file instead.

create extension if not exists pgcrypto;

create table enquiries (
  id             uuid primary key default gen_random_uuid(),
  patient_name   text not null,
  patient_age    text not null default '',
  condition      text not null default '',
  guardian_name  text not null,
  guardian_phone text not null,
  service_line   text not null,
  status         text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index enquiries_created_at_idx on enquiries (created_at desc);

create table staff_users (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique check (email = lower(email)),
  name            text not null,
  password_hash   text not null,
  role            text not null default 'staff' check (role in ('admin', 'staff')),
  active          boolean not null default true,
  failed_attempts integer not null default 0,
  locked_until    timestamptz,
  created_at      timestamptz not null default now()
);

-- Only a SHA-256 of the session token is stored, so a database leak doesn't hand out logins.
create table staff_sessions (
  token_hash  text primary key,
  user_id     uuid not null references staff_users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null
);
create index staff_sessions_user_idx on staff_sessions (user_id);
