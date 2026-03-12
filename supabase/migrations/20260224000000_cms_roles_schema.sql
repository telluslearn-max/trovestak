-- ============================================
-- CMS & MEDIA MODULE
-- Date: 2026-02-24
-- ============================================

-- Media Assets (tracks Cloudinary uploads)
CREATE TABLE IF NOT EXISTS public.media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id TEXT UNIQUE NOT NULL,
    url TEXT NOT NULL,
    filename TEXT,
    alt_text TEXT,
    type TEXT DEFAULT 'image' CHECK (type IN ('image', 'video', 'document')),
    width INTEGER,
    height INTEGER,
    size_bytes INTEGER,
    folder TEXT DEFAULT 'general',
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_public_id ON public.media_assets(public_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON public.media_assets(type);
CREATE INDEX IF NOT EXISTS idx_media_folder ON public.media_assets(folder);

-- CMS Pages
CREATE TABLE IF NOT EXISTS public.cms_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT,
    meta_title TEXT,
    meta_description TEXT,
    template TEXT DEFAULT 'default' CHECK (template IN ('default', 'landing', 'legal', 'contact', 'about')),
    parent_id UUID REFERENCES public.cms_pages(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    sort_order INTEGER DEFAULT 0,
    published_at TIMESTAMPTZ,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON public.cms_pages(slug);
CREATE INDEX IF NOT EXISTS idx_cms_pages_status ON public.cms_pages(status);
CREATE INDEX IF NOT EXISTS idx_cms_pages_parent ON public.cms_pages(parent_id);

-- Navigation Menus
CREATE TABLE IF NOT EXISTS public.nav_menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    location TEXT DEFAULT 'header' CHECK (location IN ('header', 'footer', 'sidebar')),
    items JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nav_menus_slug ON public.nav_menus(slug);
CREATE INDEX IF NOT EXISTS idx_nav_menus_location ON public.nav_menus(location);

-- Site Settings (key-value store)
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Seed default site settings
INSERT INTO public.site_settings (key, value) VALUES
('site_name', '"Trovestak"'),
('site_tagline', '"Premium Electronics Kenya"'),
('contact_email', '"support@trovestak.co.ke"'),
('contact_phone', '"+254 700 000 000"'),
('social_links', '{"twitter": "", "instagram": "", "facebook": "", "linkedin": ""}'),
('address', '{"street": "", "city": "Nairobi", "country": "Kenya"}')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- USER ROLES & PERMISSIONS MODULE
-- ============================================

-- User Roles Definition
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Role Assignment
CREATE TABLE IF NOT EXISTS public.user_role_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.user_roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user ON public.user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role ON public.user_role_assignments(role_id);

-- Seed Default Roles
INSERT INTO public.user_roles (name, display_name, description, is_system, permissions) VALUES
('super_admin', 'Super Admin', 'Full access to all features', TRUE, 
 '{"products": ["read","write","delete"], "orders": ["read","write","delete"], "users": ["read","write","delete"], "settings": ["read","write"], "media": ["read","write","delete"], "pages": ["read","write","delete"], "menus": ["read","write","delete"], "suppliers": ["read","write","delete"]}'),
('manager', 'Manager', 'Manage products, orders, inventory', TRUE,
 '{"products": ["read","write","delete"], "orders": ["read","write"], "users": ["read"], "settings": ["read"], "media": ["read","write","delete"], "pages": ["read","write"], "menus": ["read"], "suppliers": ["read","write"]}'),
('editor', 'Editor', 'Edit products and inventory only', TRUE,
 '{"products": ["read","write"], "orders": ["read"], "media": ["read","write"], "pages": ["read","write"], "suppliers": ["read"]}'),
('support', 'Support', 'View and update order status', TRUE,
 '{"products": ["read"], "orders": ["read","write"], "users": ["read"]}')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- PRODUCT ENHANCEMENTS
-- ============================================

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_role_assignments ura
        JOIN public.user_roles ur ON ur.id = ura.role_id
        WHERE ura.user_id = auth.uid() AND ur.name = required_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_permission(resource TEXT, action TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_role_assignments ura
        JOIN public.user_roles ur ON ur.id = ura.role_id
        WHERE ura.user_id = auth.uid()
        AND ur.permissions->resource ? action
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    role_name TEXT;
BEGIN
    SELECT ur.name INTO role_name
    FROM public.user_role_assignments ura
    JOIN public.user_roles ur ON ur.id = ura.role_id
    WHERE ura.user_id = get_user_role.user_id
    ORDER BY CASE ur.name
        WHEN 'super_admin' THEN 1
        WHEN 'manager' THEN 2
        WHEN 'editor' THEN 3
        WHEN 'support' THEN 4
        ELSE 5
    END
    LIMIT 1;
    
    RETURN COALESCE(role_name, 'customer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nav_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;

-- Media policies
CREATE POLICY "Public can view media" ON public.media_assets FOR SELECT USING (TRUE);
CREATE POLICY "Editors can insert media" ON public.media_assets FOR INSERT
    WITH CHECK (public.has_role('editor') OR public.has_role('manager') OR public.has_role('super_admin'));
CREATE POLICY "Editors can update media" ON public.media_assets FOR UPDATE
    USING (public.has_role('editor') OR public.has_role('manager') OR public.has_role('super_admin'));
CREATE POLICY "Managers can delete media" ON public.media_assets FOR DELETE
    USING (public.has_role('manager') OR public.has_role('super_admin'));

-- CMS pages policies
CREATE POLICY "Public can view published pages" ON public.cms_pages FOR SELECT
    USING (status = 'published' OR public.has_role('editor'));
CREATE POLICY "Editors can manage pages" ON public.cms_pages FOR ALL
    USING (public.has_role('editor') OR public.has_role('manager') OR public.has_role('super_admin'));

-- Menu policies
CREATE POLICY "Public can view active menus" ON public.nav_menus FOR SELECT
    USING (is_active = TRUE OR public.has_role('manager'));
CREATE POLICY "Managers can manage menus" ON public.nav_menus FOR ALL
    USING (public.has_role('manager') OR public.has_role('super_admin'));

-- Site settings policies
CREATE POLICY "Public can view site settings" ON public.site_settings FOR SELECT USING (TRUE);
CREATE POLICY "Super admin can manage settings" ON public.site_settings FOR ALL
    USING (public.has_role('super_admin'));

-- Role management policies
CREATE POLICY "Users can view roles" ON public.user_roles FOR SELECT USING (TRUE);
CREATE POLICY "Only super admin manages roles" ON public.user_roles FOR ALL
    USING (public.has_role('super_admin'));

CREATE POLICY "Users can view role assignments" ON public.user_role_assignments FOR SELECT
    USING (public.has_role('manager') OR public.has_role('super_admin'));
CREATE POLICY "Only super admin assigns roles" ON public.user_role_assignments FOR ALL
    USING (public.has_role('super_admin'));

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON public.media_assets TO anon, authenticated;
GRANT INSERT, UPDATE ON public.media_assets TO authenticated;

GRANT SELECT ON public.cms_pages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.cms_pages TO authenticated;

GRANT SELECT ON public.nav_menus TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.nav_menus TO authenticated;

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.site_settings TO authenticated;

GRANT SELECT ON public.user_roles TO anon, authenticated;
GRANT SELECT ON public.user_role_assignments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.user_role_assignments TO authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
