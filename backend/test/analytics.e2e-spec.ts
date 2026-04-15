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

describe('Analytics (e2e)', () => {
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

  // ─ Auth enforcement ──────────────────────────────────────────────────────────

  it('GET /admin/analytics → 401 without token', async () => {
    const res = await request(app.getHttpServer()).get('/admin/analytics');
    expect(res.status).toBe(401);
  });

  it('GET /admin/analytics → 403 for citizen role', async () => {
    const citizenToken = await loginAndGetToken(app, 'citizen');
    const res = await request(app.getHttpServer())
      .get('/admin/analytics')
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /admin/analytics → 200 for legacy dlsadmin token', async () => {
    const legacyToken = createLegacyAdminToken(app, 'dlsadmin');
    const res = await request(app.getHttpServer())
      .get('/admin/analytics')
      .set('Authorization', `Bearer ${legacyToken}`);
    expect(res.status).toBe(200);
  });

  it('GET /admin/analytics → 200 for legacy analyst token', async () => {
    const legacyToken = createLegacyAdminToken(app, 'analyst');
    const res = await request(app.getHttpServer())
      .get('/admin/analytics')
      .set('Authorization', `Bearer ${legacyToken}`);
    expect(res.status).toBe(200);
  });

  // ─ Response shape ────────────────────────────────────────────────────────────

  describe('response shape', () => {
    let body: Record<string, unknown>;

    beforeEach(async () => {
      const adminToken = await loginAndGetToken(app, 'admin');
      const res = await request(app.getHttpServer())
        .get('/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      body = res.body as Record<string, unknown>;
    });

    it('includes flat property fields', () => {
      expect(body).toMatchObject({
        totalProperties: expect.any(Number),
        verifiedProperties: expect.any(Number),
        pendingVerificationProperties: expect.any(Number),
        needsChangesProperties: expect.any(Number),
        rejectedProperties: expect.any(Number),
        frozenProperties: expect.any(Number),
        soldProperties: expect.any(Number),
        totalSimulations: expect.any(Number),
        totalAnchored: expect.any(Number),
        totalSimulationVolume: expect.any(Number),
      });
    });

    it('includes investments section with all pipeline statuses', () => {
      expect(body.investments).toMatchObject({
        draft: expect.any(Number),
        submitted: expect.any(Number),
        underReview: expect.any(Number),
        approved: expect.any(Number),
        published: expect.any(Number),
        rejected: expect.any(Number),
        totalSimulations: expect.any(Number),
        totalSimulationVolume: expect.any(Number),
      });
    });

    it('includes providers section with all verification statuses', () => {
      expect(body.providers).toMatchObject({
        total: expect.any(Number),
        unverified: expect.any(Number),
        underReview: expect.any(Number),
        verified: expect.any(Number),
        rejected: expect.any(Number),
        suspended: expect.any(Number),
      });
    });

    it('includes moderation section', () => {
      expect(body.moderation).toMatchObject({
        reportsOpen: expect.any(Number),
        reportsUnderReview: expect.any(Number),
        reportsResolved: expect.any(Number),
        reportsDismissed: expect.any(Number),
        unresolvedQualityFlags: expect.any(Number),
      });
    });

    it('includes support section', () => {
      expect(body.support).toMatchObject({
        totalThreads: expect.any(Number),
        totalMessages: expect.any(Number),
        recentMessages: expect.any(Number),
      });
    });

    it('includes cms section', () => {
      expect(body.cms).toMatchObject({
        activeAnnouncements: expect.any(Number),
        archivedAnnouncements: expect.any(Number),
        activeContentBlocks: expect.any(Number),
      });
    });

    it('includes totalCitizenUsers', () => {
      expect(body.totalCitizenUsers).toEqual(expect.any(Number));
    });

    it('lastAnchoredAt is a string or null', () => {
      expect(
        body.lastAnchoredAt === null || typeof body.lastAnchoredAt === 'string',
      ).toBe(true);
    });
  });

  // ─ Counts reflect seeded data ────────────────────────────────────────────────

  describe('counts match seeded data', () => {
    let body: Record<string, unknown>;

    beforeEach(async () => {
      const adminToken = await loginAndGetToken(app, 'admin');
      const res = await request(app.getHttpServer())
        .get('/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`);
      body = res.body as Record<string, unknown>;
    });

    it('totalProperties equals 9 (all seeded properties)', () => {
      expect(body.totalProperties).toBe(9);
    });

    it('pendingVerificationProperties equals 1', () => {
      expect(body.pendingVerificationProperties).toBe(1);
    });

    it('verifiedProperties counts all seeded verified properties', () => {
      // verifiedAnchored, verifiedOpen, verifiedSale, sold (verified status = sold but still verified), rentVerified
      // Seeded: verifiedAnchored (verified), verifiedOpen (verified), verifiedSale (verified),
      //         rentVerified (verified) — 4 total
      expect(body.verifiedProperties).toBe(4);
    });

    it('rejectedProperties counts seeded rejected properties', () => {
      // rejected + ownedDraft both have status 'rejected' = 2
      expect(body.rejectedProperties).toBe(2);
    });

    it('needsChangesProperties equals 1', () => {
      expect(body.needsChangesProperties).toBe(1);
    });

    it('soldProperties equals 1', () => {
      expect(body.soldProperties).toBe(1);
    });

    it('totalSimulations equals 1 (one seeded simulation)', () => {
      expect(body.totalSimulations).toBe(1);
    });

    it('totalAnchored counts anchored properties (blockchainStatus=anchored)', () => {
      // verifiedAnchored, verifiedSale, rentVerified, sold → 4 anchored
      expect(body.totalAnchored).toBe(4);
    });

    it('totalSimulationVolume is a positive number', () => {
      expect(Number(body.totalSimulationVolume)).toBeGreaterThan(0);
    });

    it('investments.submitted equals 1', () => {
      const investments = body.investments as Record<string, number>;
      expect(investments.submitted).toBe(1);
    });

    it('investments.underReview equals 1', () => {
      const investments = body.investments as Record<string, number>;
      expect(investments.underReview).toBe(1);
    });

    it('investments.published equals 3', () => {
      const investments = body.investments as Record<string, number>;
      expect(investments.published).toBe(3);
    });

    it('investments.rejected equals 1', () => {
      const investments = body.investments as Record<string, number>;
      expect(investments.rejected).toBe(1);
    });

    it('providers.total equals 2 (citizenProfile + citizen2Profile)', () => {
      const providers = body.providers as Record<string, number>;
      expect(providers.total).toBe(2);
    });

    it('providers.underReview equals 1 (citizenProfile = under_review)', () => {
      const providers = body.providers as Record<string, number>;
      expect(providers.underReview).toBe(1);
    });

    it('providers.verified equals 1 (citizen2Profile = verified)', () => {
      const providers = body.providers as Record<string, number>;
      expect(providers.verified).toBe(1);
    });

    it('moderation.reportsOpen equals 1 (one seeded open report)', () => {
      const moderation = body.moderation as Record<string, number>;
      expect(moderation.reportsOpen).toBe(1);
    });

    it('moderation.unresolvedQualityFlags equals 0 (none seeded)', () => {
      const moderation = body.moderation as Record<string, number>;
      expect(moderation.unresolvedQualityFlags).toBe(0);
    });

    it('support.totalThreads equals 2 (two seeded threads)', () => {
      const support = body.support as Record<string, number>;
      expect(support.totalThreads).toBe(2);
    });

    it('support.totalMessages equals 2 (two seeded messages)', () => {
      const support = body.support as Record<string, number>;
      expect(support.totalMessages).toBe(2);
    });

    it('cms.activeAnnouncements equals 1 (one seeded active announcement)', () => {
      const cms = body.cms as Record<string, number>;
      expect(cms.activeAnnouncements).toBe(1);
    });

    it('cms.activeContentBlocks equals 1 (one seeded active content block)', () => {
      const cms = body.cms as Record<string, number>;
      expect(cms.activeContentBlocks).toBe(1);
    });

    it('totalCitizenUsers equals 2 (citizen + citizen2)', () => {
      expect(body.totalCitizenUsers).toBe(2);
    });

    it('lastAnchoredAt is a valid ISO date string', () => {
      expect(typeof body.lastAnchoredAt).toBe('string');
      expect(() => new Date(body.lastAnchoredAt as string).toISOString()).not.toThrow();
    });
  });

  // ─ Counts update when data changes ──────────────────────────────────────────

  it('totalProperties increments when a new property is created', async () => {
    const adminToken = await loginAndGetToken(app, 'admin');

    const before = await request(app.getHttpServer())
      .get('/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);
    const countBefore = (before.body as Record<string, number>).totalProperties;

    await prisma.property.create({
      data: {
        ownerId: seededData.users.citizen.id,
        marketType: 'sale',
        title: 'Extra Test Property',
        location: 'Amman',
        ownerName: 'Test Owner',
        ownershipType: 'Freehold',
        ownershipProofType: 'title_deed',
        ownershipProofNumber: 'TD-EXTRA-01',
        description: 'Created during analytics e2e test.',
        imageUrls: [],
        status: 'pending_verification',
        propertyVerificationStatus: 'pending',
        identityVerificationStatus: 'pending',
        price: 100000,
        propertyValue: 100000,
        totalShares: 1,
        availableShares: 1,
        verificationRecordId: 'aqarya-vrf-extra-01',
        verificationPayload: {provider: 'mock-chain', network: 'testnet'},
        blockchainHash: '0xextratest',
        blockchainStatus: 'pending',
      },
    });

    const after = await request(app.getHttpServer())
      .get('/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);
    const countAfter = (after.body as Record<string, number>).totalProperties;

    expect(countAfter).toBe(countBefore + 1);
  });

  it('moderation.reportsOpen increments when a new open report is created', async () => {
    const adminToken = await loginAndGetToken(app, 'admin');

    const before = await request(app.getHttpServer())
      .get('/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);
    const openBefore = (
      (before.body as Record<string, unknown>).moderation as Record<string, number>
    ).reportsOpen;

    await prisma.moderationReport.create({
      data: {
        targetType: 'listing',
        targetId: seededData.properties.saleVerifiedId,
        reporterId: seededData.users.citizen.id,
        reason: 'misleading_info',
        status: 'open',
      },
    });

    const after = await request(app.getHttpServer())
      .get('/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);
    const openAfter = (
      (after.body as Record<string, unknown>).moderation as Record<string, number>
    ).reportsOpen;

    expect(openAfter).toBe(openBefore + 1);
  });

  it('cms.activeAnnouncements increments after creating a new active announcement', async () => {
    const adminToken = await loginAndGetToken(app, 'admin');

    const before = await request(app.getHttpServer())
      .get('/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);
    const countBefore = (
      (before.body as Record<string, unknown>).cms as Record<string, number>
    ).activeAnnouncements;

    await prisma.announcement.create({
      data: {
        title: 'Extra Announcement',
        body: 'Added mid-test.',
        type: 'system',
        audience: 'all_citizens',
        status: 'active',
        createdBy: seededData.users.admin.id,
        sentAt: new Date(),
      },
    });

    const after = await request(app.getHttpServer())
      .get('/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);
    const countAfter = (
      (after.body as Record<string, unknown>).cms as Record<string, number>
    ).activeAnnouncements;

    expect(countAfter).toBe(countBefore + 1);
  });
});
