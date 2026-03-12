-- ============================================
-- Add highlights column to product_content table
-- ============================================

-- Add highlights column
ALTER TABLE public.product_content 
ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]';

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_content_highlights ON public.product_content(product_id);

-- Update RLS policies if needed (should already be covered by existing policies)
-- The existing "Public can view content" policy already covers SELECT
-- The existing "Admins can manage content" policy already covers INSERT/UPDATE

-- Grant permissions
GRANT SELECT ON public.product_content TO anon, authenticated;
GRANT UPDATE (highlights) ON public.product_content TO authenticated;

COMMENT ON COLUMN public.product_content.highlights IS 'Manual highlights set by admin (array of {key, value} objects)';
