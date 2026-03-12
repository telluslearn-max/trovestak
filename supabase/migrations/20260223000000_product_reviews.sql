-- Product Reviews System
-- Supports star ratings, written reviews, pros/cons, verified purchases

-- Add review aggregate columns to products for fast filtering
ALTER TABLE products ADD COLUMN IF NOT EXISTS average_rating NUMERIC(2,1) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Create reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    body TEXT,
    pros TEXT[],
    cons TEXT[],
    is_verified_purchase BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT one_review_per_user_product UNIQUE (product_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON product_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON product_reviews(created_at DESC);

-- Function to update product review aggregates
CREATE OR REPLACE FUNCTION update_review_aggregate()
RETURNS TRIGGER AS $$
DECLARE
    pid UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        pid := OLD.product_id;
    ELSE
        pid := NEW.product_id;
    END IF;
    
    UPDATE products SET
        average_rating = COALESCE(
            (SELECT ROUND(AVG(rating)::numeric, 1) 
             FROM product_reviews 
             WHERE product_id = pid AND is_approved = true),
            0
        ),
        review_count = COALESCE(
            (SELECT COUNT(*) 
             FROM product_reviews 
             WHERE product_id = pid AND is_approved = true),
            0
        )
    WHERE id = pid;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS review_aggregate_trigger ON product_reviews;
CREATE TRIGGER review_aggregate_trigger
AFTER INSERT OR UPDATE OR DELETE ON product_reviews
FOR EACH ROW EXECUTE FUNCTION update_review_aggregate();

-- Row Level Security
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Reviews are viewable by all" ON product_reviews
    FOR SELECT USING (is_approved = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own reviews" ON product_reviews
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own reviews" ON product_reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews" ON product_reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_app_meta_data->>'role' = 'admin'
        )
    );

-- Grant permissions
GRANT SELECT ON product_reviews TO anon, authenticated;
GRANT INSERT, UPDATE ON product_reviews TO authenticated;

-- Helpful vote tracking (optional)
CREATE TABLE IF NOT EXISTS review_helpful (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES product_reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT one_helpful_per_review UNIQUE (review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_helpful_review ON review_helpful(review_id);

-- Trigger to update helpful_count
CREATE OR REPLACE FUNCTION update_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE product_reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE product_reviews SET helpful_count = helpful_count - 1 WHERE id = OLD.review_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS helpful_count_trigger ON review_helpful;
CREATE TRIGGER helpful_count_trigger
AFTER INSERT OR DELETE ON review_helpful
FOR EACH ROW EXECUTE FUNCTION update_helpful_count();

-- Grant helpful table permissions
GRANT SELECT ON review_helpful TO anon, authenticated;
GRANT INSERT, DELETE ON review_helpful TO authenticated;
