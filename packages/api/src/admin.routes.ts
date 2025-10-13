import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from './server';
import { hashPassword } from './utils/encryption';

export async function adminRoutes(app: FastifyInstance) {
  // Apply the 'adminOnly' security decorator to ALL routes defined in this file.
  // This single line protects every endpoint below.
  app.addHook('preHandler', app.adminOnly);

  // --- User Management Routes ---

  // GET /api/admin/users - Fetch all users
  app.get('/users', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        // IMPORTANT: Never send the password hash to the client
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          isVerified: true,
          displayNameEncrypted: true,
          // Add other non-sensitive fields your admin panel might need
        },
      });
      return reply.send(users);
    } catch (error) {
      app.log.error('Admin failed to fetch users:', error);
      return reply.status(500).send({ message: 'Failed to fetch users' });
    }
  });

  // POST /api/admin/users - Create a new user
  app.post('/users', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email, password, role } = request.body as any;
      if (!email || !password || !role) {
        return reply.status(400).send({ message: 'Email, password, and role are required.' });
      }

      const passwordHash = await hashPassword(password);
      
      const newUser = await prisma.user.create({
        data: { email, passwordHash, role },
        select: { id: true, email: true, role: true }, // Return the new user without the hash
      });

      return reply.status(201).send(newUser);
    } catch (error) {
      app.log.error('Admin failed to create user:', error);
      return reply.status(500).send({ message: 'Failed to create user' });
    }
  });

  // PUT /api/admin/users/:id - Update a user
  app.put('/users/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const userId = request.params.id;
      const { email, role, isVerified } = request.body as any; // Add other updatable fields as needed

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { email, role, isVerified },
        select: { id: true, email: true, role: true, isVerified: true },
      });

      return reply.send(updatedUser);
    } catch (error) {
      app.log.error(`Admin failed to update user ${request.params.id}:`, error);
      return reply.status(500).send({ message: 'Failed to update user' });
    }
  });

  // DELETE /api/admin/users/:id - Delete a user
  app.delete('/users/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const userIdToDelete = request.params.id;

      // Safety check: Prevent an admin from deleting their own account
      if (request.user?.id === userIdToDelete) {
        return reply.status(400).send({ message: 'Admins cannot delete their own account.' });
      }

      await prisma.user.delete({
        where: { id: userIdToDelete },
      });

      return reply.status(204).send(); // 204 No Content is standard for a successful deletion
    } catch (error) {
      app.log.error(`Admin failed to delete user ${request.params.id}:`, error);
      return reply.status(500).send({ message: 'Failed to delete user' });
    }
  });
}