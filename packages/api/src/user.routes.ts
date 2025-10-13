// packages/api/src/user.routes.ts
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from './server';
import { decrypt, encrypt } from './utils/encryption';

export async function userRoutes(app: FastifyInstance) {
    // Apply authentication hook to all routes in this plugin
    app.addHook('preHandler', app.authenticate);

    // -------------------------------------------------------------------------
    // GET /api/users/me - Get authenticated user's profile
    // -------------------------------------------------------------------------
    app.get('/me', async (request: FastifyRequest, reply: FastifyReply) => {
        if (!request.user?.id) {
            return reply.status(401).send({ message: 'Unauthorized: User not authenticated.' });
        }

        try {
            const user = await prisma.user.findUnique({
                where: { id: request.user.id },
                select: {
                    id: true,
                    email: true,
                    displayNameEncrypted: true,
                    statusEncrypted: true,
                    role: true,
                    isVerified: true,
                    createdAt: true,
                    twoFaEnabled: true,
                    profilePictureUrl: true,
                },
            });

            if (!user) {
                return reply.status(404).send({ message: 'User not found.' });
            }

            const decryptedDisplayName = user.displayNameEncrypted ? decrypt(user.displayNameEncrypted) : null;
            const decryptedStatus = user.statusEncrypted ? decrypt(user.statusEncrypted) : null;

            return reply.send({
                id: user.id,
                email: user.email,
                displayName: decryptedDisplayName,
                status: decryptedStatus,
                role: user.role,
                isVerified: user.isVerified,
                createdAt: user.createdAt,
                twoFaEnabled: user.twoFaEnabled,
                profilePictureUrl: user.profilePictureUrl,
            });
        } catch (error) {
            app.log.error('Error fetching user profile:', error);
            return reply.status(500).send({ message: 'Failed to fetch user profile.' });
        }
    });

    // -------------------------------------------------------------------------
    // PUT /api/users/me - Update authenticated user's profile
    // -------------------------------------------------------------------------
    app.put('/me', async (request: FastifyRequest, reply: FastifyReply) => {
        if (!request.user?.id) {
            return reply.status(401).send({ message: 'Unauthorized.' });
        }

        const userId = request.user.id;
        const { displayName, status, twoFaEnabled } = request.body as {
            displayName?: string;
            status?: string;
            twoFaEnabled?: boolean;
        };

        try {
            const updateData: any = {};
            if (displayName !== undefined) {
                updateData.displayNameEncrypted = displayName ? encrypt(displayName) : null;
            }
            if (status !== undefined) {
                updateData.statusEncrypted = status ? encrypt(status) : null;
            }
            if (twoFaEnabled !== undefined) {
                updateData.twoFaEnabled = twoFaEnabled;
            }

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: updateData,
                select: {
                    id: true,
                    email: true,
                    displayNameEncrypted: true,
                    statusEncrypted: true,
                    role: true,
                    isVerified: true,
                    createdAt: true,
                    twoFaEnabled: true,
                    profilePictureUrl: true,
                },
            });

            const decryptedDisplayName = updatedUser.displayNameEncrypted ? decrypt(updatedUser.displayNameEncrypted) : null;
            const decryptedStatus = updatedUser.statusEncrypted ? decrypt(updatedUser.statusEncrypted) : null;

            return reply.send({
                id: updatedUser.id,
                email: updatedUser.email,
                displayName: decryptedDisplayName,
                status: decryptedStatus,
                role: updatedUser.role,
                isVerified: updatedUser.isVerified,
                createdAt: updatedUser.createdAt,
                twoFaEnabled: updatedUser.twoFaEnabled,
                profilePictureUrl: updatedUser.profilePictureUrl,
            });
        } catch (error) {
            app.log.error('Error updating user profile:', error);
            return reply.status(500).send({ message: 'Failed to update user profile.' });
        }
    });

    // -------------------------------------------------------------------------
    // GET /api/users/search?query=John - Search users
    // -------------------------------------------------------------------------
    app.get('/search', async (request: FastifyRequest, reply: FastifyReply) => {
        const { query } = request.query as { query?: string };

        // ✅ FIXED: Return empty array if no query, don't error out
        if (!query || query.trim().length === 0) {
            return reply.send([]);
        }

        try {
            // Fetch users with encrypted display names
            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    displayNameEncrypted: true,
                    profilePictureUrl: true,
                },
            });

            // Decrypt and filter on server side
            const matchedUsers = users
                .map((u) => ({
                    id: u.id,
                    email: u.email,
                    displayName: u.displayNameEncrypted ? decrypt(u.displayNameEncrypted) : null,
                    avatarUrl: u.profilePictureUrl, // ✅ FIXED: Changed to avatarUrl to match frontend
                }))
                .filter(
                    (u) =>
                        u.displayName &&
                        (u.displayName.toLowerCase().includes(query.toLowerCase()) ||
                         u.email.toLowerCase().includes(query.toLowerCase())) &&
                        u.id !== request.user?.id // Exclude the authenticated user
                );

            return reply.send(matchedUsers);
        } catch (error) {
            app.log.error('Error searching users:', error);
            return reply.status(500).send({ message: 'Failed to search users.' });
        }
    });

    // -------------------------------------------------------------------------
    // GET /api/users - Return all users (for chat list)
    // -------------------------------------------------------------------------
    app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const users = await prisma.user.findMany({
                where: {
                    id: { not: request.user?.id } // ✅ Exclude current user
                },
                select: {
                    id: true,
                    email: true,
                    displayNameEncrypted: true,
                    profilePictureUrl: true,
                },
            });

            const decrypted = users.map((u) => ({
                id: u.id,
                email: u.email,
                displayName: u.displayNameEncrypted ? decrypt(u.displayNameEncrypted) : null,
                avatarUrl: u.profilePictureUrl, // ✅ FIXED: Changed to avatarUrl to match frontend
            }));

            return reply.send(decrypted);
        } catch (error) {
            app.log.error('Error fetching all users:', error);
            return reply.status(500).send({ message: 'Failed to load users.' });
        }
    });
}