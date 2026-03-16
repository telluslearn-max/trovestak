import axios from "axios";
import { createLogger } from "./logger.js";
const log = createLogger("daraja-helpers");
export function normalizePhone(phone) {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0") && cleaned.length === 10)
        return `254${cleaned.slice(1)}`;
    if (cleaned.startsWith("254") && cleaned.length === 12)
        return cleaned;
    if (cleaned.startsWith("7") && cleaned.length === 9)
        return `254${cleaned}`;
    return null;
}
export function getTimestamp() {
    return new Date()
        .toISOString()
        .replace(/[^0-9]/g, "")
        .slice(0, 14);
}
export async function getDarajaToken(consumerKey, consumerSecret) {
    try {
        const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
        const response = await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", { headers: { Authorization: `Basic ${credentials}` } });
        return response.data.access_token || null;
    }
    catch (err) {
        log.error("Daraja token error", { error: err.message });
        return null;
    }
}
export async function initiateSTKPushRequest(params) {
    const timestamp = getTimestamp();
    const password = Buffer.from(`${params.businessShortCode}${params.passkey}${timestamp}`).toString("base64");
    const payload = {
        BusinessShortCode: params.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(params.amount),
        PartyA: params.phone,
        PartyB: params.businessShortCode,
        PhoneNumber: params.phone,
        CallBackURL: params.callbackUrl,
        AccountReference: params.accountReference,
        TransactionDesc: params.transactionDesc,
    };
    try {
        const response = await axios.post("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", payload, { headers: { Authorization: `Bearer ${params.token}` } });
        return response.data;
    }
    catch (err) {
        log.error("STK Push request error", { error: err.response?.data || err.message });
        throw err;
    }
}
