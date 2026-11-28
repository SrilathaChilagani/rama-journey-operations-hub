// Business settings the owner fills in. These end up in the public browser bundle, so never
// put a secret here. Secrets (DATABASE_URL etc.) live in Vercel env vars / .env.local.
export const SITE_CONFIG = {
  // Business WhatsApp number, digits only with country code, e.g. "919876543210".
  // Empty = WhatsApp buttons are hidden.
  whatsappNumber: "",

  // ---- Shown on the privacy policy (/privacy). [TO SET] by the owner. ----
  // Registered business name, e.g. "Rama Cares Private Limited". Empty = "Rama Cares".
  legalName: "",
  // Business address for privacy requests and complaints.
  address: "",
  // Grievance officer under India's DPDP Act: who handles privacy requests and complaints.
  grievanceOfficerName: "",
  privacyEmail: "",
  privacyPhone: "",
  // Date the policy text was last changed (shown at the top of the page).
  privacyUpdated: "28 November 2026",
};
