// packages/api/src/journal.routes.ts
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from './server';
import { encrypt, decrypt } from './utils/encryption'; // <-- Import encryption utilities

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

export async function journalRoutes(app: FastifyInstance) {
  // Apply authentication to all journal routes
  app.addHook('preHandler', app.authenticate);

  // GET /api/journal - Fetch journal entries for the authenticated user
  // Query parameters: startDate, endDate (ISO string 'YYYY-MM-DD')
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ message: 'Unauthorized: User not authenticated.' });
    }

    const userId = request.user.id;
    const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };

    try {
      const where: any = { userId };
      if (startDate) {
        // Prisma's @db.Date maps to `Date` object in JS, so comparisons work
        // It's crucial that the input `startDate` is 'YYYY-MM-DD' for correct comparison with @db.Date
        where.entryDate = { ...where.entryDate, gte: new Date(startDate) };
      }
      if (endDate) {
        // For endDate, we need to go to the end of the day to include entries on that day.
        // If entryDate is truly `DATE` type, comparing with `new Date(endDate)` (which is `YYYY-MM-DD 00:00:00`)
        // will include that day. However, for safety if `entryDate` was ever `TIMESTAMP`,
        // it's common to add one day and use `<` (exclusive end).
        // Given @db.Date, `lte: new Date(endDate)` should work fine.
        where.entryDate = { ...where.entryDate, lte: new Date(endDate) };
      }

      const entries = await prisma.journalEntry.findMany({
        where,
        orderBy: {
          entryDate: 'desc', // Order by the actual 'entryDate' field from schema.prisma
        },
        select: { // Select specific fields from schema.prisma
          id: true,
          entryDate: true,
          moodRating: true,
          entryTextEncrypted: true, // <-- Select encrypted field
        },
      });

      // Map backend Prisma fields to frontend JournalEntry interface fields
      const formattedEntries = entries.map(entry => ({
        id: entry.id,
        entry_date: entry.entryDate.toISOString().split('T')[0], // Format to 'YYYY-MM-DD'
        mood_rating: entry.moodRating || 0, // Default to 0 if null/undefined
        entry_text: decrypt(entry.entryTextEncrypted), // <-- DECRYPT TEXT
      }));

      return reply.send(formattedEntries);
    } catch (error) {
      app.log.error('Error fetching journal entries:', error);
      return reply.status(500).send({ message: 'Failed to fetch journal entries.' });
    }
  });

  // POST /api/journal - Create a new journal entry
  // Expects from frontend: { entry_date: string, mood_rating: number, entry_text: string }
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ message: 'Unauthorized: User not authenticated.' });
    }

    const userId = request.user.id;
    const { entry_date, mood_rating, entry_text } = request.body as { entry_date: string; mood_rating?: number; entry_text: string };

    if (!entry_date || typeof entry_text === 'undefined' || entry_text === null) {
      return reply.status(400).send({ message: 'Entry date and entry text are required.' });
    }

    try {
      const entryTextEncrypted = encrypt(entry_text); // <-- ENCRYPT TEXT

      const newEntry = await prisma.journalEntry.create({
        data: {
          entryDate: new Date(entry_date), // Use 'entryDate' field from schema
          moodRating: mood_rating,         // Use 'moodRating' field from schema
          entryTextEncrypted: entryTextEncrypted, // <-- Store encrypted text
          userId,
        },
        select: { // Select fields to return
          id: true,
          entryDate: true,
          moodRating: true,
          entryTextEncrypted: true,
        },
      });

      // Map backend Prisma response back to frontend JournalEntry interface format
      const formattedNewEntry = {
        id: newEntry.id,
        entry_date: newEntry.entryDate.toISOString().split('T')[0],
        mood_rating: newEntry.moodRating || 0,
        entry_text: decrypt(newEntry.entryTextEncrypted), // <-- DECRYPT FOR RESPONSE
      };

      return reply.status(201).send(formattedNewEntry);
    } catch (error: any) {
      // Handle the unique constraint error specifically if a user tries to add two entries for the same day
      if (error.code === 'P2002' && error.meta?.target?.includes('userId') && error.meta?.target?.includes('entryDate')) {
        return reply.status(409).send({ message: 'You already have a journal entry for this date.' });
      }
      app.log.error('Error creating journal entry:', error);
      return reply.status(500).send({ message: 'Failed to create journal entry.' });
    }
  });

  // PUT /api/journal/:id - Update a journal entry
  // Expects from frontend: { entry_date?: string, mood_rating?: number, entry_text?: string }
  app.put('/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: { entry_date?: string; mood_rating?: number; entry_text?: string } }>, reply: FastifyReply) => {
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
      // If entry_date is updated, check for unique constraint violation
      if (entry_date) {
        // Need to check if changing the date would violate the unique constraint
        // This is tricky: if the user changes the date to one they already have an entry for, Prisma will throw
        // The unique constraint is [userId, entryDate]
        // If entryDate changes, we might need a more complex check or let Prisma handle the error
        updateData.entryDate = new Date(entry_date);
      }
      if (typeof mood_rating !== 'undefined') updateData.moodRating = mood_rating;
      if (typeof entry_text !== 'undefined') updateData.entryTextEncrypted = encrypt(entry_text); // <-- ENCRYPT TEXT

      const updatedEntry = await prisma.journalEntry.update({
        where: { id },
        data: updateData,
        select: { id: true, entryDate: true, moodRating: true, entryTextEncrypted: true },
      });

      // Map backend Prisma response back to frontend JournalEntry interface format
      const formattedUpdatedEntry = {
        id: updatedEntry.id,
        entry_date: updatedEntry.entryDate.toISOString().split('T')[0],
        mood_rating: updatedEntry.moodRating || 0,
        entry_text: decrypt(updatedEntry.entryTextEncrypted), // <-- DECRYPT FOR RESPONSE
      };

      return reply.send(formattedUpdatedEntry);
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('userId') && error.meta?.target?.includes('entryDate')) {
        return reply.status(409).send({ message: 'You already have a journal entry for the updated date.' });
      }
      app.log.error('Error updating journal entry:', error);
      return reply.status(500).send({ message: 'Failed to update journal entry.' });
    }
  });

  // DELETE /api/journal/:id - Delete a journal entry
  app.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
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
      return reply.status(204).send(); // No content for successful delete
    } catch (error) {
      app.log.error('Error deleting journal entry:', error);
      return reply.status(500).send({ message: 'Failed to delete journal entry.' });
    }
  });
}