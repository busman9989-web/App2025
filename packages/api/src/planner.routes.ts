import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from './server';

export async function plannerRoutes(app: FastifyInstance) {
  // Protect all routes in this file
  app.addHook('preHandler', app.authenticate);

  // GET /api/planner/today - Fetches today's appointments AND checklists
  app.get('/today', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      // Use Promise.all to fetch both appointments and checklists concurrently for better performance
      const [appointments, checklists] = await Promise.all([
        // Fetch appointments scheduled for today
        prisma.appointment.findMany({
          where: {
            userId: request.user.id,
            appointmentDatetime: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
          orderBy: {
            appointmentDatetime: 'asc',
          },
        }),
        // Fetch checklists created today (that are not templates)
        prisma.checklist.findMany({
          where: {
            userId: request.user.id,
            isTemplate: false,
            createdAt: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        }),
      ]);

      // Return the data in the exact object shape the frontend expects
      return reply.send({ appointments, checklists });

    } catch (error) {
      app.log.error('Failed to fetch today\'s planner data:', error);
      return reply.status(500).send({ message: 'Failed to fetch planner data' });
    }
  });

  // POST /api/planner/appointments - Create a new appointment
  // This route is used by your AppointmentComposer.vue component
  app.post('/appointments', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    try {
      const { title, description, appointmentDatetime, location } = request.body as any;

      if (!title || !appointmentDatetime) {
        return reply.status(400).send({ message: 'Title and appointment date/time are required.' });
      }

      const newAppointment = await prisma.appointment.create({
        data: {
          userId: request.user.id,
          title,
          description,
          appointmentDatetime: new Date(appointmentDatetime),
          location,
        },
      });

      return reply.status(201).send(newAppointment);
    } catch (error) {
      app.log.error('Failed to create appointment:', error);
      return reply.status(500).send({ message: 'Failed to create appointment' });
    }
  });
}