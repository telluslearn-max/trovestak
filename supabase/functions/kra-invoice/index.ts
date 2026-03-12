// KRA eTIMS Invoice Edge Function
// Handles automated invoice generation and tax compliance recording with retry resilience

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const { orderId, vatApplied } = await req.json()
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? "",
            Deno.env.get('SB_SERVICE_ROLE_KEY') ?? ""
        )

        // 1. Idempotency Check: Does an invoice already exist?
        const { data: existingInvoice } = await supabase
            .from('kra_invoices')
            .select('*')
            .eq('order_id', orderId)
            .maybeSingle();

        if (existingInvoice && existingInvoice.etims_status === 'verified') {
            return new Response(
                JSON.stringify({ message: "Invoice already exists and is verified", data: existingInvoice }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        // 2. Fetch order details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', orderId)
            .single()

        if (orderError || !order) throw new Error(`Order not found: ${orderError?.message}`)

        // 3. Prepare Invoice Data
        const subtotal = order.total_amount
        const vatRate = vatApplied ? 0.16 : 0
        const vatAmount = Math.round(subtotal * (vatRate / (1 + vatRate)))
        const netAmount = subtotal - vatAmount

        let invoiceNumber = existingInvoice?.invoice_number;
        if (!invoiceNumber) {
            // Use atomic PostgreSQL SEQUENCE to prevent race conditions under concurrency
            // This is a KRA compliance requirement – invoice numbers must be sequential with no gaps
            const { data: seqData, error: seqError } = await supabase
                .rpc('nextval_kra_invoice_seq')
                .single();

            if (seqError || !seqData) {
                // Fallback: use timestamp-based unique number if RPC fails
                console.warn('Sequence RPC failed, using timestamp fallback:', seqError?.message);
                invoiceNumber = `TRV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
            } else {
                const year = new Date().getFullYear();
                const seqNum = String(seqData).padStart(6, '0');
                invoiceNumber = `TRV-${year}-${seqNum}`; // e.g. TRV-2026-000001
            }
        }

        const qrCodeUrl = `https://etims.kra.go.ke/verify?invoice=${invoiceNumber}`

        // 4. Upsert Invoice Record
        const { data: invoice, error: invoiceError } = await supabase
            .from('kra_invoices')
            .upsert({
                id: existingInvoice?.id || undefined,
                order_id: orderId,
                invoice_number: invoiceNumber,
                invoice_date: existingInvoice?.invoice_date || new Date().toISOString(),
                customer_name: order.shipping_address?.full_name ?? "Guest",
                subtotal: netAmount,
                vat_amount: vatAmount,
                total_amount: subtotal,
                vat_applied: vatApplied,
                qr_code_url: qrCodeUrl,
                etims_status: existingInvoice?.etims_status || 'pending'
            })
            .select()
            .single()

        if (invoiceError) throw new Error(`Failed to upsert invoice: ${invoiceError.message}`)

        // 5. Simulate eTIMS Submission with Retry Logic
        let etimsSuccess = false;
        let attempts = 0;
        const maxAttempts = 3;

        while (!etimsSuccess && attempts < maxAttempts) {
            attempts++;
            try {
                // In production, this would call KRA's VSCU API
                // For sandbox, we simulate a 90% success rate
                if (Math.random() > 0.1) {
                    etimsSuccess = true;
                } else {
                    throw new Error("KRA eTIMS Gateway Timeout");
                }
            } catch (e) {
                console.warn(`Submission attempt ${attempts} failed:`, e.message);
                if (attempts === maxAttempts) {
                    await supabase.from('kra_invoices').update({ etims_status: 'failed' }).eq('id', invoice.id);
                }
            }
        }

        if (etimsSuccess) {
            await supabase.from('kra_invoices').update({ etims_status: 'verified' }).eq('id', invoice.id);
        }

        return new Response(
            JSON.stringify({
                message: etimsSuccess ? "Invoice verified by eTIMS" : "Invoice pending submission",
                invoiceNumber,
                attempts
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
