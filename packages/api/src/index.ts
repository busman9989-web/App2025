import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Import all route handlers
import { authRoutes } from './routes/auth.routes';
import { postRoutes } from './routes/posts.routes';
import { journalRoutes } from './routes/journal.routes';
import { resourceRoutes } from './routes/resources.routes';
import { checklistRoutes } from './routes/checklists.routes';
import { reportRoutes } from './routes/reports.routes';
import { userRoutes } from './routes/users.routes';
import { plannerRoutes } from './routes/planner.routes';
import { twoFactorAuthRoutes } from './routes/two_fa.routes';

dotenv.config();

const fastify = Fastify({ logger: true });
const db = new Pool({ connectionString: process.env.DATABASE_URL });

// --- PLUGINS ---
fastify.register(helmet);
fastify.register(rateLimit, { max: 150, timeWindow: '1 minute' });
fastify.register(cors);
fastify.register(jwt, { secret: process.env.JWT_SECRET! });

fastify.decorate("user", null);
fastify.addHook("onRequest", async (request, reply) => {
  try {
    if (request.headers.authorization) {
      const decoded = await request.jwtVerify();
      (request as any).user = decoded;
    }
  } catch (err) {
    // Allows requests without a token to pass.
  }
});

// Register all application routes
fastify.register(authRoutes, { db });
fastify.register(postRoutes, { db });
fastify.register(journalRoutes, { db });
fastify.register(resourceRoutes, { db });
fastify.register(checklistRoutes, { db });
fastify.register(reportRoutes, { db });
fastify.register(userRoutes, { db });
fastify.register(plannerRoutes, { db });
fastify.register(twoFactorAuthRoutes, { db });

// --- SERVER START ---
const start = async () => {
  try {
    await fastify.listen({ port: 4000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();