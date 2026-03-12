"use client";

import { pdf } from "@react-pdf/renderer";
import { InvoicePDF } from "./invoice-pdf";

export async function generateInvoicePDF(invoiceData: any) {
    const blob = await pdf(<InvoicePDF invoiceData={ invoiceData } />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice-${invoiceData.invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
