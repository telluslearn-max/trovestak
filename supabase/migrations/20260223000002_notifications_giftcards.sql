-- Email notifications and gift cards

-- Gift cards table
CREATE TABLE IF NOT EXISTS gift_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    initial_amount INTEGER NOT NULL CHECK (initial_amount > 0),
    remaining_balance INTEGER NOT NULL CHECK (remaining_balance >= 0),
    currency VARCHAR(3) DEFAULT 'KES',
    purchaser_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    purchaser_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    recipient_email VARCHAR(255) NOT NULL,
    message TEXT,
    design_id VARCHAR(50) DEFAULT 'classic',
    purchased_at TIMESTAMPTZ DEFAULT now(),
    delivered_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT valid_balance CHECK (remaining_balance <= initial_amount)
);

CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_recipient ON gift_cards(recipient_email);
CREATE INDEX IF NOT EXISTS idx_gift_cards_purchaser ON gift_cards(purchaser_id);

-- Gift card redemptions
CREATE TABLE IF NOT EXISTS gift_card_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_card_id UUID REFERENCES gift_cards(id) ON DELETE CASCADE,
    order_id UUID,
    amount INTEGER NOT NULL CHECK (amount > 0),
    redeemed_at TIMESTAMPTZ DEFAULT now(),
    redeemed_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_redemptions_gift_card ON gift_card_redemptions(gift_card_id);

-- Email notification queue
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id VARCHAR(100) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject VARCHAR(255),
    data JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    sent_at TIMESTAMPTZ,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created ON email_queue(created_at);

-- Email templates
CREATE TABLE IF NOT EXISTS email_templates (
    id VARCHAR(100) PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default templates
INSERT INTO email_templates (id, subject, html_content) VALUES
('order_confirmation', 'Order Confirmation - Trovestak', '<h1>Thank you for your order!</h1>'),
('order_shipped', 'Your Order Has Shipped - Trovestak', '<h1>Your order is on the way!</h1>'),
('gift_card_delivery', 'You received a Trovestak Gift Card!', '<h1>You got a gift card!</h1>'),
('price_drop_alert', 'Price Drop Alert - Trovestak', '<h1>Good news! A product you watched dropped in price.</h1>'),
('review_request', 'How was your purchase? - Trovestak', '<h1>Share your thoughts!</h1>')
ON CONFLICT (id) DO NOTHING;

-- Price drop alerts (watchlist)
CREATE TABLE IF NOT EXISTS price_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    target_price INTEGER,
    notify_on_drop BOOLEAN DEFAULT true,
    notify_on_availability BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_notified_at TIMESTAMPTZ,
    CONSTRAINT unique_price_alert UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_product ON price_alerts(product_id);

-- RLS Policies
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own gift cards" ON gift_cards
    FOR SELECT USING (auth.uid() = purchaser_id OR auth.uid()::text = recipient_email);

CREATE POLICY "Users can view their own price alerts" ON price_alerts
    FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT ON gift_cards TO authenticated;
GRANT SELECT, INSERT, DELETE ON price_alerts TO authenticated;
