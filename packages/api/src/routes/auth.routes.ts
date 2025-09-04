import { FastifyInstance } from 'fastify'; import { Pool } from 'pg'; import argon2 from 'argon2'; import { encrypt, decrypt } from '../lib/crypto';
export async function authRoutes(fastify: FastifyInstance, { db }: { db: Pool }) {
  fastify.post('/api/auth/register', async (request, reply) => {
    const { displayName, email, password } = request.body as any;
    try {
      const password_hash = await argon2.hash(password);
      const display_name_encrypted = encrypt(displayName);
      await db.query('INSERT INTO users (display_name_encrypted, email, password_hash) VALUES ($1, $2, $3)',[display_name_encrypted, email, password_hash]);
      reply.code(201).send({ message: 'Registration successful. Please login.' });
    } catch (err: any) {
      if (err.code === '23505') return reply.code(409).send({ message: 'An account with this email already exists.' });
      fastify.log.error(err); reply.code(500).send({ message: 'Internal server error.' });
    }
  });
  fastify.post('/api/auth/login', async (request, reply) => {
    const { email, password } = request.body as any;
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user || !(await argon2.verify(user.password_hash, password))) return reply.code(401).send({ message: 'Invalid credentials.' });
    const displayName = decrypt(user.display_name_encrypted);
    const token = fastify.jwt.sign({ id: user.id, email: user.email, displayName, role: user.role });
    reply.send({ token, user: { id: user.id, displayName, email: user.email } });
  });
}
