import {INestApplication} from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  loginAndGetToken,
  resetDatabase,
  seedDatabase,
  SeededData,
} from './test-utils';

describe('Phase 4 — Messaging, Saved Items, Preferences, Admin Dashboard', () => {
  let app: INestApplication;
  let citizenToken: string;
  let adminToken: string;
  let seeded: SeededData;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase();
    seeded = await seedDatabase();
    citizenToken = await loginAndGetToken(app, 'citizen');
    adminToken = await loginAndGetToken(app, 'admin');
  });

  // ─── Messaging ──────────────────────────────────────────────────────────────

  describe('GET /messages/threads', () => {
    it('returns threads for the authenticated citizen', async () => {
      const res = await request(app.getHttpServer())
        .get('/messages/threads')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(res.body[0]).toMatchObject({
        id: expect.any(String),
        subject: expect.any(String),
        lastMessage: expect.objectContaining({body: expect.any(String)}),
      });
    });

    it('returns 401 without token', async () => {
      await request(app.getHttpServer()).get('/messages/threads').expect(401);
    });
  });

  describe('POST /messages/threads', () => {
    it('creates a thread with an initial message for a listing', async () => {
      const res = await request(app.getHttpServer())
        .post('/messages/threads')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          subject: 'Interested in the verified sale house',
          listingId: seeded.properties.saleVerifiedId,
          initialMessage: 'Is this still available for viewing?',
        })
        .expect(201);

      expect(res.body).toMatchObject({
        id: expect.any(String),
        subject: 'Interested in the verified sale house',
        messages: expect.arrayContaining([
          expect.objectContaining({body: 'Is this still available for viewing?'}),
        ]),
      });
    });

    it('creates a thread for an investment opportunity', async () => {
      const res = await request(app.getHttpServer())
        .post('/messages/threads')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          subject: 'Questions about Abdali Residence Fund',
          opportunityId: seeded.opportunities.publishedAqaryaApprovedId,
          initialMessage: 'Can you share the full prospectus?',
        })
        .expect(201);

      expect(res.body).toMatchObject({
        opportunity: expect.objectContaining({id: seeded.opportunities.publishedAqaryaApprovedId}),
      });
    });

    it('rejects a thread with neither listing nor opportunity', async () => {
      await request(app.getHttpServer())
        .post('/messages/threads')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({subject: 'No reference', initialMessage: 'Hello'})
        .expect(400);
    });
  });

  describe('GET /messages/threads/:id', () => {
    it('returns thread detail with messages', async () => {
      const res = await request(app.getHttpServer())
        .get(`/messages/threads/${seeded.threads.listingThreadId}`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: seeded.threads.listingThreadId,
        messages: expect.arrayContaining([
          expect.objectContaining({senderRole: 'citizen'}),
        ]),
      });
    });

    it('returns 403 for a thread owned by another citizen', async () => {
      const citizen2Token = await loginAndGetToken(app, 'citizen2');
      await request(app.getHttpServer())
        .get(`/messages/threads/${seeded.threads.listingThreadId}`)
        .set('Authorization', `Bearer ${citizen2Token}`)
        .expect(403);
    });
  });

  describe('POST /messages/threads/:id/messages', () => {
    it('sends a follow-up message in a thread', async () => {
      const res = await request(app.getHttpServer())
        .post(`/messages/threads/${seeded.threads.listingThreadId}/messages`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({body: 'I am still interested.'})
        .expect(201);

      expect(res.body).toMatchObject({
        body: 'I am still interested.',
        senderRole: 'citizen',
      });
    });
  });

  // ─── Saved Items ─────────────────────────────────────────────────────────────

  describe('POST /users/me/saved', () => {
    it('saves a listing', async () => {
      const res = await request(app.getHttpServer())
        .post('/users/me/saved')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({type: 'listing', propertyId: seeded.properties.saleVerifiedId})
        .expect(201);

      expect(res.body).toMatchObject({type: 'listing', propertyId: seeded.properties.saleVerifiedId});
    });

    it('saves an opportunity', async () => {
      const res = await request(app.getHttpServer())
        .post('/users/me/saved')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({type: 'opportunity', opportunityId: seeded.opportunities.publishedAqaryaApprovedId})
        .expect(201);

      expect(res.body).toMatchObject({type: 'opportunity', opportunityId: seeded.opportunities.publishedAqaryaApprovedId});
    });

    it('is idempotent — saving the same item twice returns the existing one', async () => {
      await request(app.getHttpServer())
        .post('/users/me/saved')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({type: 'listing', propertyId: seeded.properties.saleVerifiedId})
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/users/me/saved')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({type: 'listing', propertyId: seeded.properties.saleVerifiedId})
        .expect(201);

      expect(res.body.propertyId).toBe(seeded.properties.saleVerifiedId);
    });
  });

  describe('GET /users/me/saved', () => {
    it('returns saved items for the user', async () => {
      await request(app.getHttpServer())
        .post('/users/me/saved')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({type: 'listing', propertyId: seeded.properties.saleVerifiedId});

      const res = await request(app.getHttpServer())
        .get('/users/me/saved')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0]).toMatchObject({
        type: 'listing',
        listing: expect.objectContaining({id: seeded.properties.saleVerifiedId}),
      });
    });
  });

  describe('DELETE /users/me/saved/listing/:propertyId', () => {
    it('unsaves a listing', async () => {
      await request(app.getHttpServer())
        .post('/users/me/saved')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({type: 'listing', propertyId: seeded.properties.saleVerifiedId});

      await request(app.getHttpServer())
        .delete(`/users/me/saved/listing/${seeded.properties.saleVerifiedId}`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(204);

      const res = await request(app.getHttpServer())
        .get('/users/me/saved')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(res.body.some((item: {type: string; listing?: {id: string}}) =>
        item.type === 'listing' && item.listing?.id === seeded.properties.saleVerifiedId,
      )).toBe(false);
    });
  });

  // ─── Preferences ─────────────────────────────────────────────────────────────

  describe('PUT /users/me/preferences', () => {
    it('creates preferences', async () => {
      const res = await request(app.getHttpServer())
        .put('/users/me/preferences')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({notificationsEnabled: false, language: 'ar'})
        .expect(200);

      expect(res.body).toMatchObject({notificationsEnabled: false, language: 'ar'});
    });

    it('updates existing preferences', async () => {
      await request(app.getHttpServer())
        .put('/users/me/preferences')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({language: 'ar'});

      const res = await request(app.getHttpServer())
        .put('/users/me/preferences')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({language: 'en'})
        .expect(200);

      expect(res.body.language).toBe('en');
    });
  });

  // ─── Admin Dashboard Summary ─────────────────────────────────────────────────

  describe('GET /admin/dashboard/summary', () => {
    it('returns summary counts for admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/dashboard/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        pendingListings: expect.any(Number),
        pendingOpportunities: expect.any(Number),
        openThreads: expect.any(Number),
        totalCitizenUsers: expect.any(Number),
        recentAuditHighlights: expect.any(Array),
      });
      expect(res.body.openThreads).toBeGreaterThanOrEqual(2);
    });

    it('returns 403 for citizen', async () => {
      await request(app.getHttpServer())
        .get('/admin/dashboard/summary')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(403);
    });
  });

  // ─── Profile includes savedCount ─────────────────────────────────────────────

  describe('GET /users/me/profile', () => {
    it('includes savedCount and preference in profile', async () => {
      await request(app.getHttpServer())
        .post('/users/me/saved')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({type: 'listing', propertyId: seeded.properties.saleVerifiedId});

      const res = await request(app.getHttpServer())
        .get('/users/me/profile')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(res.body.aggregates.savedCount).toBeGreaterThanOrEqual(1);
      expect(res.body.preference).toMatchObject({
        notificationsEnabled: expect.any(Boolean),
        language: expect.any(String),
      });
    });
  });
});
