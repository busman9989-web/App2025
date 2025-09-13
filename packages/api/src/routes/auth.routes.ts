// File: packages/api/src/routes/auth.routes.ts
import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { generateToken, verifyToken } from '../lib/jwt';
import { encrypt, decrypt } from '../lib/crypto';
import { authenticate } from '../lib/auth';

export async function authRoutes(fastify: FastifyInstance, { db }: { db: Pool }) {
  // Register route (NO CHANGES HERE)
  fastify.post('/auth/register', async (request, reply) => {
    const { email, password, displayName, status } = request.body as any;

    if (!email || !password || !displayName || !status) {
      return reply.code(400).send({ message: 'Email, password, display name, and status are required.' });
    }

    try {
      const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return reply.code(409).send({ message: 'User with this email already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      fastify.log.info(`Registering user ${email}. Hashed password: ${passwordHash.substring(0, 10)}...`); // DEBUG LOG: Show part of hash

      const display_name_encrypted = encrypt(displayName);
      const status_encrypted = encrypt(status);

      const { rows } = await db.query(
        'INSERT INTO users (email, password_hash, display_name_encrypted, status_encrypted) VALUES ($1, $2, $3, $4) RETURNING id, email, role',
        [email, passwordHash, display_name_encrypted, status_encrypted]
      );

      const user = rows[0];
      const token = generateToken(user);

      reply.code(201).send({ message: 'User registered successfully', token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
      fastify.log.error('Registration error:', error);
      reply.code(500).send({ message: 'Registration failed.' });
    }
  });

  // Login route (WITH DEBUG LOGS)
  fastify.post('/auth/login', async (request, reply) => {
    const { email, password } = request.body as any;

    fastify.log.info(`[LOGIN DEBUG] Attempting login for email: ${email}`);
    fastify.log.info(`[LOGIN DEBUG] Received password (plaintext): ${password}`); // CAUTION: Only for debug, NEVER in production logs!

    if (!email || !password) {
      return reply.code(400).send({ message: 'Email and password are required.' });
    }

    try {
      const { rows } = await db.query('SELECT id, email, password_hash, role FROM users WHERE email = $1', [email]);
      if (rows.length === 0) {
        fastify.log.warn(`[LOGIN DEBUG] Login failed: User not found for email: ${email}`);
        return reply.code(401).send({ message: 'Invalid credentials.' });
      }

      const user = rows[0];
      fastify.log.info(`[LOGIN DEBUG] Found user ${user.email}. Stored hashed password: ${user.password_hash.substring(0, 10)}...`); // Show part of stored hash

      // Compare the plaintext password from request with the hashed password from DB
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      fastify.log.info(`[LOGIN DEBUG] bcrypt.compare result for ${email}: ${isPasswordValid}`);

      if (!isPasswordValid) {
        fastify.log.warn(`[LOGIN DEBUG] Login failed: Password mismatch for email: ${email}`);
        return reply.code(401).send({ message: 'Invalid credentials.' });
      }

      const token = generateToken(user);
      fastify.log.info(`[LOGIN DEBUG] Login successful for user: ${user.email}`);

      reply.code(200).send({ message: 'Login successful', token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
      fastify.log.error('[LOGIN DEBUG] Login error:', error);
      reply.code(500).send({ message: 'Login failed.' });
    }
  });

  // Logout route (NO CHANGES HERE)
  fastify.post('/auth/logout', async (request, reply) => {
    reply.code(200).send({ message: 'Logged out successfully.' });
  });

  // Current user route (NO CHANGES HERE)
  fastify.get('/auth/me', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as any).user.id;
    try {
      const { rows } = await db.query('SELECT id, email, role, display_name_encrypted, status_encrypted FROM users WHERE id = $1', [userId]);
      if (rows.length === 0) {
        return reply.code(404).send({ message: 'User not found.' });
      }
      const user = rows[0];
      user.display_name = decrypt(user.display_name_encrypted);
      user.status = decrypt(user.status_encrypted);
      delete user.display_name_encrypted;
      delete user.status_encrypted;
      reply.send(user);
    } catch (error) {
      fastify.log.error('Error fetching user data:', error);
      reply.code(500).send({ message: 'Failed to fetch user data.' });
    }
  });
}