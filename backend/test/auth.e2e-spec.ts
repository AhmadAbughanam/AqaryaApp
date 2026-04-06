import {INestApplication} from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  prisma,
  resetDatabase,
  seedDatabase,
} from './test-utils';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
    await seedDatabase();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('POST /auth/login should authenticate citizen and return JWT', async () => {
    const response = await request(app.getHttpServer()).post('/auth/login').send({
      username: 'citizen',
      password: '123456',
    });

    expect(response.status).toBe(201);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.role).toBe('citizen');
    expect(response.body.userId).toEqual(expect.any(String));
  });

  it('POST /auth/login should authenticate admin and return correct role', async () => {
    const response = await request(app.getHttpServer()).post('/auth/login').send({
      username: 'admin',
      password: '123456',
    });

    expect(response.status).toBe(201);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.role).toBe('admin');
  });

  it('POST /auth/login should return 401 for invalid credentials', async () => {
    const response = await request(app.getHttpServer()).post('/auth/login').send({
      username: 'citizen',
      password: 'wrong-password',
    });

    expect(response.status).toBe(401);
  });

  it('POST /auth/login should return 400 for missing fields', async () => {
    const response = await request(app.getHttpServer()).post('/auth/login').send({
      username: 'citizen',
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual(expect.arrayContaining([expect.any(String)]));
  });
});
