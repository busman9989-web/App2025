import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

// Ensure this key is 32 characters long for AES-256-CBC
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; 
const IV_LENGTH = 16; // For AES-256-CBC

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  console.error("ERROR: ENCRYPTION_KEY must be a 32-byte string (256-bit for AES-256-CBC). Please set it in your .env file.");
  // In a production app, you might want to throw an error or exit here.
  // For development, we'll try to proceed but log the error clearly.
}

// Function to encrypt text
export function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    console.error("Encryption key not set. Cannot encrypt.");
    // Decide how to handle this gracefully: return text, throw error, etc.
    // For now, return a recognizable error string or the original text.
    return `ENCRYPTION_ERROR:${text}`; 
  }
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (e) {
    console.error("Encryption failed:", e);
    return `ENCRYPTION_ERROR:${text}`;
  }
}

// Function to decrypt text
export function decrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    console.error("Encryption key not set. Cannot decrypt.");
    return text; // Fallback to returning the encrypted text
  }
  if (!text || text.startsWith('ENCRYPTION_ERROR:') || text.indexOf(':') === -1) {
      // If it's an error string, or not in expected format, return as is (or handle as an error)
      return text.replace('ENCRYPTION_ERROR:', ''); 
  }
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) {
        console.warn("Invalid encrypted text format for decryption. Returning original text.", text);
        return text; 
    }
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    console.error("Decryption failed:", e);
    return text; // Return original if decryption fails
  }
}