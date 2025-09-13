// File: carer-connect-monorepo/packages/api/src/routes/users.routes.ts
import { FastifyInstance } from 'fastify';
import { verifyJwt } from '../plugins/auth'; // Assuming you have a verifyJwt plugin

export default async function usersRoutes(fastify: FastifyInstance) {

  // Route for fetching the current user's profile
  fastify.get('/users/me', { preHandler: [verifyJwt] }, async (request, reply) => {
    // request.user should be populated by the verifyJwt preHandler
    // with the user ID from the JWT payload.

    if (!request.user || !request.user.id) {
      return reply.status(401).send({ message: 'Unauthorized: User ID not found in token.' });
    }

    try {
      // Fetch user from database using the ID from the token
      const user = await fastify.prisma.user.findUnique({
        where: { id: request.user.id },
        select: {
          id: true,
          email: true,
          role: true,
          status: true, // Include status, it will be encrypted
          firstName: true,
          lastName: true,
          // Add any other profile fields you want to expose
        },
      });

      if (!user) {
        return reply.status(404).send({ message: 'User not found.' });
      }

      // Decrypt the status field before sending it to the client
      const decryptedStatus = user.status ? fastify.encryption.decrypt(user.status) : null;

      return reply.send({
        id: user.id,
        email: user.email,
        role: user.role,
        status: decryptedStatus, // Send decrypted status
        firstName: user.firstName,
        lastName: user.lastName,
      });
    } catch (error) {
      fastify.log.error(`Error fetching user profile: ${error}`);
      return reply.status(500).send({ message: 'Internal server error.' });
    }
  });

  // TODO: Add a PUT/PATCH route for updating user profile (e.g., /users/me or /users/:id)
  // This would need to encrypt the status field before saving.
}