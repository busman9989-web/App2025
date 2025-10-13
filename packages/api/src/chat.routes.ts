import { FastifyInstance } from 'fastify';
import { prisma, io } from './server';
import { decrypt } from './utils/encryption';

// Safely derive a display name in this order:
// 1) decrypt(displayNameEncrypted)
// 2) email local part
// 3) "Unknown User"
function safeDisplayName(u: {
  displayNameEncrypted?: string | null;
  email?: string | null;
}) {
  if (u.displayNameEncrypted) {
    try {
      const d = decrypt(u.displayNameEncrypted);
      if (d && d.trim()) return d.trim();
    } catch {
      // ignore bad decrypt and fall through
    }
  }
  if (u.email) {
    const local = u.email.split('@')[0];
    if (local) return local;
  }
  return 'Unknown User';
}

export async function chatRoutes(app: FastifyInstance) {
  // Quick probe for debugging
  app.get('/ping', async () => ({ ok: true, scope: 'chat', now: new Date().toISOString() }));

  // GET /api/chat/threads
  app.get('/threads', { preValidation: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const threads = await prisma.chatThread.findMany({
        where: { participants: { some: { userId } } },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  displayNameEncrypted: true,
                  profilePictureUrl: true,
                  email: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  displayNameEncrypted: true,
                  profilePictureUrl: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      const result = threads.map((thread) => ({
        id: thread.id,
        name: thread.name,
        participants: thread.participants.map((p) => ({
          id: p.user.id,
          displayName: safeDisplayName(p.user),
          avatarUrl: p.user.profilePictureUrl,
          email: p.user.email,
        })),
        lastMessage: thread.messages[0]
          ? {
              id: thread.messages[0].id,
              threadId: thread.messages[0].threadId,
              user: {
                id: thread.messages[0].sender.id,
                displayName: safeDisplayName(thread.messages[0].sender),
                avatarUrl: thread.messages[0].sender.profilePictureUrl,
              },
              text: thread.messages[0].text,
              timestamp: thread.messages[0].createdAt,
            }
          : null,
      }));

      return reply.send(result);
    } catch (err) {
      app.log.error({ err }, 'Failed to fetch chat threads');
      return reply.status(500).send({ message: 'Failed to fetch chat threads' });
    }
  });

  // GET /api/chat/messages/:threadId
  app.get('/messages/:threadId', { preValidation: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { threadId } = request.params as { threadId: string };

      const participant = await prisma.chatThreadParticipant.findFirst({
        where: { threadId, userId },
      });
      if (!participant) return reply.status(403).send({ error: 'Access denied' });

      const messages = await prisma.chatMessage.findMany({
        where: { threadId },
        orderBy: { createdAt: 'asc' },
        take: 50,
        include: {
          sender: {
            select: {
              id: true,
              displayNameEncrypted: true,
              profilePictureUrl: true,
              email: true,
            },
          },
        },
      });

      const result = messages.map((msg) => ({
        id: msg.id,
        threadId: msg.threadId,
        user: {
          id: msg.sender.id,
          displayName: safeDisplayName(msg.sender),
          avatarUrl: msg.sender.profilePictureUrl,
        },
        text: msg.text,
        timestamp: msg.createdAt,
      }));

      return reply.send(result);
    } catch (err) {
      app.log.error({ err }, 'Failed to fetch messages');
      return reply.status(500).send({ message: 'Failed to fetch messages' });
    }
  });

  // POST /api/chat/messages/:threadId
  app.post('/messages/:threadId', { preValidation: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { threadId } = request.params as { threadId: string };
      const { text } = request.body as { text: string };

      if (!text || text.trim().length === 0) {
        return reply.status(400).send({ error: 'Message text cannot be empty' });
      }

      const participant = await prisma.chatThreadParticipant.findFirst({
        where: { threadId, userId },
      });
      if (!participant) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      const message = await prisma.chatMessage.create({
        data: { threadId, senderId: userId, text: text.trim() },
        include: {
          sender: {
            select: {
              id: true,
              displayNameEncrypted: true,
              profilePictureUrl: true,
              email: true,
            },
          },
        },
      });

      await prisma.chatThread.update({
        where: { id: threadId },
        data: { updatedAt: new Date() },
      });

      const payload = {
        id: message.id,
        threadId: message.threadId,
        user: {
          id: message.sender.id,
          displayName: safeDisplayName(message.sender),
          avatarUrl: message.sender.profilePictureUrl,
        },
        text: message.text,
        timestamp: message.createdAt,
      };

      io?.to(`thread:${threadId}`).emit('chat:message', payload);

      return reply.status(201).send(payload);
    } catch (err) {
      app.log.error({ err }, 'Failed to send message');
      return reply.status(500).send({ message: 'Failed to send message' });
    }
  });

  // POST /api/chat/threads
  app.post('/threads', { preValidation: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { recipientId } = request.body as { recipientId: string };

      if (!recipientId || recipientId === userId) {
        return reply.status(400).send({ error: 'Invalid recipient' });
      }

      const existingThread = await prisma.chatThread.findFirst({
        where: {
          AND: [{ participants: { some: { userId } } }, { participants: { some: { userId: recipientId } } }],
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  displayNameEncrypted: true,
                  profilePictureUrl: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (existingThread) {
        return reply.send({
          id: existingThread.id,
          name: existingThread.name,
          participants: existingThread.participants.map((p) => ({
            id: p.user.id,
            displayName: safeDisplayName(p.user),
            avatarUrl: p.user.profilePictureUrl,
            email: p.user.email,
          })),
        });
      }

      const newThread = await prisma.chatThread.create({
        data: {
          participants: {
            create: [{ userId }, { userId: recipientId }],
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  displayNameEncrypted: true,
                  profilePictureUrl: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      const response = {
        id: newThread.id,
        name: newThread.name,
        participants: newThread.participants.map((p) => ({
          id: p.user.id,
          displayName: safeDisplayName(p.user),
          avatarUrl: p.user.profilePictureUrl,
          email: p.user.email,
        })),
      };

      io?.to(`user:${userId}`).emit('chat:thread:created', response);
      io?.to(`user:${recipientId}`).emit('chat:thread:created', response);

      return reply.status(201).send(response);
    } catch (err) {
      app.log.error({ err }, 'Failed to create thread');
      return reply.status(500).send({ message: 'Failed to create thread' });
    }
  });
}