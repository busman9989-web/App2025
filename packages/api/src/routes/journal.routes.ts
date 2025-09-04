import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { authenticate } from '../lib/auth';
import { encrypt, decrypt } from '../lib/crypto';

export async function journalRoutes(fastify: FastifyInstance, { db }: { db: Pool }) {
  // Middleware to ensure all journal routes are authenticated
  fastify.addHook('preHandler', authenticate);

  // Get journal entries for a date range
  fastify.get('/api/journal', async (request, reply) => {
    const userId = (request.user as any).id;
    const { startDate, endDate } = request.query as any;

    const { rows } = await db.query(
      'SELECT id, entry_date, mood_rating, entry_text_encrypted FROM journal_entries WHERE user_id = $1 AND entry_date BETWEEN $2 AND $3 ORDER BY entry_date DESC',
      [userId, startDate, endDate]
    );

    // Decrypt entries before sending to the client
    const decryptedRows = rows.map(row => ({
      ...row,
      entry_text: decrypt(row.entry_text_encrypted),
      entry_text_encrypted: undefined, // Don't send encrypted text to client
    }));
    
    reply.send(decryptedRows);
  });

  // Create or Update a journal entry for a specific date
  fastify.post('/api/journal', async (request, reply) => {
    const userId = (request.user as any).id;
    const { entry_date, mood_rating, entry_text } = request.body as any;

    const encrypted_text = encrypt(entry_text);

    // "UPSERT" logic: Insert or update if the entry for that user/date already exists
    const query = `
      INSERT INTO journal_entries (user_id, entry_date, mood_rating, entry_text_encrypted)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, entry_date)
      DO UPDATE SET mood_rating = EXCLUDED.mood_rating, entry_text_encrypted = EXCLUDED.entry_text_encrypted, updated_at = NOW()
      RETURNING id, entry_date, mood_rating;
    `;
    const { rows } = await db.query(query, [userId, entry_date, mood_rating, encrypted_text]);
    reply.code(201).send(rows[0]);
  });
}