// packages/api/src/appointment.routes.ts
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from './server';

// Extend FastifyRequest to include the 'user' property from JWT payload
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}

export async function appointmentRoutes(app: FastifyInstance) {
  // Apply authentication to all routes
  app.addHook('preHandler', app.authenticate);

  // GET /api/appointments - Fetch all appointments for authenticated user
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.user?.id) {
        return reply.status(401).send({ message: 'Unauthorized: User not authenticated.' });
      }

      const appointments = await prisma.appointment.findMany({
        where: {
          userId: request.user.id,
        },
        orderBy: {
          appointmentDatetime: 'asc',
        },
      });

      // Transform the data to match frontend expectations
      const transformedAppointments = appointments.map(appointment => ({
        id: appointment.id,
        title: appointment.title,
        description: appointment.description,
        appointment_datetime: appointment.appointmentDatetime.toISOString(),
        location: appointment.location,
        created_at: appointment.createdAt.toISOString(),
        updated_at: appointment.updatedAt.toISOString(),
      }));

      return reply.send(transformedAppointments);
    } catch (error: any) {
      app.log.error('Error fetching appointments:');
      app.log.error('Error Message:', error.message);
      app.log.error('Error Stack:', error.stack);
      return reply.status(500).send({ message: 'Failed to fetch appointments.' });
    }
  });

  // GET /api/appointments/:id - Fetch a single appointment by ID
  app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      if (!request.user?.id) {
        return reply.status(401).send({ message: 'Unauthorized: User not authenticated.' });
      }

      const { id } = request.params;
      const appointment = await prisma.appointment.findFirst({
        where: {
          id,
          userId: request.user.id, // Ensure user can only access their own appointments
        },
      });

      if (!appointment) {
        return reply.status(404).send({ message: 'Appointment not found.' });
      }

      return reply.send({
        id: appointment.id,
        title: appointment.title,
        description: appointment.description,
        appointment_datetime: appointment.appointmentDatetime.toISOString(),
        location: appointment.location,
        created_at: appointment.createdAt.toISOString(),
        updated_at: appointment.updatedAt.toISOString(),
      });
    } catch (error: any) {
      app.log.error(`Error fetching appointment ${request.params.id}:`);
      app.log.error('Error Message:', error.message);
      app.log.error('Error Stack:', error.stack);
      return reply.status(500).send({ message: 'Failed to fetch appointment.' });
    }
  });

  // POST /api/appointments - Create a new appointment
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.user?.id) {
        return reply.status(401).send({ message: 'Unauthorized: User not authenticated.' });
      }

      const { title, description, appointment_datetime, location } = request.body as {
        title: string;
        description?: string;
        appointment_datetime: string;
        location?: string;
      };

      if (!title || !appointment_datetime) {
        return reply.status(400).send({ message: 'Title and appointment datetime are required.' });
      }

      // Validate datetime format
      const appointmentDate = new Date(appointment_datetime);
      if (isNaN(appointmentDate.getTime())) {
        return reply.status(400).send({ message: 'Invalid appointment datetime format.' });
      }

      const newAppointment = await prisma.appointment.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          appointmentDatetime: appointmentDate,
          location: location?.trim() || null,
          userId: request.user.id,
        },
      });

      return reply.status(201).send({
        id: newAppointment.id,
        title: newAppointment.title,
        description: newAppointment.description,
        appointment_datetime: newAppointment.appointmentDatetime.toISOString(),
        location: newAppointment.location,
        created_at: newAppointment.createdAt.toISOString(),
        updated_at: newAppointment.updatedAt.toISOString(),
      });
    } catch (error: any) {
      app.log.error('Error creating appointment:');
      app.log.error('Error Message:', error.message);
      app.log.error('Error Stack:', error.stack);
      return reply.status(500).send({ message: 'Failed to create appointment.' });
    }
  });

  // PUT /api/appointments/:id - Update an existing appointment
  app.put('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      if (!request.user?.id) {
        return reply.status(401).send({ message: 'Unauthorized: User not authenticated.' });
      }

      const { id } = request.params;
      const { title, description, appointment_datetime, location } = request.body as {
        title?: string;
        description?: string;
        appointment_datetime?: string;
        location?: string;
      };

      // Check if appointment exists and belongs to user
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          id,
          userId: request.user.id,
        },
      });

      if (!existingAppointment) {
        return reply.status(404).send({ message: 'Appointment not found.' });
      }

      const updateData: any = {};
      if (title !== undefined) updateData.title = title.trim();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (location !== undefined) updateData.location = location?.trim() || null;
      
      if (appointment_datetime !== undefined) {
        const appointmentDate = new Date(appointment_datetime);
        if (isNaN(appointmentDate.getTime())) {
          return reply.status(400).send({ message: 'Invalid appointment datetime format.' });
        }
        updateData.appointmentDatetime = appointmentDate;
      }

      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: updateData,
      });

      return reply.send({
        id: updatedAppointment.id,
        title: updatedAppointment.title,
        description: updatedAppointment.description,
        appointment_datetime: updatedAppointment.appointmentDatetime.toISOString(),
        location: updatedAppointment.location,
        created_at: updatedAppointment.createdAt.toISOString(),
        updated_at: updatedAppointment.updatedAt.toISOString(),
      });
    } catch (error: any) {
      app.log.error(`Error updating appointment ${request.params.id}:`);
      app.log.error('Error Message:', error.message);
      app.log.error('Error Stack:', error.stack);
      return reply.status(500).send({ message: 'Failed to update appointment.' });
    }
  });

  // DELETE /api/appointments/:id - Delete an appointment
  app.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      if (!request.user?.id) {
        return reply.status(401).send({ message: 'Unauthorized: User not authenticated.' });
      }

      const { id } = request.params;

      // Check if appointment exists and belongs to user
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          id,
          userId: request.user.id,
        },
      });

      if (!existingAppointment) {
        return reply.status(404).send({ message: 'Appointment not found.' });
      }

      await prisma.appointment.delete({
        where: { id },
      });

      return reply.send({ message: 'Appointment deleted successfully.' });
    } catch (error: any) {
      app.log.error(`Error deleting appointment ${request.params.id}:`);
      app.log.error('Error Message:', error.message);
      app.log.error('Error Stack:', error.stack);
      return reply.status(500).send({ message: 'Failed to delete appointment.' });
    }
  });

  // GET /api/appointments/today - Get today's appointments (convenience endpoint)
  app.get('/today', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.user?.id) {
        return reply.status(401).send({ message: 'Unauthorized: User not authenticated.' });
      }

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const appointments = await prisma.appointment.findMany({
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
      });

      const transformedAppointments = appointments.map(appointment => ({
        id: appointment.id,
        title: appointment.title,
        description: appointment.description,
        appointment_datetime: appointment.appointmentDatetime.toISOString(),
        location: appointment.location,
        created_at: appointment.createdAt.toISOString(),
        updated_at: appointment.updatedAt.toISOString(),
      }));

      return reply.send(transformedAppointments);
    } catch (error: any) {
      app.log.error('Error fetching today\'s appointments:');
      app.log.error('Error Message:', error.message);
      app.log.error('Error Stack:', error.stack);
      return reply.status(500).send({ message: 'Failed to fetch today\'s appointments.' });
    }
  });
}