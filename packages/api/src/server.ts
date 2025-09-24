// packages/api/src/server.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from './auth.routes';
// import { meRoutes } from './me.routes'; // <<< REMOVE THIS LINE
import { userRoutes } from './user.routes';
import { journalRoutes } from './journal.routes';
import { postRoutes } from './post.routes';
import { checklistRoutes } from './checklist.routes';
import { resourceRoutes } from './resource.routes';

export const prisma = new PrismaClient();
const app = Fastify({ logger: true });

// Extend Fastify with authenticate decorator
app.decorate("authenticate", async function (request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

const start = async () => {
  await app.register(cors, { origin: 'http://localhost:5173', credentials: true });
  await app.register(jwt, { secret: process.env.JWT_SECRET as string });

  // Register all route plugins
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(userRoutes, { prefix: '/api/users' });
  // await app.register(meRoutes, { prefix: '/api/users' }); // <<< REMOVE THIS LINE
  await app.register(journalRoutes, { prefix: '/api/journal' });
  await app.register(postRoutes, { prefix: '/api/posts' });
  await app.register(checklistRoutes, { prefix: '/api/checklists' });
  await app.register(resourceRoutes, { prefix: '/api/resources' });

  app.get('/health', async () => ({ status: 'ok' }));

  try {
    const port = parseInt(process.env.PORT || '3000', 10);
    await app.listen({ port, host: '0.0.0.0' });
    console.log('🚀 Server listening on port ' + port);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

// --- FastifyRequest type extension ---
declare module 'fastify' {
  interface FastifyRequest {
    jwtVerify: () => Promise<void>;
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>;
  }
}
// --- End of FastifyRequest type extension ---

start();