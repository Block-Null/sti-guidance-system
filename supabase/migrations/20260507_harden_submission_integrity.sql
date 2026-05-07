alter table public.appointments
  add column if not exists client_request_id text,
  add column if not exists dedupe_hash text;

alter table public.announcements
  add column if not exists client_request_id text,
  add column if not exists dedupe_hash text;

alter table public.schedule
  add column if not exists client_request_id text,
  add column if not exists dedupe_hash text;

delete from public.appointments a
using public.appointments b
where a.ctid < b.ctid
  and a.student_id = b.student_id
  and a.appointment_date = b.appointment_date
  and coalesce(trim(a.reason), '') = coalesce(trim(b.reason), '')
  and coalesce(trim(a.details), '') = coalesce(trim(b.details), '');

delete from public.announcements a
using public.announcements b
where a.ctid < b.ctid
  and coalesce(trim(a.title), '') = coalesce(trim(b.title), '')
  and coalesce(trim(a.content), '') = coalesce(trim(b.content), '')
  and coalesce(a.duration, 0) = coalesce(b.duration, 0)
  and coalesce(a.image, '') = coalesce(b.image, '');

delete from public.schedule a
using public.schedule b
where a.ctid < b.ctid
  and a.schedule_date = b.schedule_date
  and a.start_time = b.start_time
  and a.end_time = b.end_time
  and coalesce(trim(a.title), '') = coalesce(trim(b.title), '');

create unique index if not exists appointments_client_request_id_key
  on public.appointments (client_request_id)
  where client_request_id is not null;

create unique index if not exists announcements_client_request_id_key
  on public.announcements (client_request_id)
  where client_request_id is not null;

create unique index if not exists schedule_client_request_id_key
  on public.schedule (client_request_id)
  where client_request_id is not null;

create unique index if not exists appointments_dedupe_hash_key
  on public.appointments (dedupe_hash)
  where dedupe_hash is not null;

create unique index if not exists announcements_dedupe_hash_key
  on public.announcements (dedupe_hash)
  where dedupe_hash is not null;

create unique index if not exists schedule_dedupe_hash_key
  on public.schedule (dedupe_hash)
  where dedupe_hash is not null;
