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

describe('Investments (e2e)', () => {
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

  it('GET /investments/pilot-properties should return verified investment projects only', async () => {
    const token = await loginAndGetToken(app, 'citizen');

    const response = await request(app.getHttpServer())
      .get('/investments/pilot-properties')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(
      response.body.every(
        (item: {
          verificationStatus: string;
          availableShares: number;
          marketType: string;
          minimumInvestmentAmount: number;
          sponsorName: string;
        }) =>
          item.verificationStatus === 'verified' &&
          item.availableShares > 0 &&
          item.marketType === 'investment' &&
          item.minimumInvestmentAmount > 0 &&
          item.sponsorName.length > 0,
      ),
    ).toBe(true);
  });

  it('POST /investments/simulate should create a richer underwriting result', async () => {
    const token = await loginAndGetToken(app, 'citizen');

    const response = await request(app.getHttpServer())
      .post('/investments/simulate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        propertyId: seededData.properties.investmentAnchoredId,
        shares: 10,
        holdingPeriodYears: 5,
        exitScenario: 'base',
        reinvestDistributions: true,
      });

    expect(response.status).toBe(201);
    expect(response.body.simulationId).toEqual(expect.any(String));
    expect(response.body.sharesOwned).toBe(10);
    expect(response.body.pricePerShare).toBe(1000);
    expect(response.body.subtotal).toBe(10000);
    expect(response.body.platformFee).toBe(150);
    expect(response.body.governmentFee).toBe(75);
    expect(response.body.totalAmount).toBe(10225);
    expect(response.body.expectedAnnualReturn).toBeGreaterThan(0);
    expect(response.body.expectedFiveYearReturn).toBeGreaterThan(0);
    expect(response.body.ownershipPercentage).toBe(1);
    expect(response.body.annualGrossIncome).toBeGreaterThan(0);
    expect(response.body.annualManagementFee).toBeGreaterThan(0);
    expect(response.body.projectedExitValue).toBeGreaterThan(response.body.subtotal);
    expect(response.body.projectedProfit).toBeGreaterThan(0);
    expect(response.body.equityMultiple).toBeGreaterThan(1);
    expect(response.body.sponsorName).toBe('Test Sponsor One');

    const updatedProperty = await prisma.property.findUnique({
      where: {id: seededData.properties.investmentAnchoredId},
    });
    expect(updatedProperty?.availableShares).toBe(590);
  });

  it('GET /investments/portfolio should return user simulation history', async () => {
    const token = await loginAndGetToken(app, 'citizen');

    const portfolioResponse = await request(app.getHttpServer())
      .get('/investments/portfolio')
      .set('Authorization', `Bearer ${token}`);

    expect(portfolioResponse.status).toBe(200);
    expect(Array.isArray(portfolioResponse.body)).toBe(true);
    expect(portfolioResponse.body.length).toBeGreaterThan(0);
    expect(portfolioResponse.body[0]).toEqual(
      expect.objectContaining({
        propertyId: seededData.properties.investmentOpenId,
        totalAmount: 5150,
        annualIncomeEstimate: expect.any(Number),
        projectedEquityMultiple: expect.any(Number),
      }),
    );
  });

  // ─── Investment Opportunity tests ────────────────────────────────────────────

  it('GET /investments/opportunities should return only published opportunities', async () => {
    const token = await loginAndGetToken(app, 'citizen');

    const response = await request(app.getHttpServer())
      .get('/investments/opportunities')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.items).toBeDefined();
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.total).toBeGreaterThanOrEqual(3);
    expect(
      response.body.items.every((item: {status: string}) => item.status === 'published'),
    ).toBe(true);
    const ids = response.body.items.map((item: {id: string}) => item.id);
    expect(ids).toContain(seededData.opportunities.publishedAqaryaApprovedId);
    expect(ids).not.toContain(seededData.opportunities.underReviewId);
    expect(ids).not.toContain(seededData.opportunities.rejectedId);
  });

  it('GET /investments/opportunities should filter by assetClass', async () => {
    const token = await loginAndGetToken(app, 'citizen');

    const response = await request(app.getHttpServer())
      .get('/investments/opportunities?assetClass=Residential')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(
      response.body.items.every(
        (item: {assetClass: string}) => item.assetClass.toLowerCase() === 'residential',
      ),
    ).toBe(true);
  });

  it('GET /investments/opportunities/:id should return full detail for a published opportunity', async () => {
    const token = await loginAndGetToken(app, 'citizen');
    const id = seededData.opportunities.publishedAqaryaApprovedId;

    const response = await request(app.getHttpServer())
      .get(`/investments/opportunities/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(id);
    expect(response.body.trustBadge).toBe('aqarya_approved');
    expect(response.body.trustScore).toBe(92);
    expect(response.body.fundingGoal).toBeGreaterThan(0);
    expect(response.body.fundedAmount).toBeGreaterThanOrEqual(0);
    expect(response.body.ownershipStructure).toBeDefined();
    expect(response.body.distributionModel).toBeDefined();
    expect(response.body.exitModel).toBeDefined();
  });

  it('GET /investments/opportunities/:id should return 404 for under_review opportunity', async () => {
    const token = await loginAndGetToken(app, 'citizen');
    const id = seededData.opportunities.underReviewId;

    const response = await request(app.getHttpServer())
      .get(`/investments/opportunities/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('POST /investments/opportunities/simulate should create simulation and decrement availableShares', async () => {
    const token = await loginAndGetToken(app, 'citizen');
    const id = seededData.opportunities.publishedAqaryaApprovedId;

    const response = await request(app.getHttpServer())
      .post('/investments/opportunities/simulate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        opportunityId: id,
        shares: 25,
        holdingPeriodYears: 5,
        exitScenario: 'base',
        reinvestDistributions: false,
      });

    expect(response.status).toBe(201);
    expect(response.body.simulationId).toEqual(expect.any(String));
    expect(response.body.opportunityId).toBe(id);
    expect(response.body.sharesOwned).toBe(25);
    expect(response.body.trustBadge).toBe('aqarya_approved');
    expect(response.body.projectedProfit).toBeGreaterThan(0);
    expect(response.body.equityMultiple).toBeGreaterThan(1);

    const updated = await prisma.investmentOpportunity.findUnique({where: {id}});
    expect(updated?.availableShares).toBe(2000 - 25);
  });

  it('POST /investments/opportunities/simulate should reject fewer than minimumShares', async () => {
    const token = await loginAndGetToken(app, 'citizen');
    const id = seededData.opportunities.publishedAqaryaApprovedId;

    const response = await request(app.getHttpServer())
      .post('/investments/opportunities/simulate')
      .set('Authorization', `Bearer ${token}`)
      .send({opportunityId: id, shares: 1});

    expect(response.status).toBe(400);
  });

  it('GET /investments/opportunities-portfolio should return opportunity simulation history', async () => {
    const token = await loginAndGetToken(app, 'citizen');
    const id = seededData.opportunities.publishedAqaryaApprovedId;

    // First simulate
    await request(app.getHttpServer())
      .post('/investments/opportunities/simulate')
      .set('Authorization', `Bearer ${token}`)
      .send({opportunityId: id, shares: 25});

    const response = await request(app.getHttpServer())
      .get('/investments/opportunities-portfolio')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        opportunityId: id,
        sharesOwned: 25,
        annualIncomeEstimate: expect.any(Number),
      }),
    );
  });

  // ─── Admin Investment Opportunity review tests ────────────────────────────────

  it('GET /admin/investment-opportunities should list all opportunities for admin', async () => {
    const token = await loginAndGetToken(app, 'admin');

    const response = await request(app.getHttpServer())
      .get('/admin/investment-opportunities')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(5);
  });

  it('GET /admin/investment-opportunities?status=under_review should filter by status', async () => {
    const token = await loginAndGetToken(app, 'admin');

    const response = await request(app.getHttpServer())
      .get('/admin/investment-opportunities?status=under_review')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(
      response.body.every((item: {status: string}) => item.status === 'under_review'),
    ).toBe(true);
  });

  it('POST /admin/investment-opportunities/:id/review should approve an under_review opportunity', async () => {
    const token = await loginAndGetToken(app, 'admin');
    const id = seededData.opportunities.underReviewId;

    const response = await request(app.getHttpServer())
      .post(`/admin/investment-opportunities/${id}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({action: 'approve', notes: 'All checks passed.'});

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('approved');

    const updated = await prisma.investmentOpportunity.findUnique({where: {id}});
    expect(updated?.status).toBe('approved');
    expect(updated?.reviewNotes).toBe('All checks passed.');
  });

  it('POST /admin/investment-opportunities/:id/review publish should calculate trustScore and badge', async () => {
    const adminToken = await loginAndGetToken(app, 'admin');
    const id = seededData.opportunities.underReviewId;

    // First approve
    await request(app.getHttpServer())
      .post(`/admin/investment-opportunities/${id}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({action: 'approve'});

    // Then publish
    const response = await request(app.getHttpServer())
      .post(`/admin/investment-opportunities/${id}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({action: 'publish'});

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('published');
    expect(response.body.trustScore).toBeGreaterThan(0);
    expect(response.body.trustBadge).toBeTruthy();
  });

  it('POST /admin/investment-opportunities/:id/review should reject an opportunity', async () => {
    const token = await loginAndGetToken(app, 'admin');
    const id = seededData.opportunities.underReviewId;

    const response = await request(app.getHttpServer())
      .post(`/admin/investment-opportunities/${id}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({action: 'reject', notes: 'Missing financial disclosures.'});

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('rejected');

    const updated = await prisma.investmentOpportunity.findUnique({where: {id}});
    expect(updated?.status).toBe('rejected');
    expect(updated?.rejectionReason).toBe('Missing financial disclosures.');
  });

  it('POST /admin/investment-opportunities should reject citizen access', async () => {
    const token = await loginAndGetToken(app, 'citizen');

    const response = await request(app.getHttpServer())
      .post('/admin/investment-opportunities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Unauthorized',
        location: 'Test',
        description: 'Test',
        assetClass: 'Residential',
        stage: 'Operational',
        sponsorName: 'Test',
        ownershipStructure: 'SPV',
        distributionModel: 'Quarterly',
        exitModel: 'Asset Sale',
        totalShares: 1000,
        pricePerShare: 100,
        minimumShares: 10,
        targetIrr: 0.14,
        targetCashYield: 0.08,
        targetHoldYears: 5,
        appreciationRate: 0.06,
        occupancyRate: 0.9,
        managementFeeRate: 0.012,
        riskBand: 'Balanced',
      });

    expect(response.status).toBe(403);
  });
});
