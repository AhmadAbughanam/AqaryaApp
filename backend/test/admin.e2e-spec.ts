import {INestApplication} from '@nestjs/common';
import request from 'supertest';
import {
  createLegacyAdminToken,
  createTestApp,
  loginAndGetToken,
  prisma,
  resetDatabase,
  seedDatabase,
  SeededData,
} from './test-utils';

describe('Admin (e2e)', () => {
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

  it('should execute verify -> anchor -> freeze lifecycle as admin', async () => {
    const adminToken = await loginAndGetToken(app, 'admin');
    const propertyId = seededData.properties.salePendingId;

    const verifyResponse = await request(app.getHttpServer())
      .post(`/admin/properties/${propertyId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(verifyResponse.status).toBe(201);
    expect(verifyResponse.body.id).toBe(propertyId);
    expect(verifyResponse.body.verificationStatus).toBe('verified');

    const anchorResponse = await request(app.getHttpServer())
      .post(`/admin/properties/${propertyId}/anchor`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(anchorResponse.status).toBe(201);
    expect(anchorResponse.body.property.id).toBe(propertyId);
    expect(anchorResponse.body.anchor.blockchainHash).toMatch(/^0x[a-z0-9]+$/);
    expect(anchorResponse.body.anchor.blockchainTransactionId).toMatch(
      /^0x[a-f0-9]{64}$/,
    );

    const freezeResponse = await request(app.getHttpServer())
      .post(`/admin/properties/${propertyId}/freeze`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(freezeResponse.status).toBe(201);
    expect(freezeResponse.body.id).toBe(propertyId);
    expect(freezeResponse.body.verificationStatus).toBe('frozen');
  });

  it('should allow legacy admin role tokens by mapping them to admin', async () => {
    const legacyToken = createLegacyAdminToken(app, 'dlsadmin');

    const response = await request(app.getHttpServer())
      .get('/admin/analytics')
      .set('Authorization', `Bearer ${legacyToken}`);

    expect(response.status).toBe(200);
    expect(response.body.totalProperties).toBeGreaterThan(0);
  });

  it('should return the full property detail profile for admins', async () => {
    const adminToken = await loginAndGetToken(app, 'admin');

    const response = await request(app.getHttpServer())
      .get(`/admin/properties/${seededData.properties.investmentAnchoredId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(seededData.properties.investmentAnchoredId);
    expect(response.body.seller).toEqual(
      expect.objectContaining({
        username: seededData.users.citizen.username,
      }),
    );
    expect(response.body.verificationRecordId).toBe('aqarya-vrf-seeded-verified-hash');
    expect(response.body.verificationPayload).toEqual(expect.any(Object));
    expect(Array.isArray(response.body.auditEvents)).toBe(true);
  });

  it('should block admin endpoints for citizen role', async () => {
    const citizenToken = await loginAndGetToken(app, 'citizen');

    const response = await request(app.getHttpServer())
      .post(`/admin/properties/${seededData.properties.salePendingId}/verify`)
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(response.status).toBe(403);
  });
});
