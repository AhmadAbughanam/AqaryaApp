import {INestApplication} from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  loginAndGetToken,
  prisma,
  resetDatabase,
  seedDatabase,
} from './test-utils';

describe('Profile (e2e)', () => {
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

  it('GET /users/me/profile should return owned properties, investments, and aggregates', async () => {
    const citizenToken = await loginAndGetToken(app, 'citizen');

    const response = await request(app.getHttpServer())
      .get('/users/me/profile')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(response.status).toBe(200);
    expect(response.body.user.username).toBe('citizen');
    expect(response.body.aggregates.ownedPropertyCount).toBeGreaterThan(0);
    expect(response.body.aggregates.salePropertyCount).toBeGreaterThan(0);
    expect(response.body.aggregates.investmentCount).toBeGreaterThan(0);
    expect(Array.isArray(response.body.ownedProperties)).toBe(true);
    expect(Array.isArray(response.body.investments)).toBe(true);
    expect(
      response.body.ownedProperties.some(
        (property: {marketType: string; canListForSale: boolean}) =>
          property.marketType === 'sale' && property.canListForSale,
      ),
    ).toBe(true);
  });
});
