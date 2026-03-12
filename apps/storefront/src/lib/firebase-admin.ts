import * as admin from "firebase-admin";

/**
 * FIREBASE ADMIN SDK SETTINGS
 * 
 * This is used for:
 * 1. Verifying Firebase Phone OTP JWTs on the server.
 * 2. Creating custom tokens for Supabase authentication.
 */

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Replace literal \n with actual newlines in private key
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            }),
        });
        console.log("Firebase Admin initialized successfully");
    } catch (error) {
        console.error("Firebase Admin initialization error:", error);
    }
}

export const auth = admin.auth();
export const db = admin.firestore();

/**
 * Token Exchange Helper
 * 
 * In a microservices event-driven architecture, we use Firebase for Auth
 * but Supabase for database. This helper would bridge the two.
 * 
 * TODO: Implement JWT verification logic for custom claims.
 */
export async function verifyFirebaseToken(token: string) {
    try {
        return await auth.verifyIdToken(token);
    } catch (error) {
        console.error("Token verification failed:", error);
        return null;
    }
}
