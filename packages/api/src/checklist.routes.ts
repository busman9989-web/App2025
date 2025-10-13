// packages/api/src/checklist.routes.ts
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

export async function checklistRoutes(app: FastifyInstance) {
  // Apply authentication to all routes
  app.addHook('preHandler', app.authenticate);

  // GET /api/checklists - Fetch all checklists for authenticated user
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.user?.id) {
        return reply.status(401).send({ message: 'Unauthorized: User not authenticated.' });
      }

      const checklists = await prisma.checklist.findMany({
        where: {
          userId: request.user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Transform the data to match frontend expectations
      const transformedChecklists = checklists.map(checklist => ({
        id: checklist.id,
        name: checklist.name,
        items: Array.isArray(checklist.items) ? checklist.items : [],
        isTemplate: checklist.isTemplate,
        created_at: checklist.createdAt.toISOString(),
        updated_at: checklist.updatedAt.toISOString(),
      }));

      return reply.send(transformedChecklists);
    } catch (error: any) {
      app.log.error('Error fetching checklists:');
      app.log.error('Error Message:', error.message);
      app.log.error('Error Stack:', error.stack);
      return reply.status(500).send({ message: 'Failed to fetch checklists.' });
    }
  });

  // GET /api/checklists/:id - Fetch a single checklist by ID
  app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      if (!request.user?.id) {
        return reply.status(401).send({ message: 'Unauthorized: User not authenticated.' });
      }

      const { id } = request.params;
      const checklist = await prisma.checklist.findFirst({
        where: {
          id,
          userId: request.user.id, // Ensure user can only access their own checklists
        },
      });

      if (!checklist) {
        return reply.status(404).send({ message: 'Checklist not found.' });
      }

      return reply.send({
        id: checklist.id,
        name: checklist.name,
        items: Array.isArray(checklist.items) ? checklist.items : [],
        isTemplate: checklist.isTemplate,
        created_at: checklist.createdAt.toISOString(),
        updated_at: checklist.updatedAt.toISOString(),
      });
    } catch (error: any) {
      app.log.error(`Error fetching checklist ${request.params.id}:`);
      app.log.error('Error Message:', error.message);
      app.log.error('Error Stack:', error.stack);
      return reply.status(500).send({ message: 'Failed to fetch checklist.' });
    }
  });

  // POST /api/checklists - Create a new checklist
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.user?.id) {
        return reply.status(401).send({ message: 'Unauthorized: User not authenticated.' });
      }

      const { name, items = [], isTemplate = false } = request.body as {
        name: string;
        items?: Array<{ text: string; completed: boolean }>;
        isTemplate?: boolean;
      };

      if (!name || name.trim().length === 0) {
        return reply.status(400).send({ message: 'Checklist name is required.' });
      }

      // Validate items structure
      if (!Array.isArray(items)) {
        return reply.status(400).send({ message: 'Items must be an array.' });
      }

      for (const item of items) {
        if (!item.text || typeof item.text !== 'string') {
          return reply.status(400).send({ message: 'Each item must have a text property.' });
        }
        if (typeof item.completed !== 'boolean') {
          return reply.status(400).send({ message: 'Each item must have a completed boolean property.' });
        }
      }

      const newChecklist = await prisma.checklist.create({
        data: {
          name: name.trim(),
          items: items,
          isTemplate,
          userId: request.user.id,
        },
      });

      return reply.status(201).send({
        id: newChecklist.id,
        name: newChecklist.name,
        items: Array.isArray(newChecklist.items) ? newChecklist.items : [],
        isTemplate: newChecklist.isTemplate,
        created_at: newChecklist.createdAt.toISOString(),
        updated_at: newChecklist.updatedAt.toISOString(),
      });
    } catch (error: any) {
      app.log.error('Error creating checklist:');
      app.log.error('Error Message:', error.message);
      app.log.error('Error Stack:', error.stack);
      return reply.status(500).send({ message: 'Failed to create checklist.' });
    }
  });

  // PUT /api/checklists/:id - Update an existing checklist
  app.put('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      if (!request.user?.id) {
        return reply.status(401).send({ message: 'Unauthorized: User not authenticated.' });
      }

      const { id } = request.params;
      const { name, items, isTemplate } = request.body as {
        name?: string;
        items?: Array<{ text: string; completed: boolean }>;
        isTemplate?: boolean;
      };

      // Check if checklist exists and belongs to user
      const existingChecklist = await prisma.checklist.findFirst({
        where: {
          id,
          userId: request.user.id,
        },
      });

      if (!existingChecklist) {
        return reply.status(404).send({ message: 'Checklist not found.' });
      }

      // Validate items if provided
      if (items && !Array.isArray(items)) {
        return reply.status(400).send({ message: 'Items must be an array.' });
      }

      if (items) {
        for (const item of items) {
          if (!item.text || typeof item.text !== 'string') {
            return reply.status(400).send({ message: 'Each item must have a text property.' });
          }
          if (typeof item.completed !== 'boolean') {
            return reply.status(400).send({ message: 'Each item must have a completed boolean property.' });
          }
        }
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name.trim();
      if (items !== undefined) updateData.items = items;
      if (isTemplate !== undefined) updateData.isTemplate = isTemplate;

      const updatedChecklist = await prisma.checklist.update({
        where: { id },
        data: updateData,
      });

      return reply.send({
        id: updatedChecklist.id,
        name: updatedChecklist.name,
        items: Array.isArray(updatedChecklist.items) ? updatedChecklist.items : [],
        isTemplate: updatedChecklist.isTemplate,
        created_at: updatedChecklist.createdAt.toISOString(),
        updated_at: updatedChecklist.updatedAt.toISOString(),
      });
    } catch (error: any) {
      app.log.error(`Error updating checklist ${request.params.id}:`);
      app.log.error('Error Message:', error.message);
      app.log.error('Error Stack:', error.stack);
      return reply.status(500).send({ message: 'Failed to update checklist.' });
    }
  });

  // DELETE /api/checklists/:id - Delete a checklist
  app.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      if (!request.user?.id) {
        return reply.status(401).send({ message: 'Unauthorized: User not authenticated.' });
      }

      const { id } = request.params;

      // Check if checklist exists and belongs to user
      const existingChecklist = await prisma.checklist.findFirst({
        where: {
          id,
          userId: request.user.id,
        },
      });

      if (!existingChecklist) {
        return reply.status(404).send({ message: 'Checklist not found.' });
      }

      await prisma.checklist.delete({
        where: { id },
      });

      return reply.send({ message: 'Checklist deleted successfully.' });
    } catch (error: any) {
      app.log.error(`Error deleting checklist ${request.params.id}:`);
      app.log.error('Error Message:', error.message);
      app.log.error('Error Stack:', error.stack);
      return reply.status(500).send({ message: 'Failed to delete checklist.' });
    }
  });
}