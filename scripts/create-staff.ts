// Creates a staff login, or resets its password if the email exists.
// Run: bun run staff:create <email> "<Full name>" [admin]
// The password is typed at a hidden prompt — never passed on the command line.
import { neon } from "@neondatabase/serverless";
import { hashPassword } from "../src/server/password";

const [email, name, role = "staff"] = process.argv.slice(2);
if (!email || !name || !["admin", "staff"].includes(role)) {
  console.error('Usage: bun run staff:create <email> "<Full name>" [admin]');
  process.exit(1);
}
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set (put it in .env.local)");

async function hiddenPrompt(label: string): Promise<string> {
  process.stdout.write(label);
  const stdin = process.stdin;
  if (stdin.isTTY) stdin.setRawMode(true);
  let value = "";
  for await (const chunk of stdin) {
    for (const ch of chunk.toString("utf8")) {
      if (ch === "\r" || ch === "\n") {
        if (stdin.isTTY) stdin.setRawMode(false);
        process.stdout.write("\n");
        stdin.pause();
        return value;
      }
      if (ch === "\u0003") process.exit(130);
      value = ch === "\u007f" ? value.slice(0, -1) : value + ch;
    }
  }
  return value;
}

const password = await hiddenPrompt("Password (min 10 characters): ");
if (password.length < 10) {
  console.error("Password too short.");
  process.exit(1);
}
if ((await hiddenPrompt("Repeat password: ")) !== password) {
  console.error("Passwords don't match.");
  process.exit(1);
}

const sql = neon(url);
await sql.query(
  `insert into staff_users (email, name, password_hash, role) values ($1, $2, $3, $4)
   on conflict (email) do update set name = excluded.name, password_hash = excluded.password_hash,
     role = excluded.role, active = true, failed_attempts = 0, locked_until = null`,
  [email.trim().toLowerCase(), name, await hashPassword(password), role],
);
console.log(`Staff login ready for ${email.trim().toLowerCase()} (${role}).`);
