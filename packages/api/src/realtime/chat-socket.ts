import { Server } from 'socket.io';
import { FastifyInstance } from 'fastify';
import { prisma } from '../server';

export let io: Server | null = null;

export function initChatSocket(app: FastifyInstance) {
  io = new Server(app.server, {
    cors: {
      origin: process.env.WEB_ORIGIN || 'https://carerscircle.co.uk',
      credentials: true,
    },
  });

  // Optional: authenticate socket users (if you pass a token via handshake.auth.token)
  io.use(async (socket, next) => {
    try {
      // If you pass a JWT in handshake.auth.token, verify it here using app.jwt
      // const token = socket.handshake.auth?.token as string | undefined;
      // if (token) {
      //   const payload = await app.jwt.verify(token);
      //   (socket as any).userId = payload.id;
      // }
      next();
    } catch (err) {
      next(err as any);
    }
  });

  io.on('connection', (socket) => {
    // Client requests to join a thread "room"
    socket.on('thread:join', async ({ threadId }: { threadId: string }) => {
      // If you set userId above, you can validate membership here; otherwise, rely on server-side emit checks
      // const userId = (socket as any).userId as string | undefined;
      // if (userId) {
      //   const member = await prisma.chatThreadParticipant.findFirst({ where: { userId, threadId } });
      //   if (!member) return;
      // }
      socket.join(`thread:${threadId}`);
      socket.emit('thread:joined', { threadId });
    });

    socket.on('thread:leave', ({ threadId }: { threadId: string }) => {
      socket.leave(`thread:${threadId}`);
    });
  });

  app.log.info('✅ Socket.IO chat initialized');
  return io;
}