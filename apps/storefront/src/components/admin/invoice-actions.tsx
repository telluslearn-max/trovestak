"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateInvoicePDF } from "./generate-invoice";

interface InvoiceActionsProps {
    invoice: any;
}

export function InvoiceActions({ invoice }: InvoiceActionsProps) {
    const handleDownload = async () => {
        // Transform DB record to PDF expected format
        const invoiceData = {
            invoiceNumber: invoice.invoice_number,
            date: new Date(invoice.invoice_date).toLocaleDateString(),
            customer: {
                name: invoice.customer_name || "Guest Customer",
                email: invoice.customer_email || "N/A",
            },
            items: invoice.metadata?.items || [
                { description: "Standard Product", quantity: 1, price: invoice.total_amount - (invoice.vat_amount || 0) }
            ],
            subtotal: invoice.subtotal,
            tax: invoice.vat_amount || 0,
            total: invoice.total_amount,
            qrCodeUrl: invoice.qr_code_url
        };

        await generateInvoicePDF(invoiceData);
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="h-10 w-10 rounded-xl hover:bg-primary/10 text-muted-foreground/40 hover:text-primary transition-all"
        >
            <Download className="h-5 w-5" />
        </Button>
    );
}
