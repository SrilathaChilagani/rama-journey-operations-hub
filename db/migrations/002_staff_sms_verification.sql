-- Staff two-step sign-in: password, then an SMS code sent by Twilio Verify.
-- Twilio generates and checks the codes; we never store a code.

alter table staff_users
  add column phone text check (phone is null or phone ~ '^\+[1-9][0-9]{7,14}$');

-- A password-verified sign-in waiting for its SMS code. The browser holds a random token in an
-- httpOnly cookie; only its SHA-256 is stored here.
create table staff_login_challenges (
  token_hash   text primary key,
  user_id      uuid not null references staff_users (id) on delete cascade,
  attempts     integer not null default 0,
  sends        integer not null default 1,
  last_sent_at timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null
);
create index staff_login_challenges_user_idx on staff_login_challenges (user_id);

-- "Remember this device for 30 days" — skips the SMS step, never the password.
create table staff_trusted_devices (
  token_hash  text primary key,
  user_id     uuid not null references staff_users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null
);
create index staff_trusted_devices_user_idx on staff_trusted_devices (user_id);
