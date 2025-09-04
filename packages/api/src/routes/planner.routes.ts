import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { authenticate } from '../lib/auth';

export async function plannerRoutes(fastify: FastifyInstance, { db }: { db: Pool }) {
  // All planner routes are protected
  fastify.addHook('preHandler', authenticate);

  // GET today's appointments and checklists for the planner view
  fastify.get('/api/planner/today', async (request, reply) => {
    const userId = (request.user as any).id;
    
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
  });
  
  // Create a new appointment
  fastify.post('/api/appointments', async (request, reply) => {
    const userId = (request.user as any).id;
    const { title, description, appointment_datetime, location } = request.body as any;
    const { rows } = await db.query(
      'INSERT INTO appointments (user_id, title, description, appointment_datetime, location) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, title, description, appointment_datetime, location]
    );
    reply.code(201).send(rows[0]);
  });
}