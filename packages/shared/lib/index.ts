// ============================================
// SHARED PACKAGE - EXPORTS
// ============================================

// Product normalizer types (existing)
export * from './types';
export * from './variant-detector';
export * from './seo-generator';
export * from './spec-generator';
export * from './content-generator';
export { transformProduct, processCSV, generateIndex } from './transform-engine';

// Commerce domain types (new - for microservices)
export * from './commerce-types';

// Formatting utilities
export * from './formatters';

// Cloud Pub/Sub event contracts
export * from './events';

// Structured logger (Google Cloud Logging compatible)
export * from './logger';

// Environment variable validation
export * from './env';

// Supabase clients
export * from './supabase';

// Daraja M-Pesa helpers
export * from './daraja';

// Pub/Sub Event Publisher
export * from './publisher';





