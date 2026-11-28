-- Console data moves from each browser's localStorage into the shared database.
-- SOP rules are enforced in server code (src/lib/care-rules.ts); the assignment gate is also
-- enforced here so no code path can break it.

create table caregivers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  cadre      text not null check (cadre in ('Care Companion', 'Certified Caregiver', 'Senior Caregiver', 'Registered Nurse')),
  languages  text not null default '',
  status     text not null default 'Training' check (status in ('Training', 'Bench', 'Deployed')),
  created_by uuid references staff_users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table patients (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  age              integer not null default 0 check (age between 0 and 130),
  condition        text not null default '',
  guardian_name    text not null default '',
  guardian_phone   text not null default '',
  service_line     text not null check (service_line in ('Post-hospitalisation', 'Elderly care', 'Rehabilitation')),
  journey_step     integer not null default 1 check (journey_step between 1 and 8),
  tier             text check (tier in ('T1', 'T2', 'T3', 'T4')),
  caregiver_id     uuid references caregivers (id) on delete set null,
  backup_id        uuid references caregivers (id) on delete set null,
  care_start       timestamptz,
  last_nurse_visit timestamptz,
  enquiry_id       uuid references enquiries (id) on delete set null,
  created_by       uuid references staff_users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- SOP assignment gate: no caregiver or backup before the home assessment and a nurse-set tier.
  constraint patients_assignment_gate check (
    (caregiver_id is null and backup_id is null) or (journey_step >= 3 and tier is not null)
  ),
  constraint patients_backup_differs check (backup_id is null or backup_id <> caregiver_id)
);
create index patients_caregiver_idx on patients (caregiver_id);

create table shift_logs (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid not null references patients (id) on delete cascade,
  caregiver_id uuid references caregivers (id) on delete set null,
  logged_at    timestamptz not null default now(),
  bp           text not null default '',
  spo2         text not null default '',
  meals        text not null default '',
  meds         text not null default '',
  mood         text not null default '',
  notes        text not null default '',
  recorded_by  uuid references staff_users (id) on delete set null
);
create index shift_logs_patient_idx on shift_logs (patient_id, logged_at desc);

create table incidents (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references patients (id) on delete cascade,
  severity    text not null check (severity in ('Red', 'Amber', 'Green')),
  kind        text not null,
  description text not null default '',
  occurred_at timestamptz not null default now(),
  resolved_at timestamptz,
  reported_by uuid references staff_users (id) on delete set null
);
create index incidents_patient_idx on incidents (patient_id, occurred_at desc);

create table complaints (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references patients (id) on delete cascade,
  text            text not null,
  received_at     timestamptz not null default now(),
  acknowledged_at timestamptz,
  resolved_at     timestamptz,
  logged_by       uuid references staff_users (id) on delete set null
);
create index complaints_patient_idx on complaints (patient_id, received_at desc);
