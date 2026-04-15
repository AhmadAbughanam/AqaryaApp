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

describe('CMS (e2e)', () => {
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

  // ─── Admin: create announcement ───────────────────────────────────────────────

  describe('POST /admin/announcements', () => {
    it('admin can create a system announcement targeting all citizens', async () => {
      const token = await loginAndGetToken(app, 'admin');

      const response = await request(app.getHttpServer())
        .post('/admin/announcements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Platform Update Available',
          body: 'A new platform update is available. Please refresh the app.',
          type: 'system',
          audience: 'all_citizens',
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.title).toBe('Platform Update Available');
      expect(response.body.audience).toBe('all_citizens');
      expect(response.body.status).toBe('active');
    });

    it('admin can target a single user by id', async () => {
      const token = await loginAndGetToken(app, 'admin');
      const targetUserId = seededData.users.citizen.id;

      const response = await request(app.getHttpServer())
        .post('/admin/announcements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Account Review Notice',
          body: 'Your account is under review.',
          type: 'system',
          audience: 'one_user',
          targetUserId,
        });

      expect(response.status).toBe(201);
      expect(response.body.targetUserId).toBe(targetUserId);
    });

    it('creating all_citizens announcement dispatches notifications to citizen users', async () => {
      const token = await loginAndGetToken(app, 'admin');

      await request(app.getHttpServer())
        .post('/admin/announcements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Important Notice',
          body: 'Please review the updated terms.',
          type: 'system',
          audience: 'all_citizens',
        });

      // citizen user should have received a notification
      const notifs = await prisma.notification.findMany({
        where: {userId: seededData.users.citizen.id, title: 'Important Notice'},
      });
      expect(notifs.length).toBeGreaterThanOrEqual(1);
    });

    it('one_user audience requires targetUserId', async () => {
      const token = await loginAndGetToken(app, 'admin');

      const response = await request(app.getHttpServer())
        .post('/admin/announcements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Notice',
          body: 'Body text here.',
          type: 'system',
          audience: 'one_user',
          // targetUserId intentionally omitted
        });

      expect(response.status).toBe(400);
    });

    it('one_user with non-existent targetUserId returns 404', async () => {
      const token = await loginAndGetToken(app, 'admin');

      const response = await request(app.getHttpServer())
        .post('/admin/announcements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Notice',
          body: 'Body text here.',
          type: 'system',
          audience: 'one_user',
          targetUserId: 'nonexistent-user-id',
        });

      expect(response.status).toBe(404);
    });

    it('citizen cannot create announcements', async () => {
      const token = await loginAndGetToken(app, 'citizen');

      const response = await request(app.getHttpServer())
        .post('/admin/announcements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Notice',
          body: 'Body text.',
          type: 'system',
          audience: 'all_citizens',
        });

      expect(response.status).toBe(403);
    });

    it('returns 401 without auth', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/announcements')
        .send({title: 'Notice', body: 'Body', type: 'system', audience: 'all_citizens'});

      expect(response.status).toBe(401);
    });
  });

  // ─── Admin: list announcements ────────────────────────────────────────────────

  describe('GET /admin/announcements', () => {
    it('admin can list announcements with pagination', async () => {
      const token = await loginAndGetToken(app, 'admin');

      const response = await request(app.getHttpServer())
        .get('/admin/announcements')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(typeof response.body.total).toBe('number');
      expect(response.body.total).toBeGreaterThanOrEqual(1);
    });

    it('admin can filter by status=active', async () => {
      const token = await loginAndGetToken(app, 'admin');

      const response = await request(app.getHttpServer())
        .get('/admin/announcements?status=active')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      for (const item of response.body.items as {status: string}[]) {
        expect(item.status).toBe('active');
      }
    });

    it('citizen cannot list admin announcements', async () => {
      const token = await loginAndGetToken(app, 'citizen');

      const response = await request(app.getHttpServer())
        .get('/admin/announcements')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });
  });

  // ─── Admin: archive announcement ─────────────────────────────────────────────

  describe('PATCH /admin/announcements/:id/archive', () => {
    it('admin can archive an active announcement', async () => {
      const token = await loginAndGetToken(app, 'admin');
      const announcementId = seededData.cms.announcementId;

      const response = await request(app.getHttpServer())
        .patch(`/admin/announcements/${announcementId}/archive`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('archived');
      expect(response.body.archivedAt).toBeDefined();
    });

    it('archiving an already-archived announcement is idempotent', async () => {
      const token = await loginAndGetToken(app, 'admin');
      const announcementId = seededData.cms.announcementId;

      // Archive once
      await request(app.getHttpServer())
        .patch(`/admin/announcements/${announcementId}/archive`)
        .set('Authorization', `Bearer ${token}`);

      // Archive again — should still return 200
      const response = await request(app.getHttpServer())
        .patch(`/admin/announcements/${announcementId}/archive`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('archived');
    });

    it('returns 404 for unknown announcement id', async () => {
      const token = await loginAndGetToken(app, 'admin');

      const response = await request(app.getHttpServer())
        .patch('/admin/announcements/nonexistent/archive')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('citizen cannot archive announcements', async () => {
      const token = await loginAndGetToken(app, 'citizen');

      const response = await request(app.getHttpServer())
        .patch(`/admin/announcements/${seededData.cms.announcementId}/archive`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });
  });

  // ─── Citizen notification feed includes admin-created notifications ───────────

  describe('Citizen notification feed', () => {
    it('citizen receives system notification created via announcement', async () => {
      const adminToken = await loginAndGetToken(app, 'admin');
      const citizenToken = await loginAndGetToken(app, 'citizen');

      // Admin creates announcement for all citizens
      await request(app.getHttpServer())
        .post('/admin/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Platform Feature Update',
          body: 'New filtering options are now available in the listings search.',
          type: 'system',
          audience: 'all_citizens',
        });

      // Citizen fetches their notifications
      const response = await request(app.getHttpServer())
        .get('/users/me/notifications')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(response.status).toBe(200);
      const notifs = response.body as {title: string}[];
      expect(notifs.some(n => n.title === 'Platform Feature Update')).toBe(true);
    });
  });

  // ─── Admin: content blocks ────────────────────────────────────────────────────

  describe('PUT /admin/content/:key', () => {
    it('admin can create a content block', async () => {
      const token = await loginAndGetToken(app, 'admin');

      const response = await request(app.getHttpServer())
        .put('/admin/content/help_intro')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'How Aqarya Works',
          body: 'Aqarya is Jordan\'s trusted property platform.',
          icon: '🏠',
          order: 0,
          active: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.key).toBe('help_intro');
      expect(response.body.title).toBe('How Aqarya Works');
      expect(response.body.active).toBe(true);
    });

    it('admin can update an existing content block', async () => {
      const token = await loginAndGetToken(app, 'admin');
      const key = seededData.cms.contentBlockKey;

      const response = await request(app.getHttpServer())
        .put(`/admin/content/${key}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Title',
          body: 'Updated body content for this block.',
          order: 1,
          active: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Title');
      expect(response.body.key).toBe(key);
    });

    it('admin can deactivate a content block', async () => {
      const token = await loginAndGetToken(app, 'admin');
      const key = seededData.cms.contentBlockKey;

      const response = await request(app.getHttpServer())
        .put(`/admin/content/${key}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Inactive Block',
          body: 'This block is deactivated.',
          active: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.active).toBe(false);
    });

    it('citizen cannot manage content blocks', async () => {
      const token = await loginAndGetToken(app, 'citizen');

      const response = await request(app.getHttpServer())
        .put('/admin/content/help_intro')
        .set('Authorization', `Bearer ${token}`)
        .send({title: 'Title', body: 'Body text here.'});

      expect(response.status).toBe(403);
    });
  });

  describe('GET /admin/content', () => {
    it('admin can list all content blocks', async () => {
      const token = await loginAndGetToken(app, 'admin');

      const response = await request(app.getHttpServer())
        .get('/admin/content')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it('citizen cannot access admin content list', async () => {
      const token = await loginAndGetToken(app, 'citizen');

      const response = await request(app.getHttpServer())
        .get('/admin/content')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });
  });

  // ─── Citizen: active content blocks ──────────────────────────────────────────

  describe('GET /content/active', () => {
    it('citizen can read active content blocks', async () => {
      const token = await loginAndGetToken(app, 'citizen');

      const response = await request(app.getHttpServer())
        .get('/content/active')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // All returned blocks must be active
      for (const block of response.body as {active: boolean}[]) {
        expect(block.active).toBe(true);
      }
    });

    it('inactive blocks are excluded from citizen content', async () => {
      const adminToken = await loginAndGetToken(app, 'admin');
      const citizenToken = await loginAndGetToken(app, 'citizen');
      const key = seededData.cms.contentBlockKey;

      // Deactivate the seeded block
      await request(app.getHttpServer())
        .put(`/admin/content/${key}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({title: 'Hidden', body: 'Not shown to citizens.', active: false});

      // Citizen should not see it
      const response = await request(app.getHttpServer())
        .get('/content/active')
        .set('Authorization', `Bearer ${citizenToken}`);

      const keys = (response.body as {key: string}[]).map(b => b.key);
      expect(keys).not.toContain(key);
    });

    it('returns 401 without auth', async () => {
      const response = await request(app.getHttpServer()).get('/content/active');
      expect(response.status).toBe(401);
    });

    it('admin cannot use citizen content endpoint', async () => {
      const token = await loginAndGetToken(app, 'admin');

      const response = await request(app.getHttpServer())
        .get('/content/active')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });
  });

  // ─── Dashboard summary includes activeAnnouncements ──────────────────────────

  describe('GET /admin/dashboard/summary — CMS counts', () => {
    it('dashboard summary includes activeAnnouncements', async () => {
      const token = await loginAndGetToken(app, 'admin');

      const response = await request(app.getHttpServer())
        .get('/admin/dashboard/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(typeof response.body.activeAnnouncements).toBe('number');
      expect(response.body.activeAnnouncements).toBeGreaterThanOrEqual(1);
    });
  });
});
