import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto"

/**
 * Hash a PIN using scrypt with a per-record random salt.
 * Stored format: `${salt}:${derivedKey}` (both hex).
 */
export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex")
  const derived = scryptSync(pin, salt, 64).toString("hex")
  return `${salt}:${derived}`
}

export function verifyPin(pin: string, stored: string): boolean {
  const [salt, key] = stored.split(":")
  if (!salt || !key) return false
  const derived = scryptSync(pin, salt, 64)
  const keyBuffer = Buffer.from(key, "hex")
  if (keyBuffer.length !== derived.length) return false
  return timingSafeEqual(keyBuffer, derived)
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}
