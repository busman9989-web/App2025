// packages/api/src/utils/encryption.ts
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10; // Added for bcryptjs consistency
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES-256-GCM
const TAG_LENGTH = 16; // For GCM authentication tag

// IMPORTANT: This key MUST be 32 bytes (256 bits) for AES-256-GCM.
// When represented as a hexadecimal string, it will be 64 characters long.
// Generate a strong, random 64-character hexadecimal string (e.g., openssl rand -hex 32).

// A robust fallback for development, ensuring it's a valid 64-character hex string.
const LOCAL_DEV_ENCRYPTION_KEY_HEX = 'e57723b7e7c9f802c1f9d45e6a8b1c03d09e7f6a2b3c4d5e6f7a8b9c0d1e2f3a'; // THIS IS A VALID 64-CHAR HEX KEY

let ENCRYPTION_KEY_HEX: string;

// Prioritize .env key, fall back to local dev key
if (process.env.ENCRYPTION_KEY) {
  // If ENCRYPTION_KEY exists, assume it's meant to be hex encoded
  ENCRYPTION_KEY_HEX = process.env.ENCRYPTION_KEY;
} else {
  ENCRYPTION_KEY_HEX = LOCAL_DEV_ENCRYPTION_KEY_HEX;
  console.warn('CRITICAL WARNING: ENCRYPTION_KEY is missing in .env for AES-256-GCM.');
  console.warn('Using a default key. DO NOT USE IN PRODUCTION!');
}

let KEY_BUFFER: Buffer;
try {
  KEY_BUFFER = Buffer.from(ENCRYPTION_KEY_HEX, 'hex'); // <--- CRUCIAL: Add 'hex' encoding here
  if (KEY_BUFFER.length !== 32) {
    throw new Error(`Encryption key must be 32 bytes (64 hex characters). Current key is ${KEY_BUFFER.length} bytes.`);
  }
} catch (error) {
  console.error('CRITICAL ERROR: Invalid ENCRYPTION_KEY configuration or fallback issue.');
  console.error('Please ensure ENCRYPTION_KEY in your .env is a 64-character hexadecimal string (32 bytes).');
  console.error('Attempting to use the LOCAL_DEV_ENCRYPTION_KEY_HEX as a final fallback.');
  console.error(error);
  // As a final fallback, use the local dev key, ensuring it's valid
  KEY_BUFFER = Buffer.from(LOCAL_DEV_ENCRYPTION_KEY_HEX, 'hex');
  if (KEY_BUFFER.length !== 32) {
      throw new Error('Fallback LOCAL_DEV_ENCRYPTION_KEY_HEX is also invalid. Please fix encryption.ts');
  }
}

// --- ADDED FUNCTION TO FIX SEED SCRIPT ---
/**
 * Hashes a password using bcryptjs.
 * @param password The plain-text password to hash.
 * @returns A promise that resolves to the hashed password.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}
// -----------------------------------------

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY_BUFFER, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();
  // Format: iv_hex:tag_hex:encrypted_hex
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string | null | undefined): string | null {
  if (!encryptedText) {
    return null; // Handle null or undefined input gracefully
  }

  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format (expected 3 colon-separated parts)');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    if (iv.length !== IV_LENGTH || tag.length !== TAG_LENGTH) {
      throw new Error('Invalid IV or Auth Tag length in encrypted text');
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, KEY_BUFFER, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return null; // Return null on decryption failure to prevent app crash
  }
}