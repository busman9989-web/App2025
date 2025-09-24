// packages/api/src/post.routes.ts
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from './server';
import { decrypt, encrypt } from './utils/encryption';

// Extend FastifyRequest to include the 'user' property from our JWT payload
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}

export async function postRoutes(app: FastifyInstance) {
  // Apply the authentication hook to all routes in this file
  app.addHook('preHandler', app.authenticate);

  // GET /api/posts - Fetch all posts for the community feed
  // Change '/posts' to '/'
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const posts = await prisma.post.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          content: true,
          category: true,
          isAnonymous: true,
          createdAt: true,
          userId: true,
          user: {
            select: {
              displayNameEncrypted: true,
            },
          },
          _count: {
            select: {
              comments: true,
              postVotes: true,
            },
          },
        },
      });

      const postsWithDetails = posts.map(post => ({
        id: post.id,
        content: post.content,
        category: post.category,
        isAnonymous: post.isAnonymous,
        createdAt: post.createdAt,
        userId: post.userId,
        authorName: post.isAnonymous ? 'Anonymous' : (post.user.displayNameEncrypted ? decrypt(post.user.displayNameEncrypted) : 'Unnamed User'),
        commentCount: post._count.comments,
        voteCount: post._count.postVotes, // Simple vote count for now
      }));

      return reply.send(postsWithDetails);
    } catch (error) {
      app.log.error('Error fetching posts:', error);
      return reply.status(500).send({ message: 'Failed to fetch posts.' });
    }
  });

  // POST /api/posts - Create a new post
  // Change '/posts' to '/'
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ message: 'Unauthorized: User not authenticated.' });
    }
    const { content, category, isAnonymous } = request.body as { content: string; category: string; isAnonymous?: boolean };

    if (!content || !category) {
      return reply.status(400).send({ message: 'Content and category are required.' });
    }

    try {
      const newPost = await prisma.post.create({
        data: {
          content,
          category,
          isAnonymous: isAnonymous || false,
          userId: request.user.id,
        },
      });
      return reply.status(201).send(newPost);
    } catch (error) {
      app.log.error('Error creating post:', error);
      return reply.status(500).send({ message: 'Failed to create post.' });
    }
  });

  // GET /api/posts/:id - Fetch a single post with comments
  // Change '/posts/:id' to '/:id'
  app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const post = await prisma.post.findUnique({
        where: { id: request.params.id },
        include: {
          comments: {
            orderBy: { createdAt: 'asc' },
            include: {
              user: {
                select: {
                  displayNameEncrypted: true,
                },
              },
            },
          },
          user: {
            select: {
              displayNameEncrypted: true,
            },
          },
        },
      });

      if (!post) {
        return reply.status(404).send({ message: 'Post not found.' });
      }

      // Decrypt display names for the post author and commenters
      const authorName = post.isAnonymous ? 'Anonymous' : (post.user.displayNameEncrypted ? decrypt(post.user.displayNameEncrypted) : 'Unnamed User');
      const commentsWithAuthor = post.comments.map(comment => ({
        ...comment,
        authorName: comment.user.displayNameEncrypted ? decrypt(comment.user.displayNameEncrypted) : 'Unnamed User',
      }));

      return reply.send({ ...post, authorName, comments: commentsWithAuthor });
    } catch (error) {
      app.log.error(`Error fetching post ${request.params.id}:`, error);
      return reply.status(500).send({ message: 'Failed to fetch post.' });
    }
  });

  // POST /api/posts/:id/comments - Add a comment to a post
  // Change '/posts/:id/comments' to '/:id/comments'
  app.post('/:id/comments', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ message: 'Unauthorized: User not authenticated.' });
    }
    const { content } = request.body as { content: string };
    if (!content) {
      return reply.status(400).send({ message: 'Comment content is required.' });
    }

    try {
      const newComment = await prisma.comment.create({
        data: {
          content,
          postId: request.params.id,
          userId: request.user.id,
        },
      });
      return reply.status(201).send(newComment);
    } catch (error) {
      app.log.error('Error adding comment:', error);
      return reply.status(500).send({ message: 'Failed to add comment.' });
    }
  });

  // POST /api/posts/:id/vote - Vote on a post
  // Change '/posts/:id/vote' to '/:id/vote'
  app.post('/:id/vote', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ message: 'Unauthorized: User not authenticated.' });
    }
    const { voteType } = request.body as { voteType: number }; // 1 for upvote, -1 for downvote
    if (![1, -1].includes(voteType)) {
      return reply.status(400).send({ message: 'Invalid vote type. Must be 1 or -1.' });
    }

    try {
      await prisma.postVote.upsert({
        where: {
          userId_postId: {
            userId: request.user.id,
            postId: request.params.id,
          },
        },
        update: { voteType },
        create: {
          userId: request.user.id,
          postId: request.params.id,
          voteType,
        },
      });
      return reply.send({ message: 'Vote recorded.' });
    } catch (error) {
      app.log.error('Error voting on post:', error);
      return reply.status(500).send({ message: 'Failed to record vote.' });
    }
  });
}