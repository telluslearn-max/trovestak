-- Wipe existing product data for rebuild
TRUNCATE public.products, public.product_variants, public.categories, public.supplier_product_offer, public.product_mesh_node CASCADE;
