// packages/api/src/resource.routes.ts
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from './server';
import { decrypt } from './utils/encryption'; // Assuming decrypt is needed for user display names

// Extend FastifyRequest to include the 'user' property from our JWT payload
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}

export async function resourceRoutes(app: FastifyInstance) {
  // Apply the authentication hook to all routes in this file
  app.addHook('preHandler', app.authenticate);

  // GET /api/resources - Fetch all resources
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const resources = await prisma.resource.findMany({
        select: {
          id: true,
          title: true,
          content: true,
          category: true,
          externalUrl: true,
          _count: {
            select: {
              reviews: true,
            },
          },
          reviews: { // Make sure this 'reviews' relation exists in your Prisma schema for the Resource model
            select: {
              rating: true,
            },
          },
        },
      });

      const resourcesWithRatings = resources.map(resource => {
        const totalRating = resource.reviews.reduce((sum, review) => sum + review.rating, 0);
        const average_rating = resource.reviews.length > 0 ? totalRating / resource.reviews.length : 0;

        return {
          id: resource.id,
          title: resource.title,
          content: resource.content,
          category: resource.category,
          external_url: resource.externalUrl, // Map to frontend's `external_url`
          average_rating: average_rating,
          reviews_count: resource._count.reviews,
        };
      });

      return reply.send(resourcesWithRatings);
    } catch (error: any) { // Explicitly type error as 'any'
      app.log.error('Error fetching resources:');
      app.log.error('Error Message:', error.message);
      app.log.error('Error Stack:', error.stack);
      app.log.error('Error Name:', error.name);
      app.log.error('Error Code (if any):', error.code);
      // For more comprehensive logging, uncomment the line below if the above isn't enough
      // app.log.error('Full Error Object (JSON.stringify):', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      return reply.status(500).send({ message: 'Failed to fetch resources.' });
    }
  });

  // GET /api/resources/:id - Fetch a single resource by ID, including its reviews
  app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const resource = await prisma.resource.findUnique({
        where: { id },
        include: {
          reviews: {
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  displayNameEncrypted: true,
                },
              },
            },
          },
        },
      });

      if (!resource) {
        return reply.status(404).send({ message: 'Resource not found.' });
      }

      const totalRating = resource.reviews.reduce((sum, review) => sum + review.rating, 0);
      const average_rating = resource.reviews.length > 0 ? totalRating / resource.reviews.length : 0;

      const formattedReviews = resource.reviews.map(review => ({
        id: review.id,
        resource_id: review.resourceId,
        user_id: review.userId,
        rating: review.rating,
        content: review.content,
        created_at: review.createdAt.toISOString(),
        display_name: review.user.displayNameEncrypted ? decrypt(review.user.displayNameEncrypted) : 'Anonymous User',
      }));

      return reply.send({
        id: resource.id,
        title: resource.title,
        content: resource.content,
        category: resource.category,
        external_url: resource.externalUrl,
        average_rating: average_rating,
        reviews_count: resource.reviews.length,
        created_at: resource.createdAt.toISOString(),
        reviews: formattedReviews,
      });

    } catch (error: any) { // Added 'any' and detailed logging
      app.log.error(`Error fetching resource ${request.params.id}:`);
      app.log.error('Error Message:', error.message);
      app.log.error('Error Stack:', error.stack);
      app.log.error('Error Name:', error.name);
      app.log.error('Error Code (if any):', error.code);
      // app.log.error('Full Error Object (JSON.stringify):', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      return reply.status(500).send({ message: 'Failed to fetch resource.' });
    }
  });

  // POST /api/resources/:id/reviews - Submit a review for a resource
  app.post('/:id/reviews', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    if (!request.user?.id) {
      return reply.status(401).send({ message: 'Unauthorized: User not authenticated.' });
    }

    const { id: resourceId } = request.params;
    const { rating, content } = request.body as { rating: number; content?: string };

    if (!rating || rating < 1 || rating > 5) {
      return reply.status(400).send({ message: 'Rating is required and must be between 1 and 5.' });
    }

    try {
      // Check if resource exists
      const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
      if (!resource) {
        return reply.status(404).send({ message: 'Resource not found.' });
      }

      // Check if user already reviewed this resource
      const existingReview = await prisma.resourceReview.findFirst({
        where: {
          resourceId: resourceId,
          userId: request.user.id,
        },
      });

      if (existingReview) {
        return reply.status(409).send({ message: 'You have already reviewed this resource.' });
      }

      const newReview = await prisma.resourceReview.create({
        data: {
          rating,
          content,
          resourceId,
          userId: request.user.id,
        },
        include: { // Include user to get display name for the response
          user: {
            select: {
              displayNameEncrypted: true,
            },
          },
        },
      });

      return reply.status(201).send({
        id: newReview.id,
        resource_id: newReview.resourceId,
        user_id: newReview.userId,
        rating: newReview.rating,
        content: newReview.content,
        created_at: newReview.createdAt.toISOString(),
        display_name: newReview.user.displayNameEncrypted ? decrypt(newReview.user.displayNameEncrypted) : 'Anonymous User',
      });

    } catch (error: any) { // Added 'any' and detailed logging
      app.log.error('Error submitting review:');
      app.log.error('Error Message:', error.message);
      app.log.error('Error Stack:', error.stack);
      app.log.error('Error Name:', error.name);
      app.log.error('Error Code (if any):', error.code);
      // app.log.error('Full Error Object (JSON.stringify):', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      return reply.status(500).send({ message: 'Failed to submit review.' });
    }
  });
}