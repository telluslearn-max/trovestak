-- Media Library Table
-- Track all uploaded media files

CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can view media" ON media
    FOR SELECT USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Authenticated can insert media" ON media
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated can delete media" ON media
    FOR DELETE USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT ON media TO anon, authenticated;
GRANT INSERT ON media TO authenticated;
GRANT DELETE ON media TO authenticated;
