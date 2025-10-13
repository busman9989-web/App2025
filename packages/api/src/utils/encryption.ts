// packages/api/src/utils/encryption.ts
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

const LOCAL_DEV_ENCRYPTION_KEY_HEX = 'e57723b7e7c9f802c1f9d45e6a8b1c03d09e7f6a2b3c4d5e6f7a8b9c0d1e2f3a';

let ENCRYPTION_KEY_HEX: string;

if (process.env.ENCRYPTION_KEY) {
  ENCRYPTION_KEY_HEX = process.env.ENCRYPTION_KEY;
} else {
  ENCRYPTION_KEY_HEX = LOCAL_DEV_ENCRYPTION_KEY_HEX;
  console.warn('CRITICAL WARNING: ENCRYPTION_KEY is missing in .env for AES-256-GCM.');
  console.warn('Using a default key. DO NOT USE IN PRODUCTION!');
}

let KEY_BUFFER: Buffer;
try {
  KEY_BUFFER = Buffer.from(ENCRYPTION_KEY_HEX, 'hex');
  if (KEY_BUFFER.length !== 32) {
    throw new Error(`Encryption key must be 32 bytes (64 hex characters). Current key is ${KEY_BUFFER.length} bytes.`);
  }
} catch (error) {
  console.error('CRITICAL ERROR: Invalid ENCRYPTION_KEY configuration or fallback issue.');
  console.error('Please ensure ENCRYPTION_KEY in your .env is a 64-character hexadecimal string (32 bytes).');
  console.error('Attempting to use the LOCAL_DEV_ENCRYPTION_KEY_HEX as a final fallback.');
  console.error(error);
  KEY_BUFFER = Buffer.from(LOCAL_DEV_ENCRYPTION_KEY_HEX, 'hex');
  if (KEY_BUFFER.length !== 32) {
      throw new Error('Fallback LOCAL_DEV_ENCRYPTION_KEY_HEX is also invalid. Please fix encryption.ts');
  }
}

export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    console.error('Password hashing failed:', error);
    throw new Error('Failed to hash password');
  }
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash || typeof password !== 'string' || typeof hash !== 'string') {
    return false;
  }
  
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password verification failed:', error);
    return false;
  }
}

export function encrypt(text: string): string {
  if (!text || typeof text !== 'string') {
    throw new Error('Text to encrypt must be a non-empty string');
  }

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY_BUFFER, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt text');
  }
}

export function decrypt(encryptedText: string | null | undefined): string | null {
  if (!encryptedText || typeof encryptedText !== 'string') {
    return null;
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
    console.error('Decryption failed for text:', encryptedText?.substring(0, 20) + '...', error);
    return null;
  }
}