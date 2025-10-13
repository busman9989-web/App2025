import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from './server';
import { hashPassword, verifyPassword, encrypt, decrypt } from './utils/encryption';

export async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/register - User registration (Public)
  app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, password, displayName } = request.body as { email?: string; password?: string; displayName?: string };

    if (!email || !password || !displayName) {
      return reply.status(400).send({ error: "Email, password, and display name are required" });
    }

    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return reply.status(409).send({ error: "User with this email already exists." });
      }

      const passwordHash = await hashPassword(password);
      const displayNameEncrypted = encrypt(displayName);

      const newUser = await prisma.user.create({
        data: {
          email,
          passwordHash,
          displayNameEncrypted,
          role: 'user', // FIXED: Use lowercase 'user' to match schema
          isVerified: false,
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

      const decryptedDisplayName = newUser.displayNameEncrypted ? decrypt(newUser.displayNameEncrypted) : null;
      const decryptedStatus = newUser.statusEncrypted ? decrypt(newUser.statusEncrypted) : null;

      const token = app.jwt.sign({
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      });

      return reply
        .status(201)
        .setCookie('token', token, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        })
        .send({
          user: {
            id: newUser.id,
            email: newUser.email,
            displayName: decryptedDisplayName,
            role: newUser.role,
            isVerified: newUser.isVerified,
            createdAt: newUser.createdAt.toISOString(),
            status: decryptedStatus,
            twoFaEnabled: newUser.twoFaEnabled,
          }
        });
    } catch (error: any) {
      app.log.error('Error during registration:', error);
      return reply.status(500).send({ error: 'Failed to register user.' });
    }
  });

  // POST /api/auth/login - User login (Public)
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

      if (!user || !user.passwordHash) {
        return reply.status(401).send({ error: "Invalid credentials." });
      }

      const isPasswordValid = await verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        return reply.status(401).send({ error: "Invalid credentials." });
      }

      const decryptedDisplayName = user.displayNameEncrypted ? decrypt(user.displayNameEncrypted) : null;
      const decryptedStatus = user.statusEncrypted ? decrypt(user.statusEncrypted) : null;

      const token = app.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return reply
        .setCookie('token', token, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        })
        .send({
          user: {
            id: user.id,
            email: user.email,
            displayName: decryptedDisplayName,
            role: user.role,
            isVerified: user.isVerified,
            createdAt: user.createdAt.toISOString(),
            status: decryptedStatus,
            twoFaEnabled: user.twoFaEnabled,
          }
        });
    } catch (error: any) {
      app.log.error('Error during login:', error);
      return reply.status(500).send({ error: 'Failed to log in.' });
    }
  });

  // POST /api/auth/logout - User logout (Protected)
  app.post('/logout', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.clearCookie('token', { path: '/' }).send({ message: 'Logged out successfully.' });
  });
}