alter table public.bot_files enable row level security;

drop policy if exists "Users can view their own BOT files" on public.bot_files;
drop policy if exists "Users can insert their own BOT files" on public.bot_files;
drop policy if exists "Users can update their own BOT files" on public.bot_files;
drop policy if exists "Users can delete their own BOT files" on public.bot_files;
drop policy if exists "Users can read their own stored files" on storage.objects;
drop policy if exists "Users can upload their own stored files" on storage.objects;
drop policy if exists "Users can update their own stored files" on storage.objects;
drop policy if exists "Users can delete their own stored files" on storage.objects;
drop function if exists public.is_bot_storage_admin();

create policy "Users can view their own BOT files"
on public.bot_files
for select
to authenticated
using (auth.uid() = user_id);
create policy "Users can insert their own BOT files"
on public.bot_files
for insert
to authenticated
with check (auth.uid() = user_id);
create policy "Users can update their own BOT files"
on public.bot_files
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
create policy "Users can delete their own BOT files"
on public.bot_files
for delete
to authenticated
using (auth.uid() = user_id);
create policy "Users can read their own stored files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'bot-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "Users can upload their own stored files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'bot-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "Users can update their own stored files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'bot-files'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'bot-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "Users can delete their own stored files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'bot-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);
