import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { authenticate } from '../lib/auth';

export async function reportRoutes(fastify: FastifyInstance, { db }: { db: Pool }) {
  // All reporting routes are protected
  fastify.addHook('preHandler', authenticate);

  // Create a new report
  fastify.post('/api/reports', async (request, reply) => {
    const reporterId = (request.user as any).id;
    const { target_type, target_id, reason } = request.body as any;

    if (!['post', 'comment'].includes(target_type) || !target_id || !reason) {
      return reply.code(400).send({ message: 'Invalid report data. Target type, ID, and reason are required.' });
    }

    const { rows } = await db.query(
      'INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES ($1, $2, $3, $4) RETURNING id, status;',
      [reporterId, target_type, target_id, reason]
    );
    reply.code(201).send(rows[0]);
  });
}