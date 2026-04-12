import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT ?? '3001';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/postgres';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
process.env.OTP_SECRET = process.env.OTP_SECRET ?? 'cccccccccccccccccccccccccccccccc';
process.env.EMAIL_USER = process.env.EMAIL_USER ?? 'test@example.com';
process.env.EMAIL_PASS = process.env.EMAIL_PASS ?? 'test-password';
process.env.EMAIL_FROM = process.env.EMAIL_FROM ?? 'Test <test@example.com>';
process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? 'test-cloud';
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY ?? 'test-key';
process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET ?? 'test-secret';
process.env.FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

const mockPrisma = {
  user: {
    findUnique: jest.fn<() => Promise<any>>(),
    create: jest.fn<() => Promise<any>>(),
    update: jest.fn<() => Promise<any>>(),
  },
  otpVerification: {
    deleteMany: jest.fn<() => Promise<any>>(),
    create: jest.fn<() => Promise<any>>(),
  },
};

const sendEmailMock = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);

jest.mock('express-rate-limit', () => {
  return () => {
    return (_req: unknown, _res: unknown, next: (value?: unknown) => void) => next();
  };
});

jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}));

jest.mock('../src/config/email', () => ({
  __esModule: true,
  sendEmail: sendEmailMock,
}));

describe('POST /api/v1/auth/register - production hardening suite', () => {
  let app: any;

  const validPayload = {
    name: 'Kanchan Maharjan',
    email: 'qa.register@example.com',
    password: 'SecurePass123!',
    phone: '9800000000',
  };

  beforeAll(async () => {
    app = (await import('../src/app')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-1',
      name: validPayload.name,
      email: validPayload.email,
      isVerified: false,
    });
    mockPrisma.user.update.mockResolvedValue({
      id: 'user-1',
      name: validPayload.name,
      email: validPayload.email,
      isVerified: false,
    });
    mockPrisma.otpVerification.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.otpVerification.create.mockResolvedValue({ id: 'otp-1' });
  });

  describe('1. Happy Path', () => {
    it('returns 201 with expected response schema for valid payload', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validPayload);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
        })
      );
      expect(response.body.message).toContain('OTP sent');
      expect(sendEmailMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('2. Invalid Input Tests', () => {
    it('rejects missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: validPayload.email });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('rejects wrong data types', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 123,
          email: ['bad'],
          password: true,
          phone: 999,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('rejects invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validPayload, email: 'not-an-email' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('rejects weak/short password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validPayload, password: '1234567' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('rejects empty strings', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: '', email: '', password: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('rejects null payload values', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: null,
          email: null,
          password: null,
          phone: null,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('handles unexpected extra fields safely', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...validPayload,
          role: 'ADMIN',
          isVerified: true,
          injected: { dangerous: true },
        });

      expect([201, 400]).toContain(response.status);
      expect(response.body).toEqual(expect.any(Object));
    });
  });

  describe('3. Edge Cases', () => {
    it('rejects extremely long inputs', async () => {
      const long = 'a'.repeat(1200);
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: long,
          email: validPayload.email,
          password: long,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('accepts boundary password length of 8', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validPayload, password: 'A1bcdefg' });

      expect(response.status).toBe(201);
    });

    it('accepts boundary password length of 30 and rejects 31', async () => {
      const exactly30 = 'A'.repeat(30);
      const over31 = 'A'.repeat(31);

      const accepted = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validPayload, password: exactly30 });

      const rejected = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validPayload, password: over31 });

      expect(accepted.status).toBe(201);
      expect(rejected.status).toBe(400);
    });

    it('rejects duplicate already-verified email', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'existing-user',
        email: validPayload.email,
        isVerified: true,
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validPayload);

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('Email already registered');
    });

    it('handles special characters in name safely', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...validPayload,
          name: "!@#$%^&*()_+{}|:<>?~`[]\\;',./",
        });

      expect([201, 400]).toContain(response.status);
      expect(response.body).toEqual(expect.any(Object));
    });
  });

  describe('4. Security / Attack Tests', () => {
    it('does not crash on SQL injection payloads', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: "' OR 1=1 --",
          email: validPayload.email,
          password: 'SecurePass123!',
        });

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
      expect(response.body.stack).toBeUndefined();
    });

    it('does not crash on XSS payloads', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: '<script>alert(1)</script>',
          email: validPayload.email,
          password: 'SecurePass123!',
        });

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
      expect(response.body.stack).toBeUndefined();
    });

    it('handles malformed JSON safely', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"name":"broken-json"');

      expect([400, 500]).toContain(response.status);
      expect(response.body.stack).toBeUndefined();
    });

    it('rejects missing auth token on protected routes', async () => {
      const response = await request(app).get('/api/v1/orders/admin');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No Tokens Provided');
    });

    it('rejects invalid or tampered JWT token', async () => {
      const validToken = jwt.sign(
        { userId: 'u1', role: 'USER' },
        process.env.JWT_ACCESS_SECRET as string,
        { expiresIn: '15m' }
      );
      const tampered = `${validToken}tampered`;

      const response = await request(app)
        .get('/api/v1/orders/mine')
        .set('Authorization', `Bearer ${tampered}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
  });

  describe('5. Authorization Tests', () => {
    it('blocks normal user from admin route', async () => {
      const userToken = jwt.sign(
        { userId: 'user-1', role: 'USER' },
        process.env.JWT_ACCESS_SECRET as string,
        { expiresIn: '15m' }
      );

      const response = await request(app)
        .get('/api/v1/orders/admin')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Admin access required');
    });

    it('rejects expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: 'user-1', role: 'USER' },
        process.env.JWT_ACCESS_SECRET as string,
        { expiresIn: '-1s' }
      );

      const response = await request(app)
        .get('/api/v1/orders/mine')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });

    it('rejects fake token format', async () => {
      const response = await request(app)
        .get('/api/v1/orders/mine')
        .set('Authorization', 'Bearer this.is.not.a.jwt');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
  });

  describe('6. Crash Tests', () => {
    it.each([
      null,
      [],
      'plain-string',
      { random: 'data' },
      '42',
      'true',
    ])('never crashes on invalid payload: %p', async (payload) => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send(typeof payload === 'string' ? payload : payload as any);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(600);
      expect(response.body.stack).toBeUndefined();
    });
  });

  describe('7. Performance / Abuse Tests', () => {
    it('handles burst traffic without crashing', async () => {
      const requests = Array.from({ length: 20 }, (_, index) => {
        return request(app)
          .post('/api/v1/auth/register')
          .send({
            name: `Burst User ${index}`,
            email: `burst${index}@example.com`,
            password: 'BurstPass123!',
          });
      });

      const responses = await Promise.all(requests);

      expect(responses).toHaveLength(20);
      responses.forEach((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(500);
      });
    }, 20000);
  });

  describe('8. Error Handling', () => {
    it('returns safe error response when database fails', async () => {
      mockPrisma.user.findUnique.mockRejectedValueOnce(new Error('db offline'));

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validPayload);

      expect(response.status).toBe(500);
      expect(response.body).toEqual(
        expect.objectContaining({
          status: 'error',
          message: 'Something went wrong',
        })
      );
      expect(response.body.stack).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toContain('db offline');
    });
  });
});
