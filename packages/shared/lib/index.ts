// ============================================
// SHARED PACKAGE - EXPORTS
// ============================================

// Product normalizer types (existing)
export * from './types.js';
export * from './variant-detector.js';
export * from './seo-generator.js';
export * from './spec-generator.js';
export * from './content-generator.js';
export { transformProduct, processCSV, generateIndex } from './transform-engine.js';

// Commerce domain types (new - for microservices)
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

// Daraja M-Pesa helpers
export * from './daraja.js';

// Pub/Sub Event Publisher
export * from './publisher.js';





