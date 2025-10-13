import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from './server';
import { decrypt } from './utils/encryption';

type SlimUser = { id: string; displayNameEncrypted: string | null; profilePictureUrl: string | null };

function toFriendDTO(user: SlimUser) {
  return {
    id: user.id,
    displayName: user.displayNameEncrypted ? decrypt(user.displayNameEncrypted) : 'User',
    profilePictureUrl: user.profilePictureUrl,
  };
}

export async function friendsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // List accepted friends. Supports ?userId= to view another user's friends.
  app.get(
    '/list',
    async (request: FastifyRequest<{ Querystring: { userId?: string } }>, reply: FastifyReply) => {
      const currentUserId = request.user?.id;
      if (!currentUserId) return reply.status(401).send({ message: 'Unauthorized' });

      const targetUserId = request.query?.userId || currentUserId;

      const friendships = await prisma.friendship.findMany({
        where: {
          status: 'accepted',
          OR: [{ requesterId: targetUserId }, { addresseeId: targetUserId }],
        },
        include: {
          requester: { select: { id: true, displayNameEncrypted: true, profilePictureUrl: true } },
          addressee: { select: { id: true, displayNameEncrypted: true, profilePictureUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const result = friendships.map((f) => {
        const friend =
          f.requesterId === targetUserId
            ? f.addressee
            : f.addresseeId === targetUserId
            ? f.requester
            : f.addressee;
        return toFriendDTO(friend);
      });

      return reply.send(result);
    }
  );

  // Outgoing pending requests (sent by current user) with requestedAt.
  app.get('/pending-sent', async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) return reply.status(401).send({ message: 'Unauthorized' });

    const requests = await prisma.friendship.findMany({
      where: { requesterId: userId, status: 'pending' },
      include: { addressee: { select: { id: true, displayNameEncrypted: true, profilePictureUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send(
      requests.map((f) => ({
        ...toFriendDTO(f.addressee),
        requestedAt: f.createdAt instanceof Date ? f.createdAt.toISOString() : String(f.createdAt),
      }))
    );
  });

  // Incoming pending requests (received by current user) with requestedAt.
  app.get('/pending', async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) return reply.status(401).send({ message: 'Unauthorized' });

    const requests = await prisma.friendship.findMany({
      where: { addresseeId: userId, status: 'pending' },
      include: { requester: { select: { id: true, displayNameEncrypted: true, profilePictureUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send(
      requests.map((f) => ({
        ...toFriendDTO(f.requester),
        requestedAt: f.createdAt instanceof Date ? f.createdAt.toISOString() : String(f.createdAt),
      }))
    );
  });

  // Send a friend request (or accept if the inverse pending request exists)
  app.post('/request/:targetUserId', async (request, reply) => {
    const userId = request.user?.id;
    const targetUserId = (request.params as any).targetUserId as string;
    if (!userId) return reply.status(401).send({ message: 'Unauthorized' });
    if (!targetUserId || userId === targetUserId) {
      return reply.status(400).send({ message: 'Invalid user id' });
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: userId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'pending' && existing.addresseeId === userId) {
        await prisma.friendship.update({ where: { id: existing.id }, data: { status: 'accepted' } });
        return reply.send({ accepted: true });
      }
      if (existing.status === 'accepted') {
        return reply.status(409).send({ message: 'Already friends' });
      }
      return reply.status(409).send({ message: 'Request already exists' });
    }

    await prisma.friendship.create({
      data: { requesterId: userId, addresseeId: targetUserId, status: 'pending' },
    });
    return reply.send({ sent: true });
  });

  // Accept an incoming friend request (from targetUserId -> me)
  app.post('/accept/:targetUserId', async (request, reply) => {
    const userId = request.user?.id;
    const targetUserId = (request.params as any).targetUserId as string;
    if (!userId) return reply.status(401).send({ message: 'Unauthorized' });
    if (!targetUserId || userId === targetUserId) {
      return reply.status(400).send({ message: 'Invalid user id' });
    }

    const pending = await prisma.friendship.findFirst({
      where: { requesterId: targetUserId, addresseeId: userId, status: 'pending' },
    });

    if (!pending) {
      return reply.status(404).send({ message: 'No pending request from this user' });
    }

    await prisma.friendship.update({
      where: { id: pending.id },
      data: { status: 'accepted' },
    });

    return reply.send({ accepted: true });
  });

  // Decline (or cancel) a pending request (remove relation)
  app.post('/decline/:targetUserId', async (request, reply) => {
    const userId = request.user?.id;
    const targetUserId = (request.params as any).targetUserId as string;
    if (!userId) return reply.status(401).send({ message: 'Unauthorized' });
    if (!targetUserId || userId === targetUserId) {
      return reply.status(400).send({ message: 'Invalid user id' });
    }

    const res = await prisma.friendship.deleteMany({
      where: {
        status: 'pending',
        OR: [
          { requesterId: targetUserId, addresseeId: userId }, // incoming -> decline
          { requesterId: userId, addresseeId: targetUserId }, // outgoing -> cancel
        ],
      },
    });

    if (res.count === 0) {
      return reply.status(404).send({ message: 'No pending request to decline/cancel' });
    }

    return reply.send({ declined: true });
  });

  // Remove friendship
  app.delete('/remove/:targetUserId', async (request, reply) => {
    const userId = request.user?.id;
    const targetUserId = (request.params as any).targetUserId as string;
    if (!userId) return reply.status(401).send({ message: 'Unauthorized' });
    if (!targetUserId || userId === targetUserId) {
      return reply.status(400).send({ message: 'Invalid user id' });
    }

    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { requesterId: userId, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: userId },
        ],
      },
    });

    return reply.send({ removed: true });
  });
}