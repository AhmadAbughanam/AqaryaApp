// Phase 5 e2e tests: Saved searches, notifications, and preferences/language.

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

describe('Phase 5 — Saved Searches & Notifications', () => {
  let app: INestApplication;
  let citizenToken: string;
  let citizen2Token: string;
  let seeded: SeededData;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await resetDatabase();
    seeded = await seedDatabase();
    citizenToken = await loginAndGetToken(app, 'citizen');
    citizen2Token = await loginAndGetToken(app, 'citizen2');
  });

  // ─── Saved Searches ──────────────────────────────────────────────────────────

  describe('GET /users/me/saved-searches', () => {
    it('returns 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/users/me/saved-searches')
        .expect(401);
    });

    it('returns seeded saved search for citizen', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me/saved-searches')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        id: seeded.savedSearchId,
        name: 'Test Amman Rentals',
        searchType: 'rent',
      });
      expect(res.body[0].filters).toMatchObject({city: 'Amman'});
    });

    it('returns empty list for citizen2 who has no saved searches', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me/saved-searches')
        .set('Authorization', `Bearer ${citizen2Token}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });
  });

  describe('POST /users/me/saved-searches', () => {
    it('creates a new saved search', async () => {
      const res = await request(app.getHttpServer())
        .post('/users/me/saved-searches')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          name: 'Abdali Sale Listings',
          searchType: 'sale',
          filters: {search: 'Abdali', maxPrice: 1500000},
        })
        .expect(201);

      expect(res.body).toMatchObject({
        name: 'Abdali Sale Listings',
        searchType: 'sale',
      });
      expect(res.body.filters).toMatchObject({search: 'Abdali'});
      expect(res.body.id).toBeDefined();
      expect(res.body.createdAt).toBeDefined();
    });

    it('rejects missing name', async () => {
      await request(app.getHttpServer())
        .post('/users/me/saved-searches')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({searchType: 'sale', filters: {}})
        .expect(400);
    });

    it('rejects invalid searchType', async () => {
      await request(app.getHttpServer())
        .post('/users/me/saved-searches')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({name: 'Test', searchType: 'invalid', filters: {}})
        .expect(400);
    });

    it('rejects non-object filters', async () => {
      await request(app.getHttpServer())
        .post('/users/me/saved-searches')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({name: 'Test', searchType: 'sale', filters: 'not-an-object'})
        .expect(400);
    });

    it('returns 401 without token', async () => {
      await request(app.getHttpServer())
        .post('/users/me/saved-searches')
        .send({name: 'Test', searchType: 'sale', filters: {}})
        .expect(401);
    });
  });

  describe('DELETE /users/me/saved-searches/:id', () => {
    it('deletes own saved search', async () => {
      await request(app.getHttpServer())
        .delete(`/users/me/saved-searches/${seeded.savedSearchId}`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(204);

      const list = await request(app.getHttpServer())
        .get('/users/me/saved-searches')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(list.body).toHaveLength(0);
    });

    it('returns 404 when deleting another user saved search', async () => {
      await request(app.getHttpServer())
        .delete(`/users/me/saved-searches/${seeded.savedSearchId}`)
        .set('Authorization', `Bearer ${citizen2Token}`)
        .expect(404);
    });

    it('returns 404 for non-existent id', async () => {
      await request(app.getHttpServer())
        .delete('/users/me/saved-searches/does-not-exist')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(404);
    });
  });

  // ─── Notifications ───────────────────────────────────────────────────────────

  describe('GET /users/me/notifications', () => {
    it('returns 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/users/me/notifications')
        .expect(401);
    });

    it('returns seeded notification for citizen', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me/notifications')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        id: seeded.notificationId,
        type: 'system',
        title: 'Welcome to Aqarya',
        isRead: false,
      });
    });

    it('returns empty list for citizen2 who has no notifications', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me/notifications')
        .set('Authorization', `Bearer ${citizen2Token}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });
  });

  describe('PATCH /users/me/notifications/:id/read', () => {
    it('marks own notification as read', async () => {
      await request(app.getHttpServer())
        .patch(`/users/me/notifications/${seeded.notificationId}/read`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(204);

      const updated = await prisma.notification.findUnique({
        where: {id: seeded.notificationId},
      });
      expect(updated?.isRead).toBe(true);
    });

    it('returns 404 when marking another user notification as read', async () => {
      await request(app.getHttpServer())
        .patch(`/users/me/notifications/${seeded.notificationId}/read`)
        .set('Authorization', `Bearer ${citizen2Token}`)
        .expect(404);
    });

    it('returns 404 for non-existent notification', async () => {
      await request(app.getHttpServer())
        .patch('/users/me/notifications/does-not-exist/read')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(404);
    });

    it('returns 401 without token', async () => {
      await request(app.getHttpServer())
        .patch(`/users/me/notifications/${seeded.notificationId}/read`)
        .expect(401);
    });
  });
});
