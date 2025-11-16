import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from './server';
import { decrypt } from './utils/encryption';

export async function commentRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  const decryptOrAnonymous = (encrypted?: string | null) => {
    if (!encrypted) return 'Anonymous';
    try {
      return decrypt(encrypted);
    } catch (err) {
      app.log.warn('Failed to decrypt display name', err);
      return 'Anonymous';
    }
  };

  // POST /api/comments/:id/reply - Reply to an existing comment
  app.post('/:id/reply', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }
    const { content } = request.body as { content: string };
    const parentId = request.params.id;

    if (!content || !content.trim()) {
      return reply.status(400).send({ message: 'Content is required.' });
    }

    try {
      // First, find the original comment to link its post
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { postId: true }
      });

      if (!parentComment) {
        return reply.status(404).send({ message: 'Parent comment not found.' });
      }

      // Create the reply
      const newReply = await prisma.comment.create({
        data: {
          content: content.trim(),
          parentId,
          postId: parentComment.postId,
          userId: request.user.id,
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          parentId: true,
          postId: true,
          userId: true,
          user: {
            select: {
              displayNameEncrypted: true,
              profilePictureUrl: true,  // ✅ Add this
            }
          }
        }
      });

      const createdIso = newReply.createdAt instanceof Date ? newReply.createdAt.toISOString() : String(newReply.createdAt);

      return reply.status(201).send({
        id: newReply.id,
        content: newReply.content,
        createdAt: createdIso,
        parentId: newReply.parentId,
        postId: newReply.postId,
        userId: newReply.userId,
        authorId: newReply.userId,
        authorName: newReply.user?.displayNameEncrypted ? decryptOrAnonymous(newReply.user.displayNameEncrypted) : 'Anonymous',
        profilePictureUrl: newReply.user?.profilePictureUrl ?? null,  // ✅ Add this
        voteCount: 0,
        userVote: 0,
        replies: [],
      });
    } catch (error) {
      app.log.error('Error creating reply:', error);
      return reply.status(500).send({ message: 'Failed to create reply.' });
    }
  });

  // POST /api/comments/:id/vote - Vote on a comment (supports 0 to remove vote)
  app.post('/:id/vote', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }
    const { voteType } = request.body as { voteType: number };
    const commentId = request.params.id;

    if (![ -1, 0, 1 ].includes(voteType)) {
      return reply.status(400).send({ message: 'Invalid vote type. Must be -1, 0, or 1.' });
    }

    try {
      if (voteType === 0) {
        await prisma.vote.deleteMany({
          where: {
            userId: request.user.id,
            commentId,
          },
        });
      } else {
        await prisma.vote.upsert({
          where: {
            UserCommentVote: {
              userId: request.user.id,
              commentId,
            },
          },
          update: { voteType },
          create: {
            userId: request.user.id,
            commentId,
            voteType,
          },
        });
      }

      // Fetch updated vote counts
      const votes = await prisma.vote.findMany({
        where: { commentId },
        select: { voteType: true, userId: true }
      });

      const voteCount = votes.reduce((s, v) => s + (v.voteType || 0), 0);
      const userVote = votes.find(v => v.userId === request.user.id)?.voteType ?? 0;

      return reply.send({ 
        message: 'Vote recorded.',
        voteCount,
        userVote
      });
    } catch (error) {
      app.log.error('Error voting on comment:', error);
      return reply.status(500).send({ message: 'Failed to record vote.' });
    }
  });
}