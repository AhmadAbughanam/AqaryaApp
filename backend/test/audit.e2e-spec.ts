import {INestApplication} from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  loginAndGetToken,
  prisma,
  resetDatabase,
  seedDatabase,
  SeededData,
} from './test-utils';

describe('Audit Logs (e2e)', () => {
  let app: INestApplication;
  let seededData: SeededData;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
    seededData = await seedDatabase();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('should create listing lifecycle audit entries and return paginated logs', async () => {
    const adminToken = await loginAndGetToken(app, 'admin');
    const propertyId = seededData.properties.salePendingId;

    await request(app.getHttpServer())
      .post(`/admin/properties/${propertyId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`);

    await request(app.getHttpServer())
      .post(`/admin/properties/${propertyId}/anchor`)
      .set('Authorization', `Bearer ${adminToken}`);

    await request(app.getHttpServer())
      .post(`/admin/properties/${propertyId}/freeze`)
      .set('Authorization', `Bearer ${adminToken}`);

    const logsResponse = await request(app.getHttpServer())
      .get('/admin/audit-logs?page=1&limit=20')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(logsResponse.status).toBe(200);
    expect(logsResponse.body.items.length).toBeGreaterThanOrEqual(3);

    const actionTypes = logsResponse.body.items.map(
      (log: {actionType: string}) => log.actionType,
    );
    expect(actionTypes).toEqual(
      expect.arrayContaining(['listing_verified', 'anchor', 'listing_frozen']),
    );
  });

  it('should return 401 for audit logs request without JWT', async () => {
    const response = await request(app.getHttpServer()).get('/admin/audit-logs');
    expect(response.status).toBe(401);
  });
});
