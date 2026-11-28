-- Family portal: guardians sign in with their phone + an SMS code (Twilio Verify) and see only
-- the patients staff have linked them to.

-- Who may see which patient. Added by staff; consent recorded at first sign-in (DPDP).
create table family_contacts (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid not null references patients (id) on delete cascade,
  name         text not null,
  relationship text not null default '',
  phone        text not null check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  active       boolean not null default true,
  consent_at   timestamptz,
  created_by   uuid references staff_users (id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (patient_id, phone)
);
create index family_contacts_phone_idx on family_contacts (phone) where active;

-- A pending sign-in. Created for every phone entered (registered or not) so the response never
-- reveals whether a number is on file; `phone` also drives the per-number hourly send limit.
create table family_login_challenges (
  token_hash   text primary key,
  phone        text not null,
  registered   boolean not null,
  attempts     integer not null default 0,
  sends        integer not null default 1,
  last_sent_at timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null
);
create index family_login_challenges_phone_idx on family_login_challenges (phone, created_at desc);

-- A signed-in family member, keyed by phone (one person may be linked to several patients).
create table family_sessions (
  token_hash  text primary key,
  phone       text not null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null
);
create index family_sessions_phone_idx on family_sessions (phone);

-- Concerns raised from the portal go into the same SOP complaints workflow.
alter table complaints add column raised_by_contact uuid references family_contacts (id) on delete set null;
