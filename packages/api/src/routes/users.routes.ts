import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { authenticate } from '../lib/auth';
import { encrypt, decrypt } from '../lib/crypto';

export async function userRoutes(fastify: FastifyInstance, { db }: { db: Pool }) {
  // All user routes are protected
  fastify.addHook('preHandler', authenticate);

  // Get the current user's profile
  fastify.get('/api/users/me', async (request, reply) => {
    const userId = (request.user as any).id;
    const { rows } = await db.query(
      'SELECT id, email, role, display_name_encrypted, status_encrypted FROM users WHERE id = $1',
      [userId]
    );
    if (rows.length === 0) {
      return reply.code(404).send({ message: 'User not found.' });
    }
    const user = rows[0];
    reply.send({
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: decrypt(user.display_name_encrypted),
      status: decrypt(user.status_encrypted),
    });
  });
  
  // Update the current user's status
  fastify.put('/api/users/me/status', async (request, reply) => {
    const userId = (request.user as any).id;
    const { status } = request.body as any;
    const status_encrypted = encrypt(status);

    await db.query(
      'UPDATE users SET status_encrypted = $1 WHERE id = $2',
      [status_encrypted, userId]
    );
    reply.send({ message: 'Status updated' });
  });
}