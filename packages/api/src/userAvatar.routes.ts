// src/userAvatar.routes.ts

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from './server';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

// Extending FastifyRequest is required if not done in server.ts
declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string };
  }
}

// The route is defined as '/avatar' and server.ts now registers it without a prefix.
export async function userAvatarRoutes(app: FastifyInstance) {
  // ✅ Apply authentication to all routes in this plugin
  app.addHook('preHandler', app.authenticate);

  app.post('/avatar', async (request: FastifyRequest, reply: FastifyReply) => {
    // The ID is a String (UUID) based on your Prisma schema.
    const userId = request.user?.id;
    
    // Hardened check for userId validity
    if (!userId || typeof userId !== 'string') {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const data = await request.file({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit
    if (!data) {
      return reply.status(400).send({ message: 'No file uploaded.' });
    }
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(data.mimetype)) {
      return reply.status(400).send({ message: 'Invalid file type. Only jpg/png/gif/webp allowed.' });
    }

    // Unique filename
    const ext = path.extname(data.filename).toLowerCase();
    const filename = `${userId}_${randomUUID()}${ext}`; 
    
    // Corrected local file saving path (assuming 'src' is one level below 'public')
    const dir = path.join(__dirname, '..', 'public', 'avatars'); 
    const savePath = path.join(dir, filename);

    // 1. Find and delete old avatar if it exists (Prisma call structure is correct)
    const user = await prisma.user.findUnique({
      where: { id: userId }, 
      select: { profilePictureUrl: true },
    });
    
    if (user?.profilePictureUrl) {
      // Only delete if it points to our /avatars/ directory (simple safety check)
      const oldPath = path.join(dir, path.basename(user.profilePictureUrl));
      try {
        await fs.unlink(oldPath);
      } catch (e) {
        // ignore if already gone
        app.log.warn('Failed to delete old avatar:', e);
      }
    }

    // 2. Compress and save new avatar
    await fs.mkdir(dir, { recursive: true });
    const buffer = await data.toBuffer();
    const processed = await sharp(buffer)
      .resize(256, 256, { fit: 'cover' })
      .toFormat(ext === '.png' ? 'png' : 'jpeg', { quality: 80 })
      .toBuffer();
    await fs.writeFile(savePath, processed);

    // 3. Save URL in DB
    const profilePictureUrl = `/avatars/${filename}`;
    await prisma.user.update({
      where: { id: userId }, 
      data: { profilePictureUrl },
    });

    app.log.info(`Avatar uploaded for user ${userId}: ${profilePictureUrl}`);

    return reply.send({ profilePictureUrl });
  });
}