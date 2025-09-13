import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { authenticate } from '../lib/auth';

export async function plannerRoutes(fastify: FastifyInstance, { db }: { db: Pool }) {
  // All planner routes are protected
  fastify.addHook('preHandler', authenticate);

  // GET today's appointments and checklists for the planner view
  fastify.get('/api/planner/today', async (request: any, reply) => {
    try {
      const userId = request.user.id;

      // Fetch appointments for today
      const appointmentsQuery = `
        SELECT * FROM appointments 
        WHERE user_id = $1 AND appointment_datetime::date = CURRENT_DATE 
        ORDER BY appointment_datetime ASC;
      `;
      const appointmentsResult = await db.query(appointmentsQuery, [userId]);

      // Fetch all checklists
      const checklistsResult = await db.query('SELECT * FROM checklists WHERE user_id = $1', [userId]);

      reply.send({
        appointments: appointmentsResult.rows,
        checklists: checklistsResult.rows,
      });
    } catch (error) {
      fastify.log.error('Error fetching planner data for today:', error);
      reply.code(500).send({ message: 'Failed to fetch planner data.' });
    }
  });

  // Create a new appointment
  fastify.post('/api/appointments', async (request: any, reply) => {
    try {
      const userId = request.user.id;
      const { title, description, appointment_datetime, location } = request.body as {
        title: string;
        description?: string;
        appointment_datetime: string; // Should be an ISO string
        location?: string;
      };

      // Basic validation
      if (!title || !appointment_datetime) {
        return reply.code(400).send({ message: 'Title and appointment_datetime are required.' });
      }

      const { rows } = await db.query(
        'INSERT INTO appointments (user_id, title, description, appointment_datetime, location) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, title, description, appointment_datetime, location]
      );
      reply.code(201).send(rows[0]);
    } catch (error) {
      fastify.log.error('Error creating new appointment:', error);
      reply.code(500).send({ message: 'Failed to create appointment.' });
    }
  });
}