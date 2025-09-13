import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { authenticate } from '../lib/auth';
import { decrypt } from '../lib/crypto';

export async function postRoutes(fastify: FastifyInstance, { db }: { db: Pool }) {

  // Helper function to fetch posts with full details (comments count, score, decrypted user names)
  const getPostsWithDetails = async (category?: string, limit: number = 20, postId?: string) => {
    let query = `
      SELECT
        p.id, p.content, p.category, p.is_anonymous, p.created_at, p.user_id,
        u.display_name_encrypted,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
        COALESCE(SUM(pv.vote_type), 0)::int AS score
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN post_votes pv ON p.id = pv.post_id
    `;
    const queryParams: any[] = [];
    let whereClauses: string[] = [];

    if (postId) {
      whereClauses.push(`p.id = $${queryParams.length + 1}`);
      queryParams.push(postId);
    }

    if (category && category.toLowerCase() !== 'all') {
      whereClauses.push(`p.category = $${queryParams.length + 1}`);
      queryParams.push(category);
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ` + whereClauses.join(' AND ');
    }

    query += ` GROUP BY p.id, u.id ORDER BY p.created_at DESC`;

    if (!postId) { // Only apply limit if fetching multiple posts, not a single one by ID
      queryParams.push(limit);
      query += ` LIMIT $${queryParams.length};`;
    } else {
        query += ';'; // Terminate query if no limit
    }


    const { rows } = await db.query(query, queryParams);
    return rows.map(post => ({
      ...post,
      display_name: post.is_anonymous || !post.display_name_encrypted ? 'Anonymous' : decrypt(post.display_name_encrypted),
    }));
  };


  // GET all posts (with optional category filter)
  fastify.get('/api/posts', async (request, reply) => {
    const { limit = 20, category } = request.query as any;
    const posts = await getPostsWithDetails(category, parseInt(limit as string, 10));
    reply.send(posts);
  });

  // GET a single post by ID, including its comments
  fastify.get('/api/posts/:id', async (request, reply) => {
    const { id } = request.params as any; // Post ID is a UUID

    // Fetch the post details
    const posts = await getPostsWithDetails(undefined, 1, id);
    if (posts.length === 0) {
      return reply.code(404).send({ message: 'Post not found.' });
    }
    const post = posts[0];

    // Fetch comments for this post
    const { rows: commentRows } = await db.query(
      `
      SELECT
          c.id, c.post_id, c.content, c.created_at, u.display_name_encrypted, u.id as user_id
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
      `,
      [id]
    );

    const commentsWithDecryptedNames = commentRows.map(comment => ({
      ...comment,
      display_name: comment.display_name_encrypted ? decrypt(comment.display_name_encrypted) : 'Anonymous',
    }));

    reply.send({ ...post, comments: commentsWithDecryptedNames });
  });


  // POST - Create a new post (protected)
  fastify.post('/api/posts', { preHandler: [authenticate] }, async (request, reply) => {
    const { content, category, is_anonymous = false } = request.body as any;
    const userId = (request as any).user.id; // User ID from authentication via authenticate hook

    if (!content || !category) {
      return reply.code(400).send({ message: 'Content and category are required.' });
    }

    try {
      const { rows } = await db.query(
        'INSERT INTO posts (user_id, content, category, is_anonymous) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, content, category, is_anonymous]
      );
      reply.code(201).send(rows[0]);
    } catch (error) {
      console.error('Error creating post:', error);
      reply.code(500).send({ message: 'Failed to create post.' });
    }
  });


  // POST - Add a comment to a post (protected)
  fastify.post('/api/posts/:id/comments', { preHandler: [authenticate] }, async (request, reply) => {
    const { id: postId } = request.params as any; // post_id is a UUID
    const userId = (request as any).user.id; // User ID from authentication
    const { content } = request.body as any;

    if (!content || content.trim() === '') {
      return reply.code(400).send({ message: 'Comment content cannot be empty.' });
    }

    try {
      const { rows } = await db.query(
        'INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
        [postId, userId, content]
      );
      // Fetch user display name for the new comment before sending response
      const userRes = await db.query('SELECT display_name_encrypted FROM users WHERE id = $1', [userId]);
      const newComment = {
          ...rows[0],
          display_name: userRes.rows[0]?.display_name_encrypted ? decrypt(userRes.rows[0].display_name_encrypted) : 'Anonymous',
      };
      reply.code(201).send(newComment);
    } catch (error) {
      console.error('Error creating comment:', error);
      reply.code(500).send({ message: 'Failed to create comment.' });
    }
  });


  // POST vote on a post
  fastify.post('/api/posts/:id/vote', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any; // post_id is a UUID
    const { type } = request.body as any; // type: 1 for upvote, -1 for downvote, 0 to remove/toggle

    if (![1, -1, 0].includes(type)) {
      return reply.code(400).send({ message: 'Invalid vote type. Use 1 for upvote, -1 for downvote, or 0 to remove.' });
    }

    const userId = (request as any).user.id;

    try {
      const existingVote = await db.query('SELECT * FROM post_votes WHERE post_id = $1 AND user_id = $2', [id, userId]);

      if (existingVote.rows.length > 0) {
        // User has an existing vote
        if (type === 0 || existingVote.rows[0].vote_type === type) {
          // If type is 0 (remove) OR user is trying to vote the same way again (toggle)
          await db.query('DELETE FROM post_votes WHERE post_id = $1 AND user_id = $2', [id, userId]);
          reply.code(200).send({ message: 'Vote removed successfully.' });
        } else {
          // User is changing their vote (e.g., from upvote to downvote)
          await db.query('UPDATE post_votes SET vote_type = $1 WHERE post_id = $2 AND user_id = $3', [type, id, userId]);
          reply.code(200).send({ message: 'Vote updated successfully.' });
        }
      } else {
        // No existing vote, so insert a new one
        if (type !== 0) { // Only insert if type is 1 or -1
          await db.query('INSERT INTO post_votes (post_id, user_id, vote_type) VALUES ($1, $2, $3)', [id, userId, type]);
          reply.code(200).send({ message: 'Vote recorded successfully.' });
        } else {
          reply.code(400).send({ message: 'Cannot remove a vote that does not exist.' });
        }
      }
    } catch (error) {
      console.error('Error handling vote:', error);
      reply.code(500).send({ message: 'Failed to handle vote.' });
    }
  });
}