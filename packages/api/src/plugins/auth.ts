// File: carer-connect-monorepo/packages/api/src/plugins/auth.ts
import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

// Extend FastifyRequest to include a 'user' property after JWT verification
// This allows TypeScript to know about request.user
declare module 'fastify' {
  interface FastifyRequest {
    user: { id: string; email: string; role: string }; // Adjust based on your JWT payload
  }
}

const authPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Decorate Fastify with a verifyJwt function that can be used as a preHandler
  fastify.decorate('verifyJwt', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // This will attempt to verify the JWT using @fastify/jwt and populate request.user if valid
      await request.jwtVerify();
    } catch (err: any) {
      fastify.log.warn(`JWT Verification Failed: ${err.message}`);
      reply.code(401).send({ message: 'Unauthorized: Invalid or missing token.' });
    }
  });
};

// Export as a Fastify plugin.
// 'auth-plugin' is its name.
// dependencies: ['@fastify/jwt'] ensures that the @fastify/jwt plugin is registered BEFORE this auth plugin.
export default fp(authPlugin, {
  name: 'auth-plugin',
  dependencies: ['@fastify/jwt']
});