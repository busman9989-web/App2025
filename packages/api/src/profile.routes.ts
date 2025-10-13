import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from './server';
import { decrypt, encrypt } from './utils/encryption';

function decryptOr(encrypted?: string | null, fallback = ''): string {
  if (!encrypted) return fallback;
  try {
    return decrypt(encrypted);
  } catch {
    return fallback;
  }
}

// No resource author relation, so always return 0 (kept from your original)
async function safeResourceCount(_userId: string): Promise<number> {
  return 0;
}

export async function profileRoutes(app: FastifyInstance) {
  // GET /api/profiles/:userId
  app.get<{ Params: { userId: string } }>('/:userId', async (request, reply) => {
    const { userId } = request.params;

    try {
      // Only select fields that exist in your User model
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          displayNameEncrypted: true,
          statusEncrypted: true,
          bioEncrypted: true, // Optional encrypted bio (safe even if null)
          createdAt: true,
          profilePictureUrl: true,
        },
      });

      if (!user) {
        // Extra log to help debugging "unable to find user data"
        request.log.warn({ userId }, '[profileRoutes] User not found');
        return reply.status(404).send({ message: 'User profile not found.' });
      }

      const displayName = decryptOr(user.displayNameEncrypted, 'User');
      const status = decryptOr(user.statusEncrypted, 'Offline');
      const bio = decryptOr(user.bioEncrypted, '');

      const [postCount, commentCount, resourceCount] = await Promise.all([
        prisma.post.count({ where: { userId } }),
        prisma.comment.count({ where: { userId } }),
        safeResourceCount(userId),
      ]);

      // Friend count (accepted)
      const friendCount = await prisma.friendship.count({
        where: {
          status: 'accepted',
          OR: [{ requesterId: user.id }, { addresseeId: user.id }],
        },
      });

      // Most recent post/comment timestamps for "last_active"
      const [latestPost] = await prisma.post.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true },
      });
      const [latestComment] = await prisma.comment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true },
      });

      const joinedAtISO = user.createdAt?.toISOString?.() ?? null;
      const lastActiveISO = (() => {
        const times = [
          latestPost?.createdAt ? new Date(latestPost.createdAt).getTime() : 0,
          latestComment?.createdAt ? new Date(latestComment.createdAt).getTime() : 0,
          user.createdAt ? new Date(user.createdAt).getTime() : 0,
        ].filter(Boolean);
        if (!times.length) return null;
        return new Date(Math.max(...times)).toISOString();
      })();

      // Recent posts: derive "title" from content
      const recentPosts = await prisma.post.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, content: true, createdAt: true },
      });

      // Recent replies/comments (only use content, since Post has no title)
      const recentReplies = await prisma.comment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          content: true,
          createdAt: true,
          postId: true,
          post: { select: { content: true } },
        },
      });

      return reply.send({
        id: user.id,
        displayName,
        status,
        bio,
        joined_at: joinedAtISO,
        last_active: lastActiveISO,
        profilePictureUrl: user.profilePictureUrl,
        friend_count: friendCount,
        stats: {
          posts: postCount,
          comments: commentCount,
          resources: resourceCount,
        },
        recent_posts: recentPosts.map((p) => ({
          id: p.id,
          title: p.content ? p.content.slice(0, 60) + (p.content.length > 60 ? '…' : '') : 'Untitled',
          content: p.content,
          created_at: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
        })),
        recent_replies: recentReplies.map((r) => {
          const parentTitle =
            r.post?.content ? r.post.content.slice(0, 60) + (r.post.content.length > 60 ? '…' : '') : undefined;
          return {
            id: r.id,
            content: r.content,
            created_at: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
            parent_post_id: r.postId,
            parent_post_title: parentTitle,
          };
        }),
      });
    } catch (err) {
      request.log.error({ err, userId }, '[profileRoutes] Failed to fetch profile');
      return reply.status(500).send({ message: 'Failed to load profile.' });
    }
  });

  // PUT /api/profiles/:userId - Update About Me (encrypted)
  app.put<{
    Params: { userId: string };
    Body: { bio: string };
  }>(
    '/:userId',
    { preHandler: app.authenticate },
    async (
      request: FastifyRequest<{ Params: { userId: string }; Body: { bio: string } }>,
      reply: FastifyReply
    ) => {
      const { userId } = request.params;
      const { bio } = request.body || { bio: '' };

      if (!request.user?.id || request.user.id !== userId) {
        return reply.status(403).send({ message: 'You can only update your own profile.' });
      }

      try {
        const updated = await prisma.user.update({
          where: { id: userId },
          data: { bioEncrypted: bio ? encrypt(bio) : null },
          select: { id: true, bioEncrypted: true },
        });

        return reply.send({
          id: updated.id,
          bio: decryptOr(updated.bioEncrypted, ''),
        });
      } catch (err) {
        request.log.error({ err, userId }, '[profileRoutes] Failed to update bio');
        return reply.status(500).send({ message: 'Failed to update profile bio.' });
      }
    }
  );
}