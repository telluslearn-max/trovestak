-- Run this SQL in Supabase SQL Editor to allow image uploads

-- Allow public read access to media bucket
CREATE POLICY "Public Read Access" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

-- Allow authenticated users to insert into media bucket  
CREATE POLICY "Authenticated Insert" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'media');

-- Allow authenticated users to update media bucket
CREATE POLICY "Authenticated Update" ON storage.objects
FOR UPDATE USING (bucket_id = 'media');

-- Allow authenticated users to delete from media bucket
CREATE POLICY "Authenticated Delete" ON storage.objects
FOR DELETE USING (bucket_id = 'media');
