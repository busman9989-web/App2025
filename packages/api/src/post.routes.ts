import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from './server';
import { decrypt } from './utils/encryption';

interface FormattedComment {
  id: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  userId: string | null;          // For profile linking (newer)
  authorId?: string | null;       // Back-compat for frontend expecting authorId
  authorName: string;
  voteCount: number;
  userVote: number;
  title?: string | null;
  replies: FormattedComment[];
}

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

  // Build a nested comment tree from a flat list of comments.
  const buildCommentTree = (flatComments: any[], currentUserId?: string): FormattedComment[] => {
    const map = new Map<string, FormattedComment>();
    const roots: FormattedComment[] = [];

    for (const c of flatComments) {
      const votes = Array.isArray(c.votes) ? c.votes : [];
      const voteCount = votes.reduce((s: number, v: any) => s + (v.voteType || 0), 0);
      const userVote = votes.find((v: any) => v.userId === currentUserId)?.voteType ?? 0;

      map.set(c.id, {
        id: c.id,
        content: c.content,
        createdAt: (c.createdAt instanceof Date) ? c.createdAt.toISOString() : String(c.createdAt),
        parentId: c.parentId ?? null,
        userId: c.userId ?? null, // newer
        authorId: c.userId ?? null, // back-compat for profile links
        authorName: c.user?.displayNameEncrypted ? decryptOrAnonymous(c.user.displayNameEncrypted) : 'Anonymous',
        voteCount,
        userVote,
        replies: [],
        title: c.title ?? null,
      });
    }

    for (const c of flatComments) {
      const node = map.get(c.id)!;
      if (c.parentId) {
        const parentNode = map.get(c.parentId);
        if (parentNode) {
          parentNode.replies.push(node);
        } else {
          roots.push(node);
          app.log.warn(`Parent comment ${c.parentId} not found for comment ${c.id}`);
        }
      } else {
        roots.push(node);
      }
    }

    return roots;
  };

  // GET /api/posts - Fetch all posts
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const currentUserId = request.user?.id;

      const posts = await prisma.post.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          content: true,
          category: true,
          isAnonymous: true,
          createdAt: true,
          userId: true,
          title: true,
          user: { select: { displayNameEncrypted: true } },
          _count: { select: { comments: true, postVotes: true } },
          postVotes: { select: { userId: true, voteType: true } },
        },
      });

      const postsWithDetails = posts.map(post => {
        const votes = post.postVotes || [];
        const totalVoteCount = votes.reduce((sum, v) => sum + (v.voteType || 0), 0);
        const userVote = votes.find(v => v.userId === currentUserId)?.voteType ?? 0;

        const authorName = post.isAnonymous
          ? 'Anonymous'
          : (post.user?.displayNameEncrypted ? decryptOrAnonymous(post.user.displayNameEncrypted) : 'Anonymous');

        const createdIso = post.createdAt instanceof Date ? post.createdAt.toISOString() : String(post.createdAt);

        return {
          id: post.id,
          content: post.content,
          category: post.category,
          title: post.title,
          isAnonymous: post.isAnonymous,
          createdAt: createdIso,       // newer
          created_at: createdIso,      // back-compat
          userId: post.isAnonymous ? null : post.userId, // newer (nullable if anonymous)
          authorId: post.userId,       // back-compat: what the old frontend expects for profile link
          authorName,
          display_name: authorName,    // back-compat
          commentCount: post._count?.comments ?? 0,
          voteCount: totalVoteCount,
          score: totalVoteCount,       // back-compat
          userVote,
        };
      });

      return reply.send(postsWithDetails);
    } catch (error: any) {
      app.log.error('Error fetching posts:', error);
      return reply.status(500).send({ message: 'Failed to fetch posts.', error: error?.message });
    }
  });

  // POST /api/posts - Create a new post
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const { content, category, isAnonymous, title } = request.body as {
      content: string;
      category: string;
      isAnonymous?: boolean;
      title?: string;
    };

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
          title: title?.trim() || null,
        },
        select: {
          id: true,
          content: true,
          category: true,
          isAnonymous: true,
          createdAt: true,
          userId: true,
          title: true,
          user: { select: { displayNameEncrypted: true } },
        },
      });

      const authorName = newPost.isAnonymous
        ? 'Anonymous'
        : (newPost.user?.displayNameEncrypted ? decryptOrAnonymous(newPost.user.displayNameEncrypted) : 'Anonymous');

      const createdIso = newPost.createdAt instanceof Date ? newPost.createdAt.toISOString() : String(newPost.createdAt);

      return reply.status(201).send({
        id: newPost.id,
        content: newPost.content,
        category: newPost.category,
        title: newPost.title,
        isAnonymous: newPost.isAnonymous,
        createdAt: createdIso,         // newer
        created_at: createdIso,        // back-compat
        userId: newPost.isAnonymous ? null : newPost.userId, // newer (nullable if anonymous)
        authorId: newPost.userId,      // back-compat
        authorName,
        display_name: authorName,      // back-compat
        commentCount: 0,
        voteCount: 0,
        score: 0,                      // back-compat
        userVote: 0,
      });
    } catch (error: any) {
      app.log.error('Error creating post:', error);
      return reply.status(500).send({ message: 'Failed to create post.', error: error?.message });
    }
  });

  // GET /api/posts/:id - Fetch single post with nested comments
  app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const currentUserId = request.user?.id;
      const postId = request.params.id;

      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: {
          id: true,
          content: true,
          category: true,
          isAnonymous: true,
          createdAt: true,
          userId: true,
          title: true,
          user: { select: { displayNameEncrypted: true } },
          postVotes: { select: { userId: true, voteType: true } },
        },
      });

      if (!post) {
        return reply.status(404).send({ message: 'Post not found.' });
      }

      // Fetch all comments for this post in a single flat query (ordered by createdAt)
      const flatComments = await prisma.comment.findMany({
        where: { postId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          content: true,
          createdAt: true,
          parentId: true,
          title: true,
          userId: true,
          user: { select: { displayNameEncrypted: true } },
          votes: { select: { userId: true, voteType: true } },
        },
      });

      const commentsTree = buildCommentTree(flatComments, currentUserId);

      const votes = post.postVotes || [];
      const totalVoteCount = votes.reduce((sum, v) => sum + (v.voteType || 0), 0);
      const userVote = votes.find(v => v.userId === currentUserId)?.voteType ?? 0;

      const authorName = post.isAnonymous
        ? 'Anonymous'
        : (post.user?.displayNameEncrypted ? decryptOrAnonymous(post.user.displayNameEncrypted) : 'Anonymous');

      const createdIso = post.createdAt instanceof Date ? post.createdAt.toISOString() : String(post.createdAt);

      return reply.send({
        id: post.id,
        content: post.content,
        category: post.category,
        title: post.title,
        isAnonymous: post.isAnonymous,
        createdAt: createdIso,         // newer
        created_at: createdIso,        // back-compat
        userId: post.isAnonymous ? null : post.userId, // newer
        authorId: post.userId,         // back-compat for profile link
        authorName,
        display_name: authorName,      // back-compat
        voteCount: totalVoteCount,
        userVote,
        comments: commentsTree,
      });
    } catch (error: any) {
      app.log.error(`Error fetching post ${request.params.id}:`, error);
      return reply.status(500).send({
        message: 'Failed to fetch post.',
        error: error?.message,
        details: error?.code || 'Unknown error'
      });
    }
  });

  // POST /api/posts/:id/comments - Add a comment
  app.post('/:id/comments', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const { content, parentId, title } = request.body as { content: string; parentId?: string; title?: string };

    if (!content) {
      return reply.status(400).send({ message: 'Comment content is required.' });
    }

    if (!parentId && (!title || !title.trim())) {
      return reply.status(400).send({ message: 'Title is required for new threads.' });
    }

    try {
      const newComment = await prisma.comment.create({
        data: {
          content,
          postId: request.params.id,
          userId: request.user.id,
          parentId: parentId || null,
          title: parentId ? null : title?.trim(),
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          parentId: true,
          postId: true,
          userId: true,
          title: true,
          user: { select: { displayNameEncrypted: true } },
        },
      });

      const createdIso = newComment.createdAt instanceof Date ? newComment.createdAt.toISOString() : String(newComment.createdAt);

      return reply.status(201).send({
        id: newComment.id,
        content: newComment.content,
        createdAt: createdIso,
        parentId: newComment.parentId,
        postId: newComment.postId,
        userId: newComment.userId,     // newer
        authorId: newComment.userId,   // back-compat for profile link
        title: newComment.title,
        authorName: newComment.user?.displayNameEncrypted ? decryptOrAnonymous(newComment.user.displayNameEncrypted) : 'Anonymous',
        voteCount: 0,
        userVote: 0,
        replies: [],
      });
    } catch (error: any) {
      app.log.error('Error adding comment:', error);
      return reply.status(500).send({ message: 'Failed to add comment.', error: error?.message });
    }
  });

  // POST /api/posts/:id/vote - Vote on a post
  app.post('/:id/vote', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const postId = request.params.id;
    const { voteType } = request.body as { voteType: number };

    if (![-1, 0, 1].includes(voteType)) {
      return reply.status(400).send({ message: 'Invalid vote type. Must be -1, 0, or 1.' });
    }

    try {
      const userId = request.user.id;

      if (voteType === 0) {
        await prisma.postVote.deleteMany({ where: { userId, postId } });
      } else {
        await prisma.postVote.upsert({
          where: {
            userId_postId: { userId, postId }
          },
          update: { voteType },
          create: { voteType, userId, postId },
        });
      }

      // Fetch updated vote counts for this post
      const votes = await prisma.postVote.findMany({
        where: { postId },
        select: { voteType: true, userId: true }
      });

      const voteCount = votes.reduce((s, v) => s + (v.voteType || 0), 0);
      const userVote = votes.find(v => v.userId === userId)?.voteType ?? 0;

      return reply.send({ message: 'Vote recorded.', voteCount, userVote });
    } catch (error: any) {
      app.log.error('Error voting on post:', error);
      return reply.status(500).send({ message: 'Failed to record vote.', error: error?.message });
    }
  });
}