// File: carer-connect-monorepo/packages/api/src/app.ts
import { join } from 'path';
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload';
import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { EncryptionPlugin } from './plugins/encryption.ts'; // Explicitly add .ts extension
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes'; // Import your new usersRoutes

export interface AppOptions extends Partial<AutoloadPluginOptions> {
  // Specify your Fastify plugin options here
}

// Pass --options via CLI arguments to enable options in @fastify/autoload
const app: FastifyPluginAsync<AppOptions> = async (fastify, opts): Promise<void> => {
  // Place here your custom code!

  // Register Prisma
  fastify.decorate('prisma', new PrismaClient());
  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
  });

  // Register Encryption Plugin
  fastify.register(EncryptionPlugin);

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: opts,
  });

  // This loads all plugins defined in routes
  // define your application routes here
  fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    options: opts,
    // Add specific route registrations here if AutoLoad doesn't pick them up correctly
    // Or if you want to explicitly order them
  });

  // Explicitly register your routes
  fastify.register(authRoutes, { prefix: '/api/auth' });
  fastify.register(usersRoutes, { prefix: '/api' }); // Register users routes at /api
};

export default app;