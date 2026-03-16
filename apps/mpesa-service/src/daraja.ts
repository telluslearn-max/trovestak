import axios from "axios";
import { createLogger } from "@trovestak/shared";

const log = createLogger("daraja");

export function getTimestamp(): string {
    return new Date()
        .toISOString()
        .replace(/[^0-9]/g, "")
        .slice(0, 14);
}

export async function getDarajaToken(consumerKey: string, consumerSecret: string): Promise<string | null> {
    try {
        const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
        const response = await axios.get(
            "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
            { headers: { Authorization: `Basic ${credentials}` } }
        );
        return response.data.access_token || null;
    } catch (err: any) {
        log.error("Daraja token error", { error: err.message });
        return null;
    }
}

export interface STKPushParams {
    token: string;
    businessShortCode: string;
    passkey: string;
    amount: number;
    phone: string;
    callbackUrl: string;
    accountReference: string;
    transactionDesc: string;
}

export async function initiateSTKPushRequest(params: STKPushParams) {
    const timestamp = getTimestamp();
    const password = Buffer.from(
        `${params.businessShortCode}${params.passkey}${timestamp}`
    ).toString("base64");

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
        const response = await axios.post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            payload,
            { headers: { Authorization: `Bearer ${params.token}` } }
        );
        return response.data;
    } catch (err: any) {
        log.error("STK Push error", { error: err.response?.data || err.message });
        throw err;
    }
}
