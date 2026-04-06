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
});
