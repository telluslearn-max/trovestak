/**
 * KRA eTIMS Integration Helpers
 * 
 * This utility prepares payloads for the official eTIMS signature process.
 */

interface KRAItem {
    itemCode: string;
    itemName: string;
    qty: number;
    unitPrice: number;
    taxableAmount: number;
    taxAmount: number;
    totalAmount: number;
}

export function calculateVAT(amountCents: number, rate: number = 0.16) {
    const taxableAmount = Math.round(amountCents / (1 + rate));
    const taxAmount = amountCents - taxableAmount;
    return { taxableAmount, taxAmount };
}

export function generateETIMSPayload(invoice: any) {
    const { taxableAmount, taxAmount } = calculateVAT(invoice.total_amount);

    return {
        invoiceHeader: {
            invoiceNumber: invoice.invoice_number,
            invoiceDate: new Date(invoice.invoice_date).toISOString().split('T')[0],
            customerPin: invoice.customer_pin || "P000000000X",
            customerName: invoice.customer_name,
        },
        invoiceSummary: {
            subtotal: taxableAmount,
            totalTax: taxAmount,
            grandTotal: invoice.total_amount,
        },
        items: (invoice.metadata?.items || []).map((item: any) => {
            const { taxableAmount: itemTaxable, taxAmount: itemTax } = calculateVAT(item.price * item.quantity);
            return {
                itemName: item.description,
                qty: item.quantity,
                unitPrice: item.price,
                taxableAmount: itemTaxable,
                taxAmount: itemTax,
                totalAmount: item.price * item.quantity,
            };
        })
    };
}
