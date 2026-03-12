import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const PESAPAL_URL = Deno.env.get('PESAPAL_URL') || "https://cybqa.pesapal.com/pesapalv3"
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
    const { searchParams } = new URL(req.url)
    const trackingId = searchParams.get('OrderTrackingId')
    const merchantReference = searchParams.get('OrderMerchantReference')
    const notificationId = searchParams.get('OrderNotificationType') // Pesapal sends IPN type here usually

    if (!trackingId) {
        return new Response(JSON.stringify({ error: "No tracking id" }), { status: 400 })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const token = await getAccessToken()

        // 1. Get Transaction Status
        const statusRes = await fetch(`${PESAPAL_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${trackingId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        const statusData = await statusRes.json();

        // 2. Update Transaction Table
        const { data: tx, error: txError } = await supabase
            .from('pesapal_transactions')
            .update({
                status: statusData.payment_status_description.toLowerCase(),
                payment_method: statusData.payment_method,
                raw_response: statusData
            })
            .eq('tracking_id', trackingId)
            .select()
            .single();

        if (txError) throw txError;

        // 3. If completed, update Order Status
        if (statusData.payment_status_description.toLowerCase() === 'completed') {
            const { error: orderError } = await supabase
                .from('orders')
                .update({ status: 'paid' })
                .eq('id', tx.order_id);

            if (orderError) throw orderError;

            // 4. Trigger KRA Invoice Generation
            try {
                await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/kra-invoice`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
                    },
                    body: JSON.stringify({ orderId: tx.order_id, vatApplied: true })
                });
            } catch (e) {
                console.error("KRA Invoice Trigger Failed:", e);
                // This is why we need retry logic in kra-invoice or a queue!
            }
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 })

    } catch (error) {
        console.error("Callback Error:", error.message)
        return new Response(JSON.stringify({ error: error.message }), { status: 400 })
    }
})
