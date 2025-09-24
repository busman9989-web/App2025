// packages/api/prisma/seed.ts - TEMPORARY LOCATION FOR RECREATION

import { PrismaClient } from '@prisma/client';
// Use the path alias for your encryption utility
import { hashPassword, encrypt } from '@utils/encryption'; // <-- CRITICAL: Changed to path alias and hashPassword
import { config } from 'dotenv'; // Added dotenv for environment variables if needed

// Load environment variables (if needed for seeding specific values)
config({ path: `.env` });

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // --- Delete existing data (optional, but good for repeatable seeds) ---
  // Be careful with this in production! You might want to remove or guard this.
  await prisma.resourceReview.deleteMany({});
  await prisma.resource.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Cleaned existing data.');


  // --- Create some test users ---
  // Using hashPassword from your encryption utility, as per the original error context
  const hashedPassword = await hashPassword('password123'); // Hashed password for test users

  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      passwordHash: hashedPassword, // Using passwordHash as per schema
      role: 'USER', // Ensure this matches your enum
      displayNameEncrypted: encrypt('Alice Smith'),
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      passwordHash: hashedPassword,
      role: 'USER', // Ensure this matches your enum
      displayNameEncrypted: encrypt('Bob Johnson'),
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      role: 'ADMIN', // Ensure this matches your enum
      displayNameEncrypted: encrypt('Admin User'),
    },
  });

  console.log('Created users:', { user1, user2, adminUser });

  // --- Create some test resources ---
  const resource1 = await prisma.resource.upsert({
    where: { id: 'resource1-id' }, // Use a fixed ID for upsert
    update: {
      title: 'Mental Wellness Guide (Updated)',
      content: 'A comprehensive guide to maintaining mental well-being, including stress management techniques and mindfulness exercises.',
      externalUrl: 'https://example.com/mental-wellness',
    },
    create: {
      id: 'resource1-id', // Provide a specific ID for creation
      title: 'Mental Wellness Guide',
      content: 'A comprehensive guide to maintaining mental well-being, including stress management techniques and mindfulness exercises.',
      category: 'MENTAL_HEALTH', // Ensure this matches your enum
      externalUrl: 'https://example.com/mental-wellness',
      createdAt: new Date('2023-01-15T10:00:00Z'),
    },
  });

  const resource2 = await prisma.resource.upsert({
    where: { id: 'resource2-id' },
    update: {
      title: 'Nutrition for Seniors (Updated)',
      content: 'Tips and recipes for a balanced diet specifically tailored for older adults, focusing on essential nutrients.',
      externalUrl: 'https://example.com/senior-nutrition',
    },
    create: {
      id: 'resource2-id',
      title: 'Nutrition for Seniors',
      content: 'Tips and recipes for a balanced diet specifically tailored for older adults, focusing on essential nutrients.',
      category: 'NUTRITION', // Ensure this matches your enum
      externalUrl: 'https://example.com/senior-nutrition',
      createdAt: new Date('2023-02-20T11:30:00Z'),
    },
  });

  const resource3 = await prisma.resource.upsert({
    where: { id: 'resource3-id' },
    update: {
      title: 'Physical Activity at Home',
      content: 'Easy exercises and workout routines that can be done from the comfort of your home, suitable for all fitness levels.',
      externalUrl: 'https://example.com/home-workouts',
    },
    create: {
      id: 'resource3-id',
      title: 'Physical Activity at Home',
      content: 'Easy exercises and workout routines that can be done from the comfort of your home, suitable for all fitness levels.',
      category: 'PHYSICAL_HEALTH', // Ensure this matches your enum
      externalUrl: 'https://example.com/home-workouts',
      createdAt: new Date('2023-03-10T14:00:00Z'),
    },
  });

  // Resource with no reviews initially
  const resource4 = await prisma.resource.upsert({
    where: { id: 'resource4-id' },
    update: {},
    create: {
      id: 'resource4-id',
      title: 'Caregiver Support Groups',
      content: 'Find local and online support groups for caregivers to share experiences and get advice.',
      category: 'SUPPORT', // Ensure this matches your enum
      externalUrl: 'https://example.com/caregiver-support',
      createdAt: new Date('2023-04-05T09:00:00Z'),
    },
  });

  console.log('Created resources:', { resource1, resource2, resource3, resource4 });

  // --- Create some test reviews ---
  await prisma.resourceReview.upsert({
    where: { id: 'review1-id' },
    update: {},
    create: {
      id: 'review1-id',
      rating: 5,
      content: 'Very helpful guide, easy to understand!',
      userId: user1.id,
      resourceId: resource1.id,
      createdAt: new Date('2023-01-20T12:00:00Z'),
    },
  });

  await prisma.resourceReview.upsert({
    where: { id: 'review2-id' },
    update: {},
    create: {
      id: 'review2-id',
      rating: 4,
      content: 'Good information, but some recipes are complex.',
      userId: user2.id,
      resourceId: resource2.id,
      createdAt: new Date('2023-03-01T15:00:00Z'),
    },
  });

  await prisma.resourceReview.upsert({
    where: { id: 'review3-id' },
    update: {},
    create: {
      id: 'review3-id',
      rating: 5,
      content: 'A must-read for any caregiver. Practical advice.',
      userId: user1.id,
      resourceId: resource2.id, // User1 also reviews resource2
      createdAt: new Date('2023-03-05T09:00:00Z'),
    },
  });

  await prisma.resourceReview.upsert({
    where: { id: 'review4-id' },
    update: {},
    create: {
      id: 'review4-id',
      rating: 3,
      content: 'Decent exercises, but could use more variety.',
      userId: user2.id,
      resourceId: resource3.id,
      createdAt: new Date('2023-03-15T16:00:00Z'),
    },
  });

  console.log('Seeding finished.');
}

main()
  .catch(e => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });