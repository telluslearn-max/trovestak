#!/usr/bin/env node
/**
 * Trovestak Gateway — JWT Auth Sidecar
 *
 * Listens on localhost:8090. nginx calls GET /_auth via auth_request before
 * forwarding requests to protected upstream services.
 *
 * Returns:
 *   200  — valid Supabase JWT (user is authenticated)
 *   401  — missing or invalid token
 *   403  — authenticated but missing required role (admin routes)
 *
 * No npm dependencies — uses only Node.js built-in crypto + http.
 */

import http from 'http';
import crypto from 'crypto';

const PORT = 8090;
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
const ADMIN_REQUIRED_HEADER = 'x-require-admin';

if (!JWT_SECRET) {
    console.warn('[auth] SUPABASE_JWT_SECRET not set — all JWT checks will fail. Set it in gateway env.');
}

function base64UrlDecode(str) {
    // Convert base64url to base64, then decode
    const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(
        str.length + (4 - (str.length % 4)) % 4, '='
    );
    return Buffer.from(padded, 'base64');
}

function verifyHS256(token, secret) {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;

    try {
        const signingInput = `${headerB64}.${payloadB64}`;
        const expected = crypto
            .createHmac('sha256', secret)
            .update(signingInput)
            .digest('base64url');

        if (expected !== sigB64) return null;

        const payload = JSON.parse(base64UrlDecode(payloadB64).toString('utf8'));

        // Check expiry
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

        return payload;
    } catch {
        return null;
    }
}

const server = http.createServer((req, res) => {
    // nginx passes the original Authorization header via proxy_set_header
    const authHeader = req.headers['authorization'] || '';

    if (!JWT_SECRET) {
        res.writeHead(401);
        res.end('JWT secret not configured');
        return;
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
        res.writeHead(401);
        res.end('Missing token');
        return;
    }

    const payload = verifyHS256(token, JWT_SECRET);
    if (!payload) {
        res.writeHead(401);
        res.end('Invalid or expired token');
        return;
    }

    // Admin role check — nginx sets X-Require-Admin: 1 on catalog routes
    if (req.headers[ADMIN_REQUIRED_HEADER] === '1') {
        const role = payload.role ?? payload.user_metadata?.role ?? payload.app_metadata?.role;
        if (role !== 'admin' && role !== 'service_role') {
            res.writeHead(403);
            res.end('Admin role required');
            return;
        }
    }

    // Forward user id downstream so services can use it without re-parsing the JWT
    res.writeHead(200, {
        'X-Auth-User': payload.sub ?? '',
        'X-Auth-Role': payload.role ?? 'authenticated',
    });
    res.end('OK');
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`[auth] JWT sidecar listening on 127.0.0.1:${PORT}`);
});

process.on('SIGTERM', () => { server.close(); process.exit(0); });
process.on('SIGINT',  () => { server.close(); process.exit(0); });
