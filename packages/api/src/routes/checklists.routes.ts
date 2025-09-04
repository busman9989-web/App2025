import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { authenticate } from '../lib/auth';

export async function checklistRoutes(fastify: FastifyInstance, { db }: { db: Pool }) {
  // Middleware to ensure all checklist routes are authenticated
  fastify.addHook('preHandler', authenticate);

  // Get all checklists for the current user
  fastify.get('/api/checklists', async (request, reply) => {
    const userId = (request.user as any).id;
    const { rows } = await db.query('SELECT * FROM checklists WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    reply.send(rows);
  });

  // Create a new checklist
  fastify.post('/api/checklists', async (request, reply) => {
    const userId = (request.user as any).id;
    const { name, items } = request.body as any;
    const { rows } = await db.query(
      'INSERT INTO checklists (user_id, name, items) VALUES ($1, $2, $3) RETURNING *;',
      [userId, name, JSON.stringify(items || [])]
    );
    reply.code(201).send(rows[0]);
  });

  // Update an existing checklist
  fastify.put('/api/checklists/:id', async (request, reply) => {
    const userId = (request.user as any).id;
    const { id } = request.params as any;
    const { name, items } = request.body as any;
    const { rows } = await db.query(
      'UPDATE checklists SET name = $1, items = $2, updated_at = NOW() WHERE id = $3 AND user_id = $4 RETURNING *;',
      [name, JSON.stringify(items), id, userId]
    );
    if (rows.length === 0) {
      return reply.code(404).send({ message: 'Checklist not found or permission denied.' });
    }
    reply.send(rows[0]);
  });
}