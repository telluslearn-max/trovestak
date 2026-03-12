-- Fix get_cheapest_supplier RPC type mismatch
CREATE OR REPLACE FUNCTION get_cheapest_supplier(p_variant_id UUID)
RETURNS TABLE (
    supplier_id UUID,
    supplier_name TEXT, 
    cost_price BIGINT,
    warranty_type TEXT,
    condition TEXT,
    region_origin TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.display_name::TEXT, 
        spo.cost_price_kes,
        spo.warranty_type::TEXT,
        spo.condition::TEXT,
        spo.region_origin::TEXT
    FROM public.supplier_product_offer spo
    JOIN public.supplier s ON s.id = spo.supplier_id
    WHERE spo.variant_id = p_variant_id
      AND spo.is_available = TRUE
    ORDER BY spo.cost_price_kes ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;
