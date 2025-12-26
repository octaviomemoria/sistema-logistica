-- Create a new storage bucket for equipment images if it doesn't exist
insert into storage.buckets (id, name, public)
values ('imagens-equipamentos', 'imagens-equipamentos', true)
on conflict (id) do nothing;

-- Set up security policies for the bucket

-- Allow public read access to everyone
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'imagens-equipamentos' );

-- Allow authenticated users to upload images
create policy "Authenticated users can upload"
  on storage.objects for insert
  with check ( bucket_id = 'imagens-equipamentos' and auth.role() = 'authenticated' );

-- Allow users to update their own images (or any authenticated user depending on strictness needed)
-- For simplicity in this context, allowing authenticated updates
create policy "Authenticated users can update"
  on storage.objects for update
  with check ( bucket_id = 'imagens-equipamentos' and auth.role() = 'authenticated' );

-- Allow users to delete images
create policy "Authenticated users can delete"
  on storage.objects for delete
  using ( bucket_id = 'imagens-equipamentos' and auth.role() = 'authenticated' );
