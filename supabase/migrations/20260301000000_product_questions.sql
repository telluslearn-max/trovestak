-- Product Q&A System
-- Clients ask questions, Admin answers and approves visibility

CREATE TABLE IF NOT EXISTS product_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    customer_name TEXT,
    customer_email TEXT,
    question TEXT NOT NULL,
    answer TEXT,
    answered_by UUID REFERENCES auth.users(id),
    is_approved BOOLEAN DEFAULT false,
    is_verified_purchase BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    answered_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE product_questions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read approved questions
CREATE POLICY "Anyone can read approved questions" 
ON product_questions FOR SELECT 
USING (is_approved = true);

-- Policy: Anyone can insert questions (anon)
CREATE POLICY "Anyone can insert questions" 
ON product_questions FOR INSERT 
WITH CHECK (true);

-- Policy: Service role can manage all
CREATE POLICY "Service role can manage all" 
ON product_questions FOR ALL 
USING (auth.jwt() ->> 'role' = 'authenticated');

-- Create indexes for performance
CREATE INDEX idx_product_questions_product_id ON product_questions(product_id);
CREATE INDEX idx_product_questions_is_approved ON product_questions(is_approved) WHERE is_approved = true;
CREATE INDEX idx_product_questions_created_at ON product_questions(created_at DESC);

-- Comments
COMMENT ON TABLE product_questions IS 'Product Q&A - customers ask questions, admin answers';
COMMENT ON COLUMN product_questions.question IS 'Question asked by customer';
COMMENT ON COLUMN product_questions.answer IS 'Answer provided by admin';
COMMENT ON COLUMN product_questions.is_approved IS 'Admin approval for visibility';
COMMENT ON COLUMN product_questions.helpful_count IS 'Number of customers who found this helpful';
