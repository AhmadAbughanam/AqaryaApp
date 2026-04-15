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

describe('Moderation (e2e)', () => {
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

  // ─── Citizen: report a listing ───────────────────────────────────────────────

  describe('POST /reports/listings/:id', () => {
    it('citizen can report a verified listing', async () => {
      const token = await loginAndGetToken(app, 'citizen');
      const propertyId = seededData.properties.saleVerifiedId;

      const response = await request(app.getHttpServer())
        .post(`/reports/listings/${propertyId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({reason: 'spam', notes: 'Looks like a duplicated listing.'});

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.status).toBe('open');
    });

    it('citizen cannot submit a duplicate open report on the same listing', async () => {
      const token = await loginAndGetToken(app, 'citizen2');
      const propertyId = seededData.properties.saleVerifiedId;

      // citizen2 already has an open report seeded against this listing
      const response = await request(app.getHttpServer())
        .post(`/reports/listings/${propertyId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({reason: 'fraud'});

      expect(response.status).toBe(400);
    });

    it('returns 404 for a non-existent listing', async () => {
      const token = await loginAndGetToken(app, 'citizen');
      const response = await request(app.getHttpServer())
        .post('/reports/listings/nonexistent-id')
        .set('Authorization', `Bearer ${token}`)
        .send({reason: 'spam'});

      expect(response.status).toBe(404);
    });

    it('returns 401 without auth token', async () => {
      const response = await request(app.getHttpServer())
        .post(`/reports/listings/${seededData.properties.saleVerifiedId}`)
        .send({reason: 'spam'});

      expect(response.status).toBe(401);
    });

    it('admin cannot use citizen report endpoint', async () => {
      const token = await loginAndGetToken(app, 'admin');
      const response = await request(app.getHttpServer())
        .post(`/reports/listings/${seededData.properties.saleVerifiedId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({reason: 'spam'});

      expect(response.status).toBe(403);
    });
  });

  // ─── Citizen: report an opportunity ─────────────────────────────────────────

  describe('POST /reports/opportunities/:id', () => {
    it('citizen can report a published opportunity', async () => {
      const token = await loginAndGetToken(app, 'citizen');
      const opportunityId = seededData.opportunities.publishedAqaryaApprovedId;

      const response = await request(app.getHttpServer())
        .post(`/reports/opportunities/${opportunityId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({reason: 'misleading_info', notes: 'The IRR projections look inflated.'});

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.status).toBe('open');
    });

    it('returns 404 for non-existent opportunity', async () => {
      const token = await loginAndGetToken(app, 'citizen');
      const response = await request(app.getHttpServer())
        .post('/reports/opportunities/does-not-exist')
        .set('Authorization', `Bearer ${token}`)
        .send({reason: 'fraud'});

      expect(response.status).toBe(404);
    });
  });

  // ─── Admin: list reports ─────────────────────────────────────────────────────

  describe('GET /admin/moderation/reports', () => {
    it('admin can list all reports', async () => {
      const token = await loginAndGetToken(app, 'admin');
      const response = await request(app.getHttpServer())
        .get('/admin/moderation/reports')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.total).toBeGreaterThanOrEqual(1);
    });

    it('admin can filter by status', async () => {
      const token = await loginAndGetToken(app, 'admin');
      const response = await request(app.getHttpServer())
        .get('/admin/moderation/reports?status=open')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      for (const item of response.body.items as {status: string}[]) {
        expect(item.status).toBe('open');
      }
    });

    it('admin can filter by targetType', async () => {
      const token = await loginAndGetToken(app, 'admin');
      const response = await request(app.getHttpServer())
        .get('/admin/moderation/reports?targetType=listing')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      for (const item of response.body.items as {targetType: string}[]) {
        expect(item.targetType).toBe('listing');
      }
    });

    it('citizen cannot access the moderation queue', async () => {
      const token = await loginAndGetToken(app, 'citizen');
      const response = await request(app.getHttpServer())
        .get('/admin/moderation/reports')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });
  });

  // ─── Admin: report detail ─────────────────────────────────────────────────────

  describe('GET /admin/moderation/reports/:id', () => {
    it('admin can view report detail with entity summary and quality flags', async () => {
      const token = await loginAndGetToken(app, 'admin');
      const reportId = seededData.moderation.openReportId;

      const response = await request(app.getHttpServer())
        .get(`/admin/moderation/reports/${reportId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(reportId);
      expect(response.body.targetType).toBe('listing');
      expect(response.body.reporter).toBeDefined();
      expect(response.body.entitySummary).toBeDefined();
      expect(response.body.entitySummary.title).toBeDefined();
      expect(Array.isArray(response.body.qualityFlags)).toBe(true);
    });

    it('returns 404 for unknown report id', async () => {
      const token = await loginAndGetToken(app, 'admin');
      const response = await request(app.getHttpServer())
        .get('/admin/moderation/reports/nonexistent')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  // ─── Admin: moderate a report ─────────────────────────────────────────────────

  describe('POST /admin/moderation/reports/:id/action', () => {
    it('admin can mark a report under review', async () => {
      const token = await loginAndGetToken(app, 'admin');
      const reportId = seededData.moderation.openReportId;

      const response = await request(app.getHttpServer())
        .post(`/admin/moderation/reports/${reportId}/action`)
        .set('Authorization', `Bearer ${token}`)
        .send({action: 'mark_under_review'});

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('under_review');
      expect(response.body.reviewedAt).toBeDefined();
    });

    it('admin can resolve a report', async () => {
      const token = await loginAndGetToken(app, 'admin');
      const reportId = seededData.moderation.openReportId;

      const response = await request(app.getHttpServer())
        .post(`/admin/moderation/reports/${reportId}/action`)
        .set('Authorization', `Bearer ${token}`)
        .send({action: 'resolve'});

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('resolved');
    });

    it('admin can dismiss a report', async () => {
      const token = await loginAndGetToken(app, 'admin');
      const reportId = seededData.moderation.openReportId;

      const response = await request(app.getHttpServer())
        .post(`/admin/moderation/reports/${reportId}/action`)
        .set('Authorization', `Bearer ${token}`)
        .send({action: 'dismiss'});

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('dismissed');
    });

    it('cannot act on an already-resolved report', async () => {
      const token = await loginAndGetToken(app, 'admin');
      const reportId = seededData.moderation.openReportId;

      // First resolve
      await request(app.getHttpServer())
        .post(`/admin/moderation/reports/${reportId}/action`)
        .set('Authorization', `Bearer ${token}`)
        .send({action: 'resolve'});

      // Try again
      const response = await request(app.getHttpServer())
        .post(`/admin/moderation/reports/${reportId}/action`)
        .set('Authorization', `Bearer ${token}`)
        .send({action: 'dismiss'});

      expect(response.status).toBe(400);
    });

    it('citizen cannot perform moderation actions', async () => {
      const token = await loginAndGetToken(app, 'citizen');
      const response = await request(app.getHttpServer())
        .post(`/admin/moderation/reports/${seededData.moderation.openReportId}/action`)
        .set('Authorization', `Bearer ${token}`)
        .send({action: 'resolve'});

      expect(response.status).toBe(403);
    });
  });

  // ─── Dashboard includes moderation counts ─────────────────────────────────────

  describe('GET /admin/dashboard/summary — moderation counts', () => {
    it('dashboard summary includes openReports and flaggedItems', async () => {
      const token = await loginAndGetToken(app, 'admin');
      const response = await request(app.getHttpServer())
        .get('/admin/dashboard/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(typeof response.body.openReports).toBe('number');
      expect(typeof response.body.flaggedItems).toBe('number');
    });
  });

  // ─── Quality flags: returned in report detail ──────────────────────────────────

  describe('Quality flags in report detail', () => {
    it('quality flags array is present (even if empty)', async () => {
      const token = await loginAndGetToken(app, 'admin');
      const reportId = seededData.moderation.openReportId;

      const response = await request(app.getHttpServer())
        .get(`/admin/moderation/reports/${reportId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.qualityFlags)).toBe(true);
    });
  });
});
