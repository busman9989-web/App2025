import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { authenticate } from '../lib/auth';

export async function resourceRoutes(fastify: FastifyInstance, { db }: { db: Pool }) {
  // A simple check for admin/moderator roles. In a real app, this would be more robust.
  async function requireAdmin(request: any, reply: any) {
    if (request.user.role !== 'admin' && request.user.role !== 'moderator') {
        return reply.code(403).send({ message: 'Permission denied.' });
    }
  }

  // GET all resources (public)
  fastify.get('/api/resources', async (request, reply) => {
      const { rows } = await db.query('SELECT * FROM resources ORDER BY created_at DESC');
      reply.send(rows);
  });

  // POST a new resource (admin/mod only)
  fastify.post('/api/resources', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
      const { title, content, category, external_url } = request.body as any;
      const query = `
          INSERT INTO resources (title, content, category, external_url)
          VALUES ($1, $2, $3, $4) RETURNING *;
      `;
      const { rows } = await db.query(query, [title, content, category, external_url]);
      reply.code(201).send(rows[0]);
  });
}