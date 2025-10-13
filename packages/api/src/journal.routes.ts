import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from './server';
import { encrypt, decrypt } from './utils/encryption';

// Extend FastifyRequest with 'user' property for JWT payload
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}

// --- Mood Tracker Data Schema ---
interface MoodSaveBody {
  entry_date: string; // YYYY-MM-DD
  mood_rating: number; // 0-4
}
interface JournalCreateBody extends MoodSaveBody {
  entry_text: string;
}

// --- Helpers ---

// Normalize a YYYY-MM-DD string into a consistent UTC midnight Date.
// This avoids timezone drift and ensures findUnique hits the exact stored instant.
function normalizeDateUtc(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

// Null-safe decrypt for legacy/null rows
function safeDecrypt(cipherOrNull: string | null | undefined): string {
  try {
    if (!cipherOrNull) return '';
    return decrypt(cipherOrNull);
  } catch {
    return '';
  }
}

// --- CORE UPSERT FUNCTION ---
async function upsertJournalEntry(
  userId: string,
  entry_date: string,
  mood_rating?: number,
  entry_text?: string
) {
  const entryDate = normalizeDateUtc(entry_date);

  // 1. Try to find an existing entry for the date
  const existingEntry = await prisma.journalEntry.findUnique({
    where: {
      userId_entryDate: {
        userId: userId,
        entryDate: entryDate,
      },
    },
  });

  // 🩹 FIX: Always encrypt a non-empty string
  const textToEncrypt =
    entry_text !== undefined
      ? entry_text
      : existingEntry?.entryTextEncrypted
      ? safeDecrypt(existingEntry.entryTextEncrypted)
      : '';

  const safeText = textToEncrypt?.trim() !== '' ? textToEncrypt : ' ';
  const encryptedText = encrypt(safeText);

  const updateData: any = {
    entryTextEncrypted: encryptedText,
  };
  if (typeof mood_rating !== 'undefined') {
    updateData.moodRating = mood_rating;
  }

  if (existingEntry) {
    // Update existing
    const updatedEntry = await prisma.journalEntry.update({
      where: { id: existingEntry.id },
      data: updateData,
      select: {
        id: true,
        entryDate: true,
        moodRating: true,
        entryTextEncrypted: true,
      },
    });
    return updatedEntry;
  } else {
    // Create new
    const newEntry = await prisma.journalEntry.create({
      data: {
        entryDate: entryDate,
        moodRating: typeof mood_rating !== 'undefined' ? mood_rating : 0,
        entryTextEncrypted: encryptedText,
        userId: userId,
      },
      select: {
        id: true,
        entryDate: true,
        moodRating: true,
        entryTextEncrypted: true,
      },
    });
    return newEntry;
  }
}

export async function journalRoutes(app: FastifyInstance) {
  // Apply authentication to all journal routes
  app.addHook('preHandler', app.authenticate);

  // =========================================================
  // GET /api/journal/date/:dateStr (MOOD TRACKER LOAD)
  // =========================================================
  app.get(
    '/date/:dateStr',
    async (request: FastifyRequest<{ Params: { dateStr: string } }>, reply: FastifyReply) => {
      if (!request.user?.id) {
        return reply.status(401).send({ message: 'Unauthorized: User not authenticated.' });
      }

      const userId = request.user.id;
      const { dateStr } = request.params;

      try {
        const entryDate = normalizeDateUtc(dateStr);
        if (isNaN(entryDate.getTime())) {
          return reply.status(400).send({ message: 'Invalid date format; expected YYYY-MM-DD.' });
        }

        const entry = await prisma.journalEntry.findUnique({
          where: {
            userId_entryDate: {
              userId: userId,
              entryDate: entryDate,
            },
          },
          select: {
            id: true,
            entryDate: true,
            moodRating: true,
            entryTextEncrypted: true,
          },
        });

        if (!entry) {
          return reply.status(404).send({ message: 'No journal entry found for this date.' });
        }

        const formattedEntry = {
          id: entry.id,
          entry_date: entry.entryDate.toISOString().split('T')[0],
          mood_rating: entry.moodRating ?? 0,
          entry_text: safeDecrypt(entry.entryTextEncrypted),
        };

        return reply.send(formattedEntry);
      } catch (error) {
        app.log.error({ err: error }, 'Error fetching journal entry by date');
        return reply.status(500).send({ message: 'Failed to fetch journal entry.' });
      }
    }
  );

  // =========================================================
  // POST /api/journal/mood (MOOD TRACKER SAVE/UPSERT)
  // =========================================================
  app.post(
    '/mood',
    async (request: FastifyRequest<{ Body: MoodSaveBody }>, reply: FastifyReply) => {
      if (!request.user?.id) {
        return reply.status(401).send({ message: 'Unauthorized: User not authenticated.' });
      }

      const userId = request.user.id;
      const { entry_date, mood_rating } = request.body;

      if (
        !entry_date ||
        typeof mood_rating === 'undefined' ||
        mood_rating < 0 ||
        mood_rating > 4
      ) {
        return reply
          .status(400)
          .send({ message: 'Entry date and a valid mood rating (0-4) are required.' });
      }

      try {
        const entry = await upsertJournalEntry(userId, entry_date, mood_rating);

        const formattedEntry = {
          id: entry.id,
          entry_date: entry.entryDate.toISOString().split('T')[0],
          mood_rating: entry.moodRating ?? 0,
          entry_text: safeDecrypt(entry.entryTextEncrypted),
        };

        return reply.status(200).send(formattedEntry);
      } catch (error) {
        app.log.error({ err: error }, 'Error upserting mood rating');
        return reply.status(500).send({ message: 'Failed to save mood rating.' });
      }
    }
  );

  // =========================================================
  // GET /api/journal - Fetch journal entries (range)
  // =========================================================
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ message: 'Unauthorized: User not authenticated.' });
    }

    const userId = request.user.id;
    const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };

    try {
      const where: any = { userId };
      if (startDate) {
        const d = normalizeDateUtc(startDate);
        if (isNaN(d.getTime())) {
          return reply.status(400).send({ message: 'Invalid startDate; expected YYYY-MM-DD.' });
        }
        where.entryDate = { ...where.entryDate, gte: d };
      }
      if (endDate) {
        const d = normalizeDateUtc(endDate);
        if (isNaN(d.getTime())) {
          return reply.status(400).send({ message: 'Invalid endDate; expected YYYY-MM-DD.' });
        }
        where.entryDate = { ...where.entryDate, lte: d };
      }

      const entries = await prisma.journalEntry.findMany({
        where,
        orderBy: { entryDate: 'desc' },
        select: {
          id: true,
          entryDate: true,
          moodRating: true,
          entryTextEncrypted: true,
        },
      });

      const formattedEntries = entries.map((entry) => ({
        id: entry.id,
        entry_date: entry.entryDate.toISOString().split('T')[0],
        mood_rating: entry.moodRating ?? 0,
        entry_text: safeDecrypt(entry.entryTextEncrypted),
      }));

      return reply.send(formattedEntries);
    } catch (error) {
      app.log.error({ err: error }, 'Error fetching journal entries');
      return reply.status(500).send({ message: 'Failed to fetch journal entries.' });
    }
  });

  // =========================================================
  // POST /api/journal - Create/Upsert journal entry
  // =========================================================
  app.post(
    '/',
    async (
      request: FastifyRequest<{ Body: JournalCreateBody }>,
      reply: FastifyReply
    ) => {
      if (!request.user?.id) {
        return reply.status(401).send({ message: 'Unauthorized: User not authenticated.' });
      }

      const userId = request.user.id;
      const { entry_date, mood_rating, entry_text } = request.body;

      if (!entry_date || typeof entry_text === 'undefined' || entry_text === null) {
        return reply
          .status(400)
          .send({ message: 'Entry date and entry text are required.' });
      }

      try {
        const newEntry = await upsertJournalEntry(userId, entry_date, mood_rating, entry_text);

        const formattedNewEntry = {
          id: newEntry.id,
          entry_date: newEntry.entryDate.toISOString().split('T')[0],
          mood_rating: newEntry.moodRating ?? 0,
          entry_text: safeDecrypt(newEntry.entryTextEncrypted),
        };

        return reply.status(201).send(formattedNewEntry);
      } catch (error: any) {
        if (
          error.code === 'P2002' &&
          error.meta?.target?.includes('userId') &&
          error.meta?.target?.includes('entryDate')
        ) {
          return reply.status(409).send({
            message:
              'Conflict: You already have a journal entry for this date.',
          });
        }
        app.log.error({ err: error }, 'Error creating journal entry');
        return reply.status(500).send({ message: 'Failed to create journal entry.' });
      }
    }
  );

  // =========================================================
  // PUT /api/journal/:id - Update a journal entry
  // =========================================================
  app.put(
    '/:id',
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { entry_date?: string; mood_rating?: number; entry_text?: string };
      }>,
      reply: FastifyReply
    ) => {
      if (!request.user?.id) {
        return reply.status(401).send({ message: 'Unauthorized.' });
      }
      const { id } = request.params;
      const { entry_date, mood_rating, entry_text } = request.body;
      const userId = request.user.id;

      try {
        const existingEntry = await prisma.journalEntry.findUnique({ where: { id } });
        if (!existingEntry || existingEntry.userId !== userId) {
          return reply.status(404).send({ message: 'Journal entry not found or unauthorized.' });
        }

        const updateData: any = {};

        if (entry_date) {
          const d = normalizeDateUtc(entry_date);
          if (isNaN(d.getTime())) {
            return reply.status(400).send({ message: 'Invalid entry_date; expected YYYY-MM-DD.' });
          }
          updateData.entryDate = d;
        }

        if (typeof mood_rating !== 'undefined') updateData.moodRating = mood_rating;
        if (typeof entry_text !== 'undefined') {
          const safeText = entry_text?.trim() !== '' ? entry_text : ' ';
          updateData.entryTextEncrypted = encrypt(safeText);
        }

        const updatedEntry = await prisma.journalEntry.update({
          where: { id },
          data: updateData,
          select: { id: true, entryDate: true, moodRating: true, entryTextEncrypted: true },
        });

        const formattedUpdatedEntry = {
          id: updatedEntry.id,
          entry_date: updatedEntry.entryDate.toISOString().split('T')[0],
          mood_rating: updatedEntry.moodRating ?? 0,
          entry_text: safeDecrypt(updatedEntry.entryTextEncrypted),
        };

        return reply.send(formattedUpdatedEntry);
      } catch (error: any) {
        if (
          error.code === 'P2002' &&
          error.meta?.target?.includes('userId') &&
          error.meta?.target?.includes('entryDate')
        ) {
          return reply.status(409).send({
            message: 'You already have a journal entry for the updated date.',
          });
        }
        app.log.error({ err: error }, 'Error updating journal entry');
        return reply.status(500).send({ message: 'Failed to update journal entry.' });
      }
    }
  );

  // =========================================================
  // DELETE /api/journal/:id - Delete a journal entry
  // =========================================================
  app.delete(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      if (!request.user?.id) {
        return reply.status(401).send({ message: 'Unauthorized.' });
      }
      const { id } = request.params;
      const userId = request.user.id;

      try {
        const existingEntry = await prisma.journalEntry.findUnique({ where: { id } });
        if (!existingEntry || existingEntry.userId !== userId) {
          return reply.status(404).send({ message: 'Journal entry not found or unauthorized.' });
        }

        await prisma.journalEntry.delete({ where: { id } });
        return reply.status(204).send();
      } catch (error) {
        app.log.error({ err: error }, 'Error deleting journal entry');
        return reply.status(500).send({ message: 'Failed to delete journal entry.' });
      }
    }
  );
}
