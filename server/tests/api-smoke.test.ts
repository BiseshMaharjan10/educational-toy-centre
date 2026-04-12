import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

const requiredEnv: Record<string, string> = {
  NODE_ENV: 'test',
  PORT: '3001',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/testdb',
  JWT_ACCESS_SECRET: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  JWT_REFRESH_SECRET: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  OTP_SECRET: 'cccccccccccccccccccccccccccccccc',
  EMAIL_USER: 'test@example.com',
  EMAIL_PASS: 'test-password',
  EMAIL_FROM: 'Test <test@example.com>',
  CLOUDINARY_CLOUD_NAME: 'test-cloud',
  CLOUDINARY_API_KEY: 'test-key',
  CLOUDINARY_API_SECRET: 'test-secret',
  FRONTEND_URL: 'http://localhost:5173',
};

let app: any;

beforeAll(async () => {
  Object.assign(process.env, requiredEnv);
  app = (await import('../src/app')).default;
});

describe('api smoke checks', () => {
  it('returns health check ok', async () => {
    const response = await request(app).get('/api/v1/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('mounts the orders route', async () => {
    const response = await request(app).post('/api/v1/orders/');
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('No Tokens Provided');
  });
});
