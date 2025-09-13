import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { authenticate } from '../lib/auth';
import { generateSecret, verifyToken } from '@levminer/speakeasy';
import { toDataURL } from 'qrcode';

export async function twoFactorAuthRoutes(fastify: FastifyInstance, { db }: { db: Pool }) {
  // All 2FA routes are protected and require a user to be logged in
  fastify.addHook('preHandler', authenticate);

  // Generate a new 2FA secret and QR code for the user to scan
  fastify.post('/2fa/generate', async (request, reply) => {
    const user = request.user as any;
    const secret = generateSecret({
      name: `CarerConnect (${user.email})`,
    });
    
    // Store the ascii secret in the database temporarily until it's verified
    await db.query('UPDATE users SET two_fa_secret = $1 WHERE id = $2', [secret.ascii, user.id]);

    const qrCodeDataURL = await toDataURL(secret.otpauth_url!);
    
    // Send the QR code image and the secret (for manual entry) to the frontend
    reply.send({
      qrCode: qrCodeDataURL,
      secret: secret.base32,
    });
  });

  // Verify the token provided by the user and enable 2FA
  fastify.post('/2fa/verify', async (request, reply) => {
    const user = request.user as any;
    const { token } = request.body as any;

    const { rows } = await db.query('SELECT two_fa_secret FROM users WHERE id = $1', [user.id]);
    const secret = rows[0]?.two_fa_secret;

    if (!secret) {
      return reply.code(400).send({ message: '2FA secret not found. Please generate a new one.' });
    }

    const isValid = verifyToken({
      secret: secret,
      encoding: 'ascii',
      token: token,
    });

    if (isValid) {
      // If the token is valid, enable 2FA for the user
      await db.query('UPDATE users SET two_fa_enabled = TRUE WHERE id = $1', [user.id]);
      reply.send({ message: '2FA has been enabled successfully.' });
    } else {
      reply.code(400).send({ message: 'Invalid token. Please try again.' });
    }
  });
}