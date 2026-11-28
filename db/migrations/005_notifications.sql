-- Outbound notifications (WhatsApp via Twilio, email via Resend). Every attempt is logged so staff
-- can see what was sent and what failed; a failed send never blocks the action that caused it.
create table notifications (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('enquiry_new', 'concern_new', 'incident_family', 'daily_report')),
  channel       text not null check (channel in ('whatsapp', 'email')),
  recipient     text not null,
  subject       text not null default '',
  body          text not null,
  status        text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  error         text,
  provider_id   text,
  patient_id    uuid references patients (id) on delete set null,
  created_at    timestamptz not null default now(),
  sent_at       timestamptz
);
create index notifications_created_idx on notifications (created_at desc);

-- Families choose what they receive (only after portal consent).
alter table family_contacts
  add column notify_daily     boolean not null default true,
  add column notify_incidents boolean not null default true;
