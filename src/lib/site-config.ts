// Business settings the owner fills in. These end up in the public browser bundle, so never
// put a secret here. Secrets (DATABASE_URL etc.) live in Vercel env vars / .env.local.
export const SITE_CONFIG = {
  // Business WhatsApp number, digits only with country code, e.g. "919876543210".
  // Empty = WhatsApp buttons are hidden.
  whatsappNumber: "",
};
