// packages/api/src/auth.routes.ts
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from './server';
import bcrypt from 'bcryptjs'; // <-- CHANGED: Import bcryptjs
import { encrypt, decrypt } from './utils/encryption';

const SALT_ROUNDS = 10; // For bcryptjs hashing

export async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/register - User registration
  app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, password, displayName } = request.body as { email?: string; password?: string; displayName?: string };

    if (!email || !password || !displayName) {
      return reply.status(400).send({ error: "Email, password, and display name are required" });
    }

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return reply.status(409).send({ error: "User with this email already exists." });
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS); // <-- Use bcryptjs
      const displayNameEncrypted = encrypt(displayName);

      const newUser = await prisma.user.create({
        data: {
          email,
          passwordHash, // Store the hash
          displayNameEncrypted, // Store encrypted display name
          role: 'user', // Default role
          isVerified: false,
          // verificationToken: '...', // You might want to generate a token here for email verification
        },
        select: {
          id: true,
          email: true,
          displayNameEncrypted: true,
          role: true,
          isVerified: true,
          createdAt: true,
          statusEncrypted: true,
          twoFaEnabled: true,
        },
      });

      // Decrypt for response
      const decryptedDisplayName = newUser.displayNameEncrypted ? decrypt(newUser.displayNameEncrypted) : null;
      const decryptedStatus = newUser.statusEncrypted ? decrypt(newUser.statusEncrypted) : null;

      const token = app.jwt.sign({
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      });

      return reply.status(201).send({
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          displayName: decryptedDisplayName,
          role: newUser.role,
          isVerified: newUser.isVerified,
          createdAt: newUser.createdAt,
          status: decryptedStatus,
          twoFaEnabled: newUser.twoFaEnabled,
        }
      });
    } catch (error) {
      app.log.error('Error during registration:', error);
      app.log.error(error); // <-- ADDED: Log the full error object
      return reply.status(500).send({ message: 'Failed to register user.' });
    }
  });

  // POST /api/auth/login - User login
  app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = request.body as { email?: string; password?: string };

    if (!email || !password) {
      return reply.status(400).send({ error: "Email and password are required" });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          displayNameEncrypted: true,
          role: true,
          isVerified: true,
          createdAt: true,
          statusEncrypted: true,
          twoFaEnabled: true,
        },
      });

      if (!user) {
        return reply.status(401).send({ error: "Invalid credentials." });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash); // <-- Use bcryptjs
      if (!isPasswordValid) {
        return reply.status(401).send({ error: "Invalid credentials." });
      }

      // Decrypt for response
      const decryptedDisplayName = user.displayNameEncrypted ? decrypt(user.displayNameEncrypted) : null;
      const decryptedStatus = user.statusEncrypted ? decrypt(user.statusEncrypted) : null;

      const token = app.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return reply.send({
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: decryptedDisplayName,
          role: user.role,
          isVerified: user.isVerified,
          createdAt: user.createdAt, // This was `newUser.createdAt` in your previous snippet for login, fixed to `user.createdAt`
          status: decryptedStatus,
          twoFaEnabled: user.twoFaEnabled,
        }
      });
    } catch (error) {
      app.log.error('Error during login:', error);
      app.log.error(error); // <-- ADDED: Log the full error object
      return reply.status(500).send({ message: 'Failed to log in.' });
    }
  });
}