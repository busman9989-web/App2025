// File: carer-connect-monorepo/packages/api/src/index.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
// Removed: Pool and dotenv, as app.ts will handle Prisma/DB connection
// Removed: All individual route imports, as app.ts will auto-load them

// Import the main app plugin (your app.ts)
import app from './app'; // Assuming app.ts exports default app

// Load environment variables (ensure this runs first)
import * as dotenv from 'dotenv';
dotenv.config();

const fastify = Fastify({ logger: true });

// --- PLUGINS (Core Fastify ones) ---
fastify.register(helmet);
fastify.register(rateLimit, { max: 150, timeWindow: '1 minute' });
fastify.register(cors, {
  origin: 'http://localhost:5173', // Your frontend origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Register JWT. app.ts will handle the actual preHandler logic via a plugin.
fastify.register(jwt, { secret: process.env.JWT_SECRET! });

// --- IMPORTANT: Register your main app plugin (app.ts) ---
// This is where Prisma, Encryption, and all your specific routes get loaded.
fastify.register(app, {
  prefix: '/api', // All routes in app.ts will be prefixed with /api
});

// --- SERVER START ---
const start = async () => {
  try {
    await fastify.listen({ port: 4000, host: '0.0.0.0' });
    console.log(`Server listening on http://localhost:4000`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();