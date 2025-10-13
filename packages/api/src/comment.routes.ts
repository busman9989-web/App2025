import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from './server';

export async function commentRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // POST /api/comments/:id/reply - Reply to an existing comment (optional; posts version also supports parentId)
  app.post('/:id/reply', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }
    const { content } = request.body as { content: string };
    const parentId = request.params.id;

    if (!content) {
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

      // Replies do not have a title.
      const newReply = await prisma.comment.create({
        data: {
          content,
          parentId,
          postId: parentComment.postId,
          userId: request.user.id,
          title: undefined,
        },
      });
      return reply.status(201).send(newReply);
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
      return reply.send({ message: 'Vote recorded.' });
    } catch (error) {
      app.log.error('Error voting on comment:', error);
      return reply.status(500).send({ message: 'Failed to record vote.' });
    }
  });
}