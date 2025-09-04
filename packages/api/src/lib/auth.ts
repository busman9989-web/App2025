import { FastifyRequest, FastifyReply } from 'fastify';
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    if (!(request as any).user) throw new Error("User not authenticated");
  } catch (err) {
    reply.code(401).send({ message: 'Authentication required' });
  }
}
