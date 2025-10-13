import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from './server';
import bcrypt from 'bcryptjs';

interface ChangeEmailBody {
  newEmail: string;
  password: string;
}

interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

interface NotificationSettingsBody {
  emailNotifications: boolean;
  appNotifications: boolean;
}

export async function settingsRoutes(app: FastifyInstance) {
  // Debug: confirm plugin mounts
  app.log.info('🔧 settingsRoutes registering...');

  // Quick ping to verify prefix is mounted: GET /api/settings/_ping
  app.get('/_ping', async () => ({ ok: true, scope: 'settings', now: new Date().toISOString() }));

  // Apply authentication to all settings routes
  app.addHook('preHandler', app.authenticate);

  /**
   * GET /api/settings/notifications
   * Get current notification preferences
   */
  app.get('/notifications', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.user?.id) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      const user = await prisma.user.findUnique({
        where: { id: request.user.id },
        select: {
          emailNotifications: true,
          appNotifications: true,
        },
      });

      if (!user) {
        return reply.status(404).send({ message: 'User not found' });
      }

      return reply.send({
        emailNotifications: user.emailNotifications ?? true,
        appNotifications: user.appNotifications ?? true,
      });
    } catch (error: any) {
      app.log.error('Error fetching notification settings:', error);
      return reply.status(500).send({
        message: 'Failed to fetch notification settings',
        error: error?.message,
      });
    }
  });

  /**
   * PUT /api/settings/notifications
   * Update notification preferences
   */
  app.put<{ Body: NotificationSettingsBody }>('/notifications', async (request, reply) => {
    try {
      if (!request.user?.id) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      const { emailNotifications, appNotifications } = request.body;

      if (typeof emailNotifications !== 'boolean' || typeof appNotifications !== 'boolean') {
        return reply
          .status(400)
          .send({ message: 'Invalid notification settings. Both values must be boolean.' });
      }

      await prisma.user.update({
        where: { id: request.user.id },
        data: { emailNotifications, appNotifications },
      });

      app.log.info(`User ${request.user.id} updated notification settings`);

      return reply.send({
        success: true,
        message: 'Notification settings updated successfully',
        emailNotifications,
        appNotifications,
      });
    } catch (error: any) {
      app.log.error('Error updating notification settings:', error);
      return reply.status(500).send({
        message: 'Failed to update notification settings',
        error: error?.message,
      });
    }
  });

  /**
   * POST /api/settings/change-email
   * Change user email address
   */
  app.post<{ Body: ChangeEmailBody }>('/change-email', async (request, reply) => {
    try {
      if (!request.user?.id) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      const { newEmail, password } = request.body;

      // Validate inputs
      if (!newEmail || !password) {
        return reply.status(400).send({
          message: 'New email and current password are required',
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        return reply.status(400).send({ message: 'Invalid email format' });
      }

      // Get current user
      const user = await prisma.user.findUnique({
        where: { id: request.user.id },
        select: { id: true, email: true, passwordHash: true },
      });

      if (!user) {
        return reply.status(404).send({ message: 'User not found' });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return reply.status(401).send({ message: 'Current password is incorrect' });
      }

      // Check if new email is already taken
      const existingUser = await prisma.user.findUnique({
        where: { email: newEmail.toLowerCase() },
      });

      if (existingUser && existingUser.id !== user.id) {
        return reply.status(409).send({
          message: 'This email is already in use by another account',
        });
      }

      // Update email
      await prisma.user.update({
        where: { id: user.id },
        data: {
          email: newEmail.toLowerCase(),
          isVerified: false, // Reset verification status
        },
      });

      app.log.info(`User ${user.id} changed email from ${user.email} to ${newEmail}`);

      return reply.send({
        success: true,
        message: 'Email address updated successfully. Please verify your new email.',
        newEmail: newEmail.toLowerCase(),
      });
    } catch (error: any) {
      app.log.error('Error changing email:', error);
      return reply.status(500).send({
        message: 'Failed to change email address',
        error: error?.message,
      });
    }
  });

  /**
   * POST /api/settings/change-password
   * Change user password
   */
  app.post<{ Body: ChangePasswordBody }>('/change-password', async (request, reply) => {
    try {
      if (!request.user?.id) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      const { currentPassword, newPassword } = request.body;

      // Validate inputs
      if (!currentPassword || !newPassword) {
        return reply.status(400).send({
          message: 'Current password and new password are required',
        });
      }

      // Validate new password strength
      if (newPassword.length < 8) {
        return reply.status(400).send({
          message: 'New password must be at least 8 characters long',
        });
      }

      // Get current user
      const user = await prisma.user.findUnique({
        where: { id: request.user.id },
        select: { id: true, passwordHash: true },
      });

      if (!user) {
        return reply.status(404).send({ message: 'User not found' });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        return reply.status(401).send({ message: 'Current password is incorrect' });
      }

      // Check if new password is same as current
      const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
      if (isSamePassword) {
        return reply.status(400).send({
          message: 'New password must be different from current password',
        });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash },
      });

      app.log.info(`User ${user.id} changed their password`);

      return reply.send({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      app.log.error('Error changing password:', error);
      return reply.status(500).send({
        message: 'Failed to change password',
        error: error?.message,
      });
    }
  });
}