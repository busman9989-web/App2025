// File: carer-connect-monorepo/packages/api/src/routes/users.routes.ts
import { FastifyInstance } from 'fastify';
import { decrypt, encrypt } from '../lib/crypto'; // Keep crypto for encryption/decryption
import bcrypt from 'bcryptjs';

// Extend FastifyInstance to ensure fastify.prisma is recognized by TypeScript
// This type extension might ideally live in a global d.ts file or the prisma plugin itself,
// but for now, we'll ensure it's here if not globally defined.
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient; // Add PrismaClient to FastifyInstance type
    verifyJwt: (request: FastifyRequest, reply: FastifyReply) => Promise<void>; // Add verifyJwt from auth plugin
  }
  interface FastifyRequest {
    user: { id: string; email: string; role: string }; // Ensure user is on request
  }
}

// Assuming your PrismaClient is imported (it is, in app.ts, but let's ensure typings are consistent)
import { PrismaClient } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify/types/request';


export default async function usersRoutes(fastify: FastifyInstance) { // Removed { db: Pool } as parameter

  // GET user profile (protected)
  // Adjusted path to match frontend (e.g., /api/users/me -> /me here with /api prefix from app.ts)
  fastify.get('/users/me', { preHandler: [fastify.verifyJwt] }, async (request, reply) => {
    // The authenticated user's ID comes from the JWT, not route params for 'me'
    const userId = request.user.id;

    try {
      const userProfile = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: { // Select specific fields for security
          id: true,
          email: true,
          role: true,
          displayNameEncrypted: true,
          statusEncrypted: true,
          createdAt: true,
        },
      });

      if (!userProfile) {
        return reply.code(404).send({ message: 'User not found.' });
      }

      // Decrypt sensitive information before sending
      // Ensure your Prisma schema uses camelCase for model fields if it's best practice,
      // but matching current DB columns here for displayNameEncrypted, statusEncrypted
      (userProfile as any).displayName = decrypt(userProfile.displayNameEncrypted);
      (userProfile as any).status = decrypt(userProfile.statusEncrypted);
      delete userProfile.displayNameEncrypted; // Remove encrypted fields
      delete userProfile.statusEncrypted;

      reply.send(userProfile);
    } catch (error) {
      fastify.log.error('Error fetching user profile:', error); // Use fastify.log
      reply.code(500).send({ message: 'Failed to fetch user profile.' });
    }
  });


  // UPDATE user profile (protected)
  fastify.put('/users/profile', { preHandler: [fastify.verifyJwt] }, async (request, reply) => {
    const userId = request.user.id; // ID of the authenticated user
    const { displayName, status, currentPassword, newPassword } = request.body as any;

    try {
      // Fetch current user details including password hash
      const currentUser = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true }, // Only fetch passwordHash for comparison
      });

      if (!currentUser) {
        return reply.code(404).send({ message: 'User not found.' });
      }

      const updateData: {
        displayNameEncrypted?: string;
        statusEncrypted?: string;
        passwordHash?: string;
      } = {};

      if (displayName !== undefined) {
        updateData.displayNameEncrypted = encrypt(displayName);
      }

      if (status !== undefined) {
        updateData.statusEncrypted = encrypt(status);
      }

      if (newPassword) {
        if (!currentPassword) {
          return reply.code(400).send({ message: 'Current password is required to change password.' });
        }
        const isPasswordValid = await bcrypt.compare(currentPassword, currentUser.passwordHash);
        if (!isPasswordValid) {
          return reply.code(401).send({ message: 'Incorrect current password.' });
        }
        updateData.passwordHash = await bcrypt.hash(newPassword, 10);
      }

      if (Object.keys(updateData).length === 0) {
        return reply.code(400).send({ message: 'No valid fields provided for update.' });
      }

      const updatedUser = await fastify.prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: { // Select specific fields to return
          id: true,
          email: true,
          role: true,
          displayNameEncrypted: true,
          statusEncrypted: true,
        },
      });

      // Decrypt and clean up before sending response
      (updatedUser as any).displayName = decrypt(updatedUser.displayNameEncrypted);
      (updatedUser as any).status = decrypt(updatedUser.statusEncrypted);
      delete updatedUser.displayNameEncrypted;
      delete updatedUser.statusEncrypted;

      reply.code(200).send({ message: 'Profile updated successfully.', user: updatedUser });

    } catch (error) {
      fastify.log.error('Error updating user profile:', error); // Use fastify.log
      reply.code(500).send({ message: 'Failed to update user profile.' });
    }
  });


  // DELETE user account (protected)
  fastify.delete('/users/account', { preHandler: [fastify.verifyJwt] }, async (request, reply) => {
    const userId = request.user.id; // ID of the authenticated user

    try {
      // In a real application, you might want to soft-delete or archive the user
      const deletedUser = await fastify.prisma.user.delete({
        where: { id: userId },
      });

      if (!deletedUser) { // Prisma delete returns the deleted record, or throws if not found
        return reply.code(404).send({ message: 'User not found or already deleted.' }); // Should not happen with successful delete
      }

      reply.code(200).send({ message: 'Account deleted successfully.' });
    } catch (error: any) { // Catch Prisma errors for not found specifically
      if (error.code === 'P2025') { // Prisma error code for record not found
        return reply.code(404).send({ message: 'User not found.' });
      }
      fastify.log.error('Error deleting user account:', error); // Use fastify.log
      reply.code(500).send({ message: 'Failed to delete user account.' });
    }
  });
}