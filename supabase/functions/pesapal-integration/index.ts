import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PESAPAL_URL = Deno.env.get('PESAPAL_URL') || "https://cybqa.pesapal.com/pesapalv3" // Sandbox default
const CONSUMER_KEY = Deno.env.get('PESAPAL_CONSUMER_KEY')
const CONSUMER_SECRET = Deno.env.get('PESAPAL_CONSUMER_SECRET')

async function getAccessToken() {
    const res = await fetch(`${PESAPAL_URL}/api/Auth/RequestToken`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            consumer_key: CONSUMER_KEY,
            consumer_secret: CONSUMER_SECRET
        })
    });
    const data = await res.json();
    return data.token;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const { action, orderId, amount, email, phone, firstName, lastName } = await req.json()
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const token = await getAccessToken()

        if (action === 'submit_order') {
            // 1. Register IPN
            const ipnRes = await fetch(`${PESAPAL_URL}/api/URLSetup/RegisterIPN`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/pesapal-callback`,
                    ipn_notification_type: "GET"
                })
            });
            const ipnData = await ipnRes.json();
            const ipnId = ipnData.ipn_id;

            // 2. Submit Order Request
            const orderRes = await fetch(`${PESAPAL_URL}/api/Transactions/SubmitOrderRequest`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    id: orderId,
                    currency: "KES",
                    amount: amount,
                    description: `Order ${orderId}`,
                    callback_url: `${Deno.env.get('FRONTEND_URL')}/order-confirmation?id=${orderId}`,
                    notification_id: ipnId,
                    billing_address: {
                        email_address: email,
                        phone_number: phone,
                        first_name: firstName,
                        last_name: lastName
                    }
                })
            });
            const orderData = await orderRes.json();

            // 3. Log transaction
            await supabase.from('pesapal_transactions').insert({
                order_id: orderId,
                tracking_id: orderData.order_tracking_id,
                merchant_reference: orderId,
                amount,
                status: 'pending',
                raw_response: orderData
            })

            return new Response(JSON.stringify(orderData), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        return new Response(JSON.stringify({ error: "Invalid action" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
