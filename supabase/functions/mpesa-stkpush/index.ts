// M-Pesa STK Push Edge Function
// Handles Daraja 3.0 API communication

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { phone, amount, orderId } = await req.json()

        // 1. Get Access Token from Safaricom
        const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY")
        const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET")
        const shortCode = Deno.env.get("MPESA_SHORTCODE") || "174379"
        const passkey = Deno.env.get("MPESA_PASSKEY")

        if (!consumerKey || !consumerSecret || !passkey) {
            throw new Error("M-Pesa credentials not configured")
        }

        const auth = btoa(`${consumerKey}:${consumerSecret}`)
        const tokenResponse = await fetch(
            "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                },
            }
        )

        const { access_token } = await tokenResponse.json()

        // 2. Generate Password (Shortcode + Passkey + Timestamp)
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14)
        const password = btoa(`${shortCode}${passkey}${timestamp}`)

        // 3. Initiate STK Push
        const stkResponse = await fetch(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    BusinessShortCode: shortCode,
                    Password: password,
                    Timestamp: timestamp,
                    TransactionType: "CustomerPayBillOnline",
                    Amount: Math.round(amount),
                    PartyA: phone.replace("+", ""),
                    PartyB: shortCode,
                    PhoneNumber: phone.replace("+", ""),
                    CallBackURL: `https://lgxqlgyciazmlllowhel.supabase.co/functions/v1/mpesa-callback?orderId=${orderId}`,
                    AccountReference: `Trove-${orderId}`,
                    TransactionDesc: `Payment for Order ${orderId}`,
                }),
            }
        )

        const stkData = await stkResponse.json()

        return new Response(
            JSON.stringify(stkData),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
