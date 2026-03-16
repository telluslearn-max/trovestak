-- Atomically decrements stock for a variant, flooring at 0 to prevent negative inventory.
CREATE OR REPLACE FUNCTION decrement_stock(p_variant_id UUID, p_qty INT)
RETURNS VOID LANGUAGE sql AS $$
    UPDATE product_variants
    SET    stock_quantity = GREATEST(0, stock_quantity - p_qty)
    WHERE  id = p_variant_id;
$$;
