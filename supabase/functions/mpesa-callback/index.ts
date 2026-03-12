// M-Pesa Callback Edge Function
// Handles transaction results from Safaricom

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const data = await req.json()
        const url = new URL(req.url)
        const orderId = url.searchParams.get("orderId")

        console.log(`Received M-Pesa Callback for Order: ${orderId}`)

        // 1. Extract ResultCode and ResultDesc
        const { Body: { stkCallback: { ResultCode, ResultDesc, CallbackMetadata } } } = data

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ""
        const supabaseServiceKey = Deno.env.get('SB_SERVICE_ROLE_KEY') ?? ""
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        if (ResultCode === 0) {
            // 2. Success: Update order status in Supabase
            console.log(`Payment successful for Order: ${orderId}`)

            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    payment_status: 'paid',
                    status: 'processing',
                    metadata: { ...data.Body.stkCallback, mpesa_synced_at: new Date().toISOString() }
                })
                .eq('id', orderId)

            if (updateError) {
                console.error(`Failed to update order ${orderId}: ${updateError.message}`)
            }
        } else {
            // 3. Failure: Log error and update order
            console.error(`Payment failed for Order: ${orderId}: ${ResultDesc}`)

            await supabase
                .from('orders')
                .update({
                    payment_status: 'failed',
                    metadata: { ...data.Body.stkCallback, mpesa_failed_at: new Date().toISOString() }
                })
                .eq('id', orderId)
        }

        return new Response(
            JSON.stringify({ message: "Callback received and processed" }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
