create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public)
values ('bot-files', 'bot-files', false)
on conflict (id) do nothing;

create table if not exists public.bot_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  file_path text not null unique,
  file_url text,
  year text not null check (year ~ '^[0-9]{4}$'),
  category text not null check (
    category in (
      'Automation',
      'Training Data',
      'Deployment',
      'Prompt Library',
      'Reports',
      'Reference'
    )
  ),
  file_type text,
  file_size bigint,
  description text,
  summary text,
  uploader text,
  is_starred boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists bot_files_user_id_idx on public.bot_files (user_id);
create index if not exists bot_files_year_idx on public.bot_files (year);
create index if not exists bot_files_category_idx on public.bot_files (category);
create index if not exists bot_files_created_at_idx on public.bot_files (created_at desc);

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_bot_files_updated_at on public.bot_files;

create trigger set_bot_files_updated_at
before update on public.bot_files
for each row
execute function public.set_current_timestamp_updated_at();
