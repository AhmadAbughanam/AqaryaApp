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

describe('Properties (e2e)', () => {
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

  it('POST /properties/sell-listings should create a pending listing and admin can verify it', async () => {
    const citizenToken = await loginAndGetToken(app, 'citizen');
    const adminToken = await loginAndGetToken(app, 'admin');

    const createResponse = await request(app.getHttpServer())
      .post('/properties/sell-listings')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        sourcePropertyId: seededData.properties.saleOwnedDraftId,
        title: 'New Citizen Listing',
        location: 'Jerash',
        ownerName: 'Citizen Seller',
        ownershipType: 'Freehold',
        ownershipProofType: 'title_deed',
        ownershipProofNumber: 'TD-NEW-1',
        description: 'A newly listed residential asset with complete ownership proof.',
        imageUrls: ['https://example.com/new-listing.jpg'],
        price: 420000,
        propertyValue: 400000,
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.verificationStatus).toBe('pending_verification');
    expect(createResponse.body.marketType).toBe('sale');
    expect(createResponse.body.verificationTimestamp).toEqual(expect.any(String));

    const listingId = createResponse.body.id as string;
    const createdProperty = await prisma.property.findUnique({where: {id: listingId}});
    expect(createdProperty?.verificationRecordId).toMatch(/^aqarya-vrf-/);
    expect(createdProperty?.verificationPayload).toEqual(expect.any(Object));
    expect(createdProperty?.blockchainHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(createdProperty?.totalShares).toBe(1);
    expect(createdProperty?.marketType).toBe('sale');

    const publicPendingResponse = await request(app.getHttpServer())
      .get('/properties')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(publicPendingResponse.status).toBe(200);
    expect(
      publicPendingResponse.body.items.some(
        (item: {id: string}) => item.id === listingId,
      ),
    ).toBe(false);

    const verifyResponse = await request(app.getHttpServer())
      .post(`/admin/properties/${listingId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(verifyResponse.status).toBe(201);
    expect(verifyResponse.body.verificationStatus).toBe('verified');
    expect(verifyResponse.body.propertyVerificationStatus).toBe('verified');
    expect(verifyResponse.body.identityVerificationStatus).toBe('verified');

    const publicVerifiedResponse = await request(app.getHttpServer())
      .get('/properties')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(publicVerifiedResponse.status).toBe(200);
    expect(
      publicVerifiedResponse.body.items.some(
        (item: {id: string}) => item.id === listingId,
      ),
    ).toBe(true);
  });

  it('GET /properties/:id should return property details and audit trail for verified listings', async () => {
    const token = await loginAndGetToken(app, 'citizen');

    const response = await request(app.getHttpServer())
      .get(`/properties/${seededData.properties.investmentAnchoredId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(seededData.properties.investmentAnchoredId);
    expect(response.body.title).toBe('Verified Hash Project');
    expect(response.body.marketType).toBe('investment');
    expect(response.body.blockchainHash).toBe('0xabc123');
    expect(response.body.blockchainTransactionId).toBe('0xtx123');
    expect(response.body.verificationRecordId).toBe('aqarya-vrf-seeded-verified-hash');
    expect(Array.isArray(response.body.auditTrail)).toBe(true);
  });

  it('POST /properties/:id/buy should transfer a verified sale listing to the buyer', async () => {
    const buyerToken = await loginAndGetToken(app, 'citizen2');

    const response = await request(app.getHttpServer())
      .post(`/properties/${seededData.properties.saleVerifiedId}/buy`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(response.status).toBe(201);
    expect(response.body.id).toBe(seededData.properties.saleVerifiedId);
    expect(response.body.marketType).toBe('sale');
    expect(response.body.verificationStatus).toBe('sold');

    const purchasedProperty = await prisma.property.findUnique({
      where: {id: seededData.properties.saleVerifiedId},
    });

    expect(purchasedProperty?.ownerId).toBe(seededData.users.citizen2.id);
    expect(purchasedProperty?.status).toBe('sold');
    expect(purchasedProperty?.availableShares).toBe(0);
  });
});
