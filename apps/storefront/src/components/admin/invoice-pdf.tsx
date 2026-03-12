"use client";

import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
    Image
} from "@react-pdf/renderer";

// Define styles for the PDF
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: "Helvetica",
        color: "#333",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        paddingBottom: 20,
    },
    logo: {
        width: 120,
    },
    companyInfo: {
        textAlign: "right",
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 4,
        color: "#000",
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        marginBottom: 10,
        textTransform: "uppercase",
        color: "#666",
    },
    detailsGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 30,
    },
    detailBlock: {
        width: "45%",
    },
    table: {
        width: "auto",
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#f9f9f9",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        padding: 8,
        fontWeight: "bold",
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        padding: 8,
    },
    col1: { width: "50%" },
    col2: { width: "15%", textAlign: "right" },
    col3: { width: "15%", textAlign: "right" },
    col4: { width: "20%", textAlign: "right" },

    summary: {
        marginTop: 20,
        alignItems: "flex-end",
    },
    summaryRow: {
        flexDirection: "row",
        marginBottom: 5,
    },
    summaryLabel: {
        width: 100,
        textAlign: "right",
        marginRight: 10,
    },
    summaryValue: {
        width: 100,
        textAlign: "right",
        fontWeight: "bold",
    },
    totalRow: {
        flexDirection: "row",
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#000",
    },
    totalLabel: {
        width: 100,
        textAlign: "right",
        marginRight: 10,
        fontSize: 14,
        fontWeight: "bold",
    },
    totalValue: {
        width: 100,
        textAlign: "right",
        fontSize: 14,
        fontWeight: "bold",
    },
    footer: {
        marginTop: 50,
        textAlign: "center",
        color: "#999",
        borderTopWidth: 1,
        borderTopColor: "#eee",
        paddingTop: 20,
    },
    qrPlaceholder: {
        width: 100,
        height: 100,
        backgroundColor: "#eee",
        marginTop: 20,
        alignSelf: "flex-end",
        justifyContent: "center",
        alignItems: "center",
    }
});

interface InvoiceProps {
    invoiceData: {
        invoiceNumber: string;
        date: string;
        customer: {
            name: string;
            email: string;
            phone?: string;
            address?: string;
        };
        items: Array<{
            description: string;
            quantity: number;
            price: number;
        }>;
        subtotal: number;
        tax: number;
        total: number;
        qrCodeUrl?: string;
    };
}

export const InvoicePDF = ({ invoiceData }: InvoiceProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>INVOICE</Text>
                    <Text>#{invoiceData.invoiceNumber}</Text>
                    <Text>Date: {invoiceData.date}</Text>
                </View>
                <View style={styles.companyInfo}>
                    <Text style={{ fontWeight: "bold", fontSize: 14 }}>TROVESTAK KENYA</Text>
                    <Text>Nairobi, Kenya</Text>
                    <Text>Email: info@trovestak.com</Text>
                    <Text>PIN: P000000000X</Text>
                </View>
            </View>

            {/* Details Section */}
            <View style={styles.detailsGrid}>
                <View style={styles.detailBlock}>
                    <Text style={styles.sectionTitle}>Bill To:</Text>
                    <Text style={{ fontWeight: "bold", marginBottom: 2 }}>{invoiceData.customer.name}</Text>
                    <Text>{invoiceData.customer.email}</Text>
                    {invoiceData.customer.phone && <Text>{invoiceData.customer.phone}</Text>}
                    {invoiceData.customer.address && <Text>{invoiceData.customer.address}</Text>}
                </View>
            </View>

            {/* Table */}
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={styles.col1}>Description</Text>
                    <Text style={styles.col2}>Qty</Text>
                    <Text style={styles.col3}>Price</Text>
                    <Text style={styles.col4}>Total</Text>
                </View>
                {invoiceData.items.map((item, index) => (
                    <View key={index} style={styles.tableRow}>
                        <Text style={styles.col1}>{item.description}</Text>
                        <Text style={styles.col2}>{item.quantity}</Text>
                        <Text style={styles.col3}>{(item.price / 100).toLocaleString()}</Text>
                        <Text style={styles.col4}>{(item.price * item.quantity / 100).toLocaleString()}</Text>
                    </View>
                ))}
            </View>

            {/* Summary */}
            <View style={styles.summary}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal:</Text>
                    <Text style={styles.summaryValue}>KES {(invoiceData.subtotal / 100).toLocaleString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>VAT (16%):</Text>
                    <Text style={styles.summaryValue}>KES {(invoiceData.tax / 100).toLocaleString()}</Text>
                </View>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalValue}>KES {(invoiceData.total / 100).toLocaleString()}</Text>
                </View>
            </View>

            {/* KRA eTIMS QR Code Section */}
            <View style={{ marginTop: 40, alignItems: "flex-end" }}>
                <Text style={{ fontSize: 8, color: "#666", marginBottom: 5 }}>Verified by KRA eTIMS</Text>
                {invoiceData.qrCodeUrl ? (
                    <Image src={invoiceData.qrCodeUrl} style={{ width: 80, height: 80 }} />
                ) : (
                    <View style={styles.qrPlaceholder}>
                        <Text style={{ fontSize: 6, textAlign: "center", color: "#999" }}>QR Code Pending Verification</Text>
                    </View>
                )}
            </View>

            <View style={styles.footer}>
                <Text>Thank you for your business!</Text>
                <Text style={{ marginTop: 5, fontSize: 8 }}>This is a computer generated invoice and does not require a signature.</Text>
            </View>
        </Page>
    </Document>
);
