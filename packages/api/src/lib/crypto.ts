import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; const SALT = process.env.ENCRYPTION_SALT;
if (!ENCRYPTION_KEY || !SALT) throw new Error('ENCRYPTION_KEY and ENCRYPTION_SALT must be set.');
const key = scryptSync(ENCRYPTION_KEY, SALT, 32); const algorithm = 'aes-256-gcm';
export function encrypt(text: string): string {
  const iv = randomBytes(16); const cipher = createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${encrypted.toString('hex')}:${authTag.toString('hex')}`;
}
export function decrypt(encryptedText: string | null | undefined): string {
  if (!encryptedText) return '';
  try {
    const parts = encryptedText.split(':'); if (parts.length !== 3) throw new Error('Invalid format.');
    const [ivHex, encryptedHex, authTagHex] = parts;
    const iv = Buffer.from(ivHex, 'hex'); const encrypted = Buffer.from(encryptedHex, 'hex'); const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = createDecipheriv(algorithm, key, iv); decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) { console.error('Decryption failed:', error); return 'Error'; }
}
