// packages/api/src/user.routes.ts
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from './server';
import { decrypt, encrypt } from './utils/encryption'; // <-- Ensure encrypt is imported too

// NOTE: The declare module 'fastify' block has been removed from here.
// It should only be in server.ts once.

export async function userRoutes(app: FastifyInstance) { // Changed from meRoutes to userRoutes
  // Apply authentication hook to all routes in this plugin
  app.addHook('preHandler', app.authenticate); // This applies auth to ALL routes in THIS file

  // GET /api/users/me - Get authenticated user's profile
  app.get('/me', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ message: 'Unauthorized: User not authenticated.' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: request.user.id },
        select: {
          id: true,
          email: true,
          displayNameEncrypted: true,
          statusEncrypted: true,
          role: true,
          isVerified: true,
          createdAt: true,
          twoFaEnabled: true,
        },
      });

      if (!user) {
        return reply.status(404).send({ message: 'User not found.' });
      }

      const decryptedDisplayName = user.displayNameEncrypted ? decrypt(user.displayNameEncrypted) : null;
      const decryptedStatus = user.statusEncrypted ? decrypt(user.statusEncrypted) : null;

      return reply.send({
        id: user.id,
        email: user.email,
        displayName: decryptedDisplayName,
        status: decryptedStatus,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        twoFaEnabled: user.twoFaEnabled,
      });
    } catch (error) {
      app.log.error('Error fetching user profile:', error);
      return reply.status(500).send({ message: 'Failed to fetch user profile.' });
    }
  });

  // PUT /api/users/me - Update authenticated user's profile
  app.put('/me', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ message: 'Unauthorized.' });
    }
    const userId = request.user.id;
    const { displayName, status, twoFaEnabled } = request.body as {
      displayName?: string;
      status?: string;
      twoFaEnabled?: boolean;
    };

    try {
      const updateData: any = {};
      if (displayName !== undefined) {
        updateData.displayNameEncrypted = displayName ? encrypt(displayName) : null;
      }
      if (status !== undefined) {
        updateData.statusEncrypted = status ? encrypt(status) : null;
      }
      if (twoFaEnabled !== undefined) {
        updateData.twoFaEnabled = twoFaEnabled;
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          displayNameEncrypted: true,
          statusEncrypted: true,
          role: true,
          isVerified: true,
          createdAt: true,
          twoFaEnabled: true,
        },
      });

      const decryptedDisplayName = updatedUser.displayNameEncrypted ? decrypt(updatedUser.displayNameEncrypted) : null;
      const decryptedStatus = updatedUser.statusEncrypted ? decrypt(updatedUser.statusEncrypted) : null;

      return reply.send({
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: decryptedDisplayName,
        status: decryptedStatus,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified,
        createdAt: updatedUser.createdAt,
        twoFaEnabled: updatedUser.twoFaEnabled,
      });
    } catch (error) {
      app.log.error('Error updating user profile:', error);
      return reply.status(500).send({ message: 'Failed to update user profile.' });
    }
  });
}