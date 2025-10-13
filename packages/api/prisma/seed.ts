// packages/api/prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import { hashPassword, encrypt } from '@utils/encryption';
import { config } from 'dotenv';

config({ path: `.env` });

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // --- Delete existing data ---
  await prisma.appointment.deleteMany({});
  await prisma.resourceReview.deleteMany({});
  await prisma.resource.deleteMany({});
  await prisma.checklist.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Cleaned existing data.');

  // --- Users ---
  const hashedPassword = await hashPassword('password123');

  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      passwordHash: hashedPassword,
      role: 'USER',
      displayNameEncrypted: encrypt('Alice Smith'),
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      passwordHash: hashedPassword,
      role: 'USER',
      displayNameEncrypted: encrypt('Bob Johnson'),
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      displayNameEncrypted: encrypt('Admin User'),
    },
  });

  console.log('Created users:', { user1, user2, adminUser });

  // --- Resources ---
  const resource1 = await prisma.resource.upsert({
    where: { id: 'resource1-id' },
    update: {
      title: 'Mental Wellness Guide (Updated)',
      content: 'A comprehensive guide to maintaining mental well-being, including stress management techniques and mindfulness exercises.',
      externalUrl: 'https://example.com/mental-wellness',
    },
    create: {
      id: 'resource1-id',
      title: 'Mental Wellness Guide',
      content: 'A comprehensive guide to maintaining mental well-being, including stress management techniques and mindfulness exercises.',
      category: 'Mental Health',
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
      category: 'Physical Health',
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
      category: 'Physical Health',
      externalUrl: 'https://example.com/home-workouts',
      createdAt: new Date('2023-03-10T14:00:00Z'),
    },
  });

  const resource4 = await prisma.resource.upsert({
    where: { id: 'resource4-id' },
    update: {},
    create: {
      id: 'resource4-id',
      title: 'Financial Assistance Programs',
      content: 'Information about available financial aid programs for seniors and low-income individuals.',
      category: 'Financial Aid',
      externalUrl: 'https://example.com/financial-aid',
      createdAt: new Date('2023-04-05T09:00:00Z'),
    },
  });

  const resource5 = await prisma.resource.upsert({
    where: { id: 'resource5-id' },
    update: {},
    create: {
      id: 'resource5-id',
      title: 'Understanding Your Legal Rights',
      content: 'A guide to understanding your legal rights as a senior citizen, including healthcare directives and estate planning.',
      category: 'Legal Advice',
      externalUrl: 'https://example.com/legal-rights',
      createdAt: new Date('2023-04-10T10:00:00Z'),
    },
  });

  const resource6 = await prisma.resource.upsert({
    where: { id: 'resource6-id' },
    update: {},
    create: {
      id: 'resource6-id',
      title: 'Caregiver Support Groups',
      content: 'Find local and online support groups for caregivers to share experiences and get advice.',
      category: 'Mental Health',
      externalUrl: 'https://example.com/caregiver-support',
      createdAt: new Date('2023-04-15T09:00:00Z'),
    },
  });

  console.log('Created resources:', { resource1, resource2, resource3, resource4, resource5, resource6 });

  // --- Resource Reviews ---
  await prisma.resourceReview.upsert({
    where: { id: 'review1-id' },
    update: {},
    create: {
      id: 'review1-id',
      rating: 5,
      content: 'Very helpful guide, easy to understand and implement!',
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
      content: 'Good information, but some recipes are complex for beginners.',
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
      content: 'Excellent nutritional advice. My health improved significantly!',
      userId: user1.id,
      resourceId: resource2.id,
      createdAt: new Date('2023-03-05T09:00:00Z'),
    },
  });

  await prisma.resourceReview.upsert({
    where: { id: 'review4-id' },
    update: {},
    create: {
      id: 'review4-id',
      rating: 3,
      content: 'Decent exercises, but could use more variety and video demonstrations.',
      userId: user2.id,
      resourceId: resource3.id,
      createdAt: new Date('2023-03-15T16:00:00Z'),
    },
  });

  await prisma.resourceReview.upsert({
    where: { id: 'review5-id' },
    update: {},
    create: {
      id: 'review5-id',
      rating: 4,
      content: 'Great starting point for understanding available programs.',
      userId: adminUser.id,
      resourceId: resource4.id,
      createdAt: new Date('2023-04-20T14:00:00Z'),
    },
  });

  await prisma.resourceReview.upsert({
    where: { id: 'review6-id' },
    update: {},
    create: {
      id: 'review6-id',
      rating: 5,
      content: 'Essential information every senior should know. Very comprehensive.',
      userId: user1.id,
      resourceId: resource5.id,
      createdAt: new Date('2023-04-25T11:00:00Z'),
    },
  });

  // --- Checklists ---
  const checklist1 = await prisma.checklist.upsert({
    where: { id: 'checklist1-id' },
    update: {},
    create: {
      id: 'checklist1-id',
      name: 'Morning Routine',
      items: [
        { text: 'Take morning medication', completed: false },
        { text: 'Drink a glass of water', completed: false },
        { text: 'Light stretching or exercise', completed: false },
        { text: 'Eat a healthy breakfast', completed: false },
        { text: 'Check the weather', completed: false },
      ],
      isTemplate: false,
      userId: user1.id,
      createdAt: new Date('2023-01-10T08:00:00Z'),
    },
  });

  const checklist2 = await prisma.checklist.upsert({
    where: { id: 'checklist2-id' },
    update: {},
    create: {
      id: 'checklist2-id',
      name: 'Doctor Visit Preparation',
      items: [
        { text: 'Gather insurance cards and ID', completed: true },
        { text: 'List current medications', completed: true },
        { text: 'Write down questions to ask', completed: false },
        { text: 'Bring recent test results', completed: false },
        { text: 'Arrive 15 minutes early', completed: false },
      ],
      isTemplate: false,
      userId: user1.id,
      createdAt: new Date('2023-02-05T10:00:00Z'),
    },
  });

  const checklist3 = await prisma.checklist.upsert({
    where: { id: 'checklist3-id' },
    update: {},
    create: {
      id: 'checklist3-id',
      name: 'Weekly Meal Planning',
      items: [
        { text: 'Check pantry inventory', completed: true },
        { text: 'Plan 7 days of meals', completed: false },
        { text: 'Create grocery shopping list', completed: false },
        { text: 'Check store sales and coupons', completed: false },
        { text: 'Schedule grocery pickup/delivery', completed: false },
      ],
      isTemplate: false,
      userId: user2.id,
      createdAt: new Date('2023-01-15T14:00:00Z'),
    },
  });

  const checklist4 = await prisma.checklist.upsert({
    where: { id: 'checklist4-id' },
    update: {},
    create: {
      id: 'checklist4-id',
      name: 'Home Safety Checklist',
      items: [
        { text: 'Test smoke detector batteries', completed: false },
        { text: 'Check locks on doors and windows', completed: false },
        { text: 'Clear walkways of tripping hazards', completed: false },
        { text: 'Update emergency contact list', completed: false },
        { text: 'Check flashlight and first aid kit', completed: false },
      ],
      isTemplate: true,
      userId: adminUser.id,
      createdAt: new Date('2023-01-20T16:00:00Z'),
    },
  });

  const checklist5 = await prisma.checklist.upsert({
    where: { id: 'checklist5-id' },
    update: {},
    create: {
      id: 'checklist5-id',
      name: 'Evening Wind Down',
      items: [
        { text: 'Turn off electronic devices', completed: false },
        { text: 'Take evening medications', completed: false },
        { text: 'Do relaxation exercises', completed: false },
        { text: 'Set out clothes for tomorrow', completed: false },
      ],
      isTemplate: false,
      userId: user2.id,
      createdAt: new Date('2023-02-01T20:00:00Z'),
    },
  });

  console.log('Created checklists:', { checklist1, checklist2, checklist3, checklist4, checklist5 });

  // --- Appointments ---
  const appointment1 = await prisma.appointment.upsert({
    where: { id: 'appointment1-id' },
    update: {},
    create: {
      id: 'appointment1-id',
      title: 'Annual Physical Checkup',
      description: 'Yearly health checkup with Dr. Smith',
      appointmentDatetime: new Date('2023-03-20T10:00:00Z'),
      location: 'Downtown Medical Center',
      userId: user1.id,
      createdAt: new Date('2023-03-10T09:00:00Z'),
    },
  });

  const appointment2 = await prisma.appointment.upsert({
    where: { id: 'appointment2-id' },
    update: {},
    create: {
      id: 'appointment2-id',
      title: 'Eye Exam',
      description: 'Regular vision check with optometrist',
      appointmentDatetime: new Date('2023-03-25T14:30:00Z'),
      location: 'Vision Care Clinic',
      userId: user1.id,
      createdAt: new Date('2023-03-12T11:00:00Z'),
    },
  });

  const appointment3 = await prisma.appointment.upsert({
    where: { id: 'appointment3-id' },
    update: {},
    create: {
      id: 'appointment3-id',
      title: 'Dental Cleaning',
      description: 'Routine dental cleaning and checkup',
      appointmentDatetime: new Date('2023-03-30T09:00:00Z'),
      location: 'Smile Dental Office',
      userId: user2.id,
      createdAt: new Date('2023-03-15T13:00:00Z'),
    },
  });

  console.log('Created appointments:', { appointment1, appointment2, appointment3 });

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
