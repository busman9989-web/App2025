import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import fs from 'fs';

// --- Routes ---
import { authRoutes } from './auth.routes';
import { userRoutes } from './user.routes';
import { journalRoutes } from './journal.routes';
import { postRoutes } from './post.routes';
import { checklistRoutes } from './checklist.routes';
import { resourceRoutes } from './resource.routes';
import { commentRoutes } from './comment.routes';
import { adminRoutes } from './admin.routes';
import { plannerRoutes } from './planner.routes';
import { appointmentRoutes } from './appointment.routes';
import { profileRoutes } from './profile.routes';
import { userAvatarRoutes } from './userAvatar.routes';
import { chatRoutes } from './chat.routes';
import { friendsRoutes } from './friends.routes';
import { settingsRoutes } from './settings.routes';

export const prisma = new PrismaClient();
export let io: SocketIOServer | null = null;

// ---------------------
// HTTPS Setup (Force HTTP mode)
// ---------------------
let httpsOptions: { key: Buffer; cert: Buffer } | undefined = undefined;

// Force disable HTTPS for development / Android
const FORCE_HTTP = process.env.FORCE_HTTP === 'true' || true; // 👈 always true for now

if (!FORCE_HTTP) {
  const CERT_PATH = process.env.CERT_PATH || path.join(__dirname, '..', 'certs', 'cert.pem');
  const KEY_PATH = process.env.KEY_PATH || path.join(__dirname, '..', 'certs', 'key.pem');
  try {
    if (fs.existsSync(CERT_PATH) && fs.existsSync(KEY_PATH)) {
      httpsOptions = {
        key: fs.readFileSync(KEY_PATH),
        cert: fs.readFileSync(CERT_PATH),
      };
    }
  } catch (e) {
    // Only log error if you attempted loading
    console.error('❌ Error loading HTTPS certificates:', e);
  }
}

// ---------------------
// Fastify App Setup
// ---------------------
const app = Fastify({
  logger: true,
  bodyLimit: 10485760, // 10MB
  ...(httpsOptions ? { https: httpsOptions } : {}),
});

// Log HTTPS/HTTP mode after Fastify instance is created
if (!httpsOptions) {
  app.log.info('🚧 HTTPS disabled — running Fastify in HTTP mode');
} else {
  app.log.info('✅ HTTPS certificates loaded for Fastify');
}

// ---------------------
// Auth Decorators
// ---------------------
app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ message: 'Unauthorized' });
  }
});

app.decorate('adminOnly', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
    if (request.user?.role !== 'ADMIN') {
      return reply.status(403).send({ message: 'Forbidden: Admin access required.' });
    }
  } catch (err) {
    reply.status(401).send({ message: 'Unauthorized' });
  }
});

// ---------------------
// Server Start
// ---------------------
const start = async () => {
  try {
    // ✅ CORS — supports HTTPS + Android emulator + Capacitor + HTTP fallback
    const allowedOrigins = [
      'https://carerscircle.co.uk',
      'http://carerscircle.co.uk',
      'http://www.carerscircle.co.uk',
      'https://www.carerscircle.co.uk',
      'https://carerscircle.co.uk',           // Capacitor app
      'http://carerscircle.co.uk',            // Capacitor app HTTP fallback
      'capacitor://carerscircle.co.uk',       // Capacitor custom scheme
      'ionic://carerscircle.co.uk',           // Alternative Capacitor scheme
    ];

    await app.register(cors, {
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) {
          cb(null, true);
        } else {
          console.warn(`❌ Blocked by CORS: ${origin}`);
          cb(new Error('Not allowed by CORS'), false);
        }
      },
      credentials: true,
    });

    // ✅ Cookie & Multipart plugins
    await app.register(cookie);
    await app.register(multipart, {
      limits: {
        fieldNameSize: 100,
        fieldSize: 100,
        fields: 10,
        fileSize: 10485760, // 10MB
        files: 1,
        headerPairs: 2000,
      },
    });

    // ✅ Static Files for Avatars
    await app.register(fastifyStatic, {
      root: path.join(process.cwd(), 'public', 'avatars'),
      prefix: '/avatars/', // must match DB paths
    });

    // ✅ JWT Auth
    await app.register(jwt, {
      secret: process.env.JWT_SECRET as string,
      cookie: {
        cookieName: 'token',
        signed: false,
      },
    });

    // ✅ Routes
    app.log.info('📝 Registering routes...');
    await app.register(authRoutes, { prefix: '/api/auth' });
    await app.register(userRoutes, { prefix: '/api/users' });
    await app.register(journalRoutes, { prefix: '/api/journal' });
    await app.register(postRoutes, { prefix: '/api/posts' });
    await app.register(checklistRoutes, { prefix: '/api/checklists' });
    await app.register(resourceRoutes, { prefix: '/api/resources' });
    await app.register(commentRoutes, { prefix: '/api/comments' });
    await app.register(adminRoutes, { prefix: '/api/admin' });
    await app.register(plannerRoutes, { prefix: '/api/planner' });
    await app.register(appointmentRoutes, { prefix: '/api/appointments' });
    await app.register(profileRoutes, { prefix: '/api/profiles' });
    await app.register(chatRoutes, { prefix: '/api/chat' });
    await app.register(friendsRoutes, { prefix: '/api/friends' });
    await app.register(settingsRoutes, { prefix: '/api/settings' });

    // ✅ User Avatar upload handler
    await app.register(userAvatarRoutes);

    // ✅ Health check
    app.get('/health', async () => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }));

    // ✅ Socket.IO setup
    io = new SocketIOServer(app.server, {
      cors: {
        origin: allowedOrigins,
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    io.on('connection', (socket) => {
      app.log.info({ sid: socket.id }, '🔌 Socket connected');
      socket.on('thread:join', ({ threadId }: { threadId: string }) => {
        if (!threadId) return;
        socket.join(`thread:${threadId}`);
        socket.emit('thread:joined', { threadId });
      });
      socket.on('thread:leave', ({ threadId }: { threadId: string }) => {
        if (!threadId) return;
        socket.leave(`thread:${threadId}`);
      });
      socket.on('disconnect', (reason) => {
        app.log.info({ sid: socket.id, reason }, '🔌 Socket disconnected');
      });
    });

    // ✅ Graceful shutdown
    const shutdown = async () => {
      app.log.info('🛑 Shutting down gracefully...');
      try {
        await prisma.$disconnect();
      } catch {}
      try {
        await app.close();
      } catch {}
      try {
        io?.close();
      } catch {}
      process.exit(0);
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    // ✅ Start server
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';
    await app.listen({ port, host });

    const protocol = httpsOptions ? 'https' : 'http';
    app.log.info(`🚀 Server listening on ${protocol}://${host}:${port}`);
    app.log.info(`💬 Chat API available at ${protocol}://${host}:${port}/api/chat`);
    app.log.info('📁 Static files served from /avatars/');
  } catch (err) {
    app.log.error(err);
    try {
      await prisma.$disconnect();
    } catch {}
    try {
      io?.close();
    } catch {}
    process.exit(1);
  }
};

// ---------------------
// TypeScript Augmentation
// ---------------------
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
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    adminOnly: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

start();