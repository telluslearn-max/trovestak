// Migration Edge Function
// Run this once to add normalization columns to products table

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Run migration SQL
        const migrationSQL = `
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS normalized_name TEXT,
            ADD COLUMN IF NOT EXISTS name_normalized_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            ADD COLUMN IF NOT EXISTS name_normalization_reasoning TEXT;

            CREATE INDEX IF NOT EXISTS idx_products_normalized_name 
            ON products(normalized_name) 
            WHERE normalized_name IS NULL;
        `

        // Execute using anon key with raw SQL access via postgrest
        // Note: Direct SQL execution isn't available in edge functions
        // So we'll use a workaround - try to insert and catch errors
        
        // Alternative: Use RPC if available, otherwise return instructions
        const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
        
        if (error) {
            // If RPC doesn't exist, return migration SQL for manual execution
            return new Response(JSON.stringify({
                success: false,
                message: 'RPC exec_sql not available',
                migration_sql: migrationSQL,
                instructions: 'Please run this SQL in your Supabase SQL Editor'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            })
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Migration completed successfully'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })

    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        })
    }
})
