import bcrypt from 'bcryptjs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';

let app: Application;
let prisma: any;
let userAccessToken = '';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  app = (await import('../src/app')).default;
  prisma = (await import('../src/config/prisma')).default;
  await prisma.$connect();
});

afterAll(async () => {
  if (!prisma) {
    return;
  }

  await prisma.refreshToken.deleteMany({
    where: { user: { email: 'testuser_critical@example.com' } },
  });
  await prisma.loginAttempt.deleteMany({
    where: { email: 'testuser_critical@example.com' },
  });
  await prisma.otpVerification.deleteMany({
    where: { email: 'testuser_critical@example.com' },
  });
  await prisma.user.deleteMany({
    where: { email: 'testuser_critical@example.com' },
  });
  await prisma.$disconnect();
});

describe('Auth - register flow', () => {
  it('POST /api/v1/auth/register should reject invalid email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test',
        email: 'notanemail',
        password: 'Test@1234',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/register should reject short password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test',
        email: 'testuser_critical@example.com',
        password: '123',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('Auth - login flow', () => {
  it('POST /api/v1/auth/login should reject unverified user', async () => {
    await prisma.user.deleteMany({
      where: { email: 'testuser_critical@example.com' },
    });

    const hash = await bcrypt.hash('Test@1234', 12);

    await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'testuser_critical@example.com',
        passwordHash: hash,
        isVerified: false,
      },
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'testuser_critical@example.com',
        password: 'Test@1234',
      });

    expect(res.status).toBe(403);
    expect(res.body.status).toBe('error');
  });

  it('POST /api/v1/auth/login should reject wrong password', async () => {
    await prisma.user.updateMany({
      where: { email: 'testuser_critical@example.com' },
      data: { isVerified: true },
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'testuser_critical@example.com',
        password: 'WrongPassword',
      });

    expect(res.status).toBe(429);
  });

  it('POST /api/v1/auth/login should succeed with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'testuser_critical@example.com',
        password: 'Test@1234',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe('testuser_critical@example.com');
    userAccessToken = res.body.data.accessToken as string;
  });
});

describe('Orders - protection', () => {
  it('POST /api/v1/orders should reject unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .send({ items: [], deliveryAddress: {} });

    expect(res.status).toBe(401);
  });

  it('POST /api/v1/orders should reject empty items array', async () => {
    if (!userAccessToken) {
      throw new Error('Missing access token in login response');
    }

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({
        items: [],
        deliveryAddress: {
          fullName: 'Test',
          phone: '9800000000',
          address: 'Pulchowk',
          city: 'Lalitpur',
        },
      });

    expect(res.status).toBe(400);
  });
});

describe('Admin - access control', () => {
  it('GET /api/v1/orders/admin should reject non-admin user', async () => {
    if (!userAccessToken) {
      throw new Error('Missing access token in login response');
    }

    const res = await request(app)
      .get('/api/v1/orders/admin')
      .set('Authorization', `Bearer ${userAccessToken}`);

    expect(res.status).toBe(403);
  });

  it('GET /api/v1/products/admin/all should reject non-admin user', async () => {
    if (!userAccessToken) {
      throw new Error('Missing access token in login response');
    }

    const res = await request(app)
      .get('/api/v1/products/admin/all')
      .set('Authorization', `Bearer ${userAccessToken}`);

    expect(res.status).toBe(403);
  });
});
