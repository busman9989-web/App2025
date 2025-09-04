import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { authenticate } from '../lib/auth';
import { decrypt } from '../lib/crypto';

export async function postRoutes(fastify: FastifyInstance, { db }: { db: Pool }) {
  // GET all posts, now with vote counts and decrypted author names
  fastify.get('/api/posts', async (request, reply) => {
    const { limit = 20 } = request.query as any;
    const query = `
      SELECT
        p.id, p.content, p.category, p.is_anonymous, p.created_at, u.display_name_encrypted,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
        COALESCE(SUM(pv.vote_type), 0)::int AS score
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN post_votes pv ON p.id = pv.post_id
      GROUP BY p.id, u.id
      ORDER BY p.created_at DESC LIMIT $1;
    `;
    const { rows } = await db.query(query, [limit]);

    // Decrypt display names before sending
    const postsWithDecryptedNames = rows.map(post => ({
      ...post,
      display_name: decrypt(post.display_name_encrypted)
    }));

    reply.send(postsWithDecryptedNames);
  });

  // GET a single post with its comments
  fastify.get('/api/posts/:id', async (request, reply) => {
    const { id } = request.params as any;
    const postQuery = `
        SELECT p.id, p.content, p.category, p.is_anonymous, p.created_at, u.display_name_encrypted,
        (SELECT json_agg(c_agg ORDER BY c_agg.created_at ASC) FROM (SELECT c.id, c.content, c.created_at, cu.display_name_encrypted FROM comments c LEFT JOIN users cu ON c.user_id = cu.id WHERE c.post_id = p.id) as c_agg) as comments
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.id = $1;
    `;
    const { rows } = await db.query(postQuery, [id]);
    if (rows.length === 0) return reply.code(404).send({ message: 'Post not found.' });

    const post = rows[0];
    post.display_name = decrypt(post.display_name_encrypted);
    if (post.comments) {
      post.comments.forEach((c: any) => c.display_name = decrypt(c.display_name_encrypted));
    }
    reply.send(post);
  });

  // POST - Create a new post (protected)
  fastify.post('/api/posts', { preHandler: [authenticate] }, async (request, reply) => {
      const { content, category, isAnonymous = false } = request.body as any;
      const userId = (request.user as any).id;
      if (!content || !category) return reply.code(400).send({ message: 'Content and category are required.' });
      const { rows } = await db.query(
        'INSERT INTO posts (user_id, content, category, is_anonymous) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, content, category, isAnonymous]
      );
      reply.code(201).send(rows[0]);
  });

  // POST - Add a comment to a post
  fastify.post('/api/posts/:id/comments', { preHandler: [authenticate] }, async (request, reply) => {
    const { id: postId } = request.params as any;
    const userId = (request.user as any).id;
    const { content } = request.body as any;
    if (!content) return reply.code(400).send({ message: 'Comment content cannot be empty.' });
    const { rows } = await db.query('INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING *', [postId, userId, content]);
    reply.code(201).send(rows[0]);
  });

  // POST - Vote on a post
  fastify.post('/api/posts/:id/vote', { preHandler: [authenticate] }, async (request, reply) => {
    const { id: postId } = request.params as any;
    const userId = (request.user as any).id;
    const { vote_type } = request.body as any;
    if (![1, -1, 0].includes(vote_type)) return reply.code(400).send({ message: 'Invalid vote type.' });
    const query = `INSERT INTO post_votes (user_id, post_id, vote_type) VALUES ($1, $2, $3) ON CONFLICT (user_id, post_id) DO UPDATE SET vote_type = EXCLUDED.vote_type;`;
    await db.query(query, [userId, postId, vote_type]);
    const scoreResult = await db.query('SELECT SUM(vote_type) as score FROM post_votes WHERE post_id = $1', [postId]);
    reply.send({ newScore: parseInt(scoreResult.rows[0].score) || 0 });
  });
}