// Sets or clears the mobile number used for a staff member's SMS sign-in code.
// Run: bun run staff:phone <email> +919876543210   (or "none" to go back to password only)
import { neon } from "@neondatabase/serverless";
import { E164 } from "../src/server/twilio";

const [email, raw] = process.argv.slice(2);
if (!email || !raw) {
  console.error("Usage: bun run staff:phone <email> <+countrycode-number | none>");
  process.exit(1);
}
const phone = raw === "none" ? null : raw.replace(/[\s()-]/g, "");
if (phone && !E164.test(phone)) {
  console.error("Phone must include the country code, e.g. +919876543210");
  process.exit(1);
}
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set (put it in .env.local)");
const sql = neon(url);
const rows = (await sql.query(`update staff_users set phone = $2 where email = $1 returning email`, [
  email.trim().toLowerCase(),
  phone,
])) as unknown[];
if (!rows.length) {
  console.error(`No staff login for ${email}. Create it first with bun run staff:create.`);
  process.exit(1);
}
// A new number must be proven by SMS again, so forget trusted devices.
await sql.query(
  `delete from staff_trusted_devices where user_id = (select id from staff_users where email = $1)`,
  [email.trim().toLowerCase()],
);
console.log(phone ? `SMS sign-in codes for ${email} will go to ${phone}.` : `${email} now signs in with password only.`);
