// ============================================
// SHARED PACKAGE - EXPORTS
// ============================================
// Commerce domain types (microservices event contracts)
export * from './commerce-types.js';
// Formatting utilities
export * from './formatters.js';
// Cloud Pub/Sub event contracts
export * from './events.js';
// Structured logger (Google Cloud Logging compatible)
export * from './logger.js';
// Environment variable validation
export * from './env.js';
// Supabase clients
export * from './supabase.js';
// Phone normalisation (Kenya numbers)
// Note: Daraja-specific helpers live in apps/mpesa-service/src/daraja.ts
export * from './daraja.js';
// Pub/Sub Event Publisher
export * from './publisher.js';
// Note: Product import tools (transform-engine, variant-detector, seo/spec/content-generator)
// have moved to apps/catalog-service/src/import/
