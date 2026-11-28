-- Spam limits on the public enquiry form. We keep a SHA-256 of the sender's IP address (never
-- the address itself) and a digits-only phone key so repeat submissions can be counted.
alter table enquiries
  add column ip_hash   text,
  add column phone_key text not null default '',
  add column alerted   boolean not null default true;

update enquiries set phone_key = right(regexp_replace(guardian_phone, '\D', '', 'g'), 10);

create index enquiries_phone_key_idx on enquiries (phone_key, created_at desc);
create index enquiries_ip_hash_idx on enquiries (ip_hash, created_at desc);
