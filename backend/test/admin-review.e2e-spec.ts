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

describe('Admin Review Workbench (e2e)', () => {
  let app: INestApplication;
  let seededData: SeededData;
  let adminToken: string;
  let citizenToken: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
    seededData = await seedDatabase();
    adminToken = await loginAndGetToken(app, 'admin');
    citizenToken = await loginAndGetToken(app, 'citizen');
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  // ─── Property request-changes ────────────────────────────────────────────────

  it('admin can request changes on a property and notes persist', async () => {
    const propertyId = seededData.properties.salePendingId;

    const response = await request(app.getHttpServer())
      .post(`/admin/properties/${propertyId}/request-changes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({notes: 'Please resubmit with a clearer ownership proof document.'});

    expect(response.status).toBe(201);
    expect(response.body.verificationStatus).toBe('needs_changes');
    expect(response.body.reviewerNotes).toBe(
      'Please resubmit with a clearer ownership proof document.',
    );

    // Verify persisted in DB
    const property = await prisma.property.findUnique({where: {id: propertyId}});
    expect(property?.status).toBe('needs_changes');
    expect(property?.reviewerNotes).toBe(
      'Please resubmit with a clearer ownership proof document.',
    );
  });

  it('request-changes creates an audit entry', async () => {
    const propertyId = seededData.properties.salePendingId;

    await request(app.getHttpServer())
      .post(`/admin/properties/${propertyId}/request-changes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({notes: 'Missing identity document.'});

    const auditLogs = await prisma.auditLog.findMany({
      where: {propertyId, actionType: 'listing_changes_requested'},
    });
    expect(auditLogs.length).toBe(1);
    expect(auditLogs[0].metadata).toMatchObject({
      notes: 'Missing identity document.',
      newStatus: 'needs_changes',
    });
  });

  it('request-changes creates a notification for the property owner', async () => {
    const propertyId = seededData.properties.salePendingId;
    const citizenId = seededData.users.citizen.id;

    await request(app.getHttpServer())
      .post(`/admin/properties/${propertyId}/request-changes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({notes: 'Please provide additional documents.'});

    const notifications = await prisma.notification.findMany({
      where: {userId: citizenId, type: 'listing_status_change'},
    });
    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications[0].title).toBe('Changes requested on your listing');
  });

  it('verify creates an audit entry and notification', async () => {
    const propertyId = seededData.properties.salePendingId;
    const citizenId = seededData.users.citizen.id;

    await request(app.getHttpServer())
      .post(`/admin/properties/${propertyId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`);

    const auditLogs = await prisma.auditLog.findMany({
      where: {propertyId, actionType: 'listing_verified'},
    });
    expect(auditLogs.length).toBe(1);

    const notifications = await prisma.notification.findMany({
      where: {userId: citizenId, type: 'listing_status_change'},
    });
    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications[0].title).toBe('Listing verified');
  });

  it('reject creates an audit entry and notification', async () => {
    const propertyId = seededData.properties.salePendingId;
    const citizenId = seededData.users.citizen.id;

    await request(app.getHttpServer())
      .post(`/admin/properties/${propertyId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({reason: 'Ownership record does not match submitted proof.'});

    const auditLogs = await prisma.auditLog.findMany({
      where: {propertyId, actionType: 'listing_rejected'},
    });
    expect(auditLogs.length).toBe(1);

    const notifications = await prisma.notification.findMany({
      where: {userId: citizenId, type: 'listing_status_change'},
    });
    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications[0].title).toBe('Listing rejected');
  });

  it('citizen cannot call request-changes endpoint', async () => {
    const propertyId = seededData.properties.salePendingId;

    const response = await request(app.getHttpServer())
      .post(`/admin/properties/${propertyId}/request-changes`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({notes: 'This should fail.'});

    expect(response.status).toBe(403);
  });

  it('request-changes requires notes of at least 5 characters', async () => {
    const propertyId = seededData.properties.salePendingId;

    const response = await request(app.getHttpServer())
      .post(`/admin/properties/${propertyId}/request-changes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({notes: 'no'});

    expect(response.status).toBe(400);
  });

  // ─── Investment opportunity review ───────────────────────────────────────────

  it('admin can approve an investment opportunity', async () => {
    const opportunityId = seededData.opportunities.underReviewId;

    const response = await request(app.getHttpServer())
      .post(`/admin/investment-opportunities/${opportunityId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({action: 'approve', notes: 'Sponsor verified, financials reviewed.'});

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('approved');
  });

  it('admin can reject an investment opportunity', async () => {
    const opportunityId = seededData.opportunities.underReviewId;

    const response = await request(app.getHttpServer())
      .post(`/admin/investment-opportunities/${opportunityId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({action: 'reject', notes: 'Sponsor documentation incomplete.'});

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('rejected');
  });

  it('admin can publish an approved investment opportunity', async () => {
    const opportunityId = seededData.opportunities.underReviewId;

    // First approve
    await request(app.getHttpServer())
      .post(`/admin/investment-opportunities/${opportunityId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({action: 'approve'});

    // Then publish
    const response = await request(app.getHttpServer())
      .post(`/admin/investment-opportunities/${opportunityId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({action: 'publish'});

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('published');
  });

  it('admin can unpublish a published investment opportunity', async () => {
    const opportunityId = seededData.opportunities.publishedAqaryaApprovedId;

    const response = await request(app.getHttpServer())
      .post(`/admin/investment-opportunities/${opportunityId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({action: 'unpublish'});

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('approved');
  });

  it('unpublish creates an opportunity_unpublished audit entry', async () => {
    const opportunityId = seededData.opportunities.publishedAqaryaApprovedId;

    await request(app.getHttpServer())
      .post(`/admin/investment-opportunities/${opportunityId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({action: 'unpublish'});

    const auditLogs = await prisma.auditLog.findMany({
      where: {actionType: 'opportunity_unpublished'},
    });
    expect(auditLogs.length).toBe(1);
    expect((auditLogs[0].metadata as Record<string, unknown>).opportunityId).toBe(opportunityId);
  });

  it('citizen cannot call investment opportunity review endpoint', async () => {
    const opportunityId = seededData.opportunities.underReviewId;

    const response = await request(app.getHttpServer())
      .post(`/admin/investment-opportunities/${opportunityId}/review`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({action: 'approve'});

    expect(response.status).toBe(403);
  });

  it('admin can list investment opportunities by status', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/investment-opportunities?status=published')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.every((o: {status: string}) => o.status === 'published')).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('admin can get investment opportunity details', async () => {
    const opportunityId = seededData.opportunities.publishedAqaryaApprovedId;

    const response = await request(app.getHttpServer())
      .get(`/admin/investment-opportunities/${opportunityId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(opportunityId);
    expect(response.body.fundingGoal).toBeGreaterThan(0);
    expect(response.body.targetIrr).toBeGreaterThan(0);
  });

  // ─── Property detail includes reviewer notes ─────────────────────────────────

  it('property detail includes reviewerNotes when present', async () => {
    const propertyId = seededData.properties.saleNeedsChangesId;

    const response = await request(app.getHttpServer())
      .get(`/admin/properties/${propertyId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.verificationStatus).toBe('needs_changes');
    expect(typeof response.body.reviewerNotes).toBe('string');
    expect(response.body.reviewerNotes.length).toBeGreaterThan(0);
  });
});
