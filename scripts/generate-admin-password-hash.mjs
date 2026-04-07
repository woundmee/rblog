import crypto from "node:crypto";

const password = process.argv[2];

if (!password) {
  console.error("Usage: npm run admin:hash -- '<your-password>'");
  process.exit(1);
}

const N = 16384;
const r = 8;
const p = 1;
const salt = crypto.randomBytes(16).toString("base64url");
const key = crypto.scryptSync(password, salt, 64, {
  N,
  r,
  p,
  maxmem: 64 * 1024 * 1024
});
const digest = key.toString("base64url");
const rawHash = `scrypt$${N}$${r}$${p}$${salt}$${digest}`;
const envReadyHash = rawHash.replace(/\$/g, "\\$");

console.log(`ADMIN_PASSWORD_HASH=${envReadyHash}`);
