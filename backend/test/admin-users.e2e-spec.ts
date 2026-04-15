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

describe('Admin User Management (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let citizenToken: string;
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
    [adminToken, citizenToken] = await Promise.all([
      loginAndGetToken(app, 'admin'),
      loginAndGetToken(app, 'citizen'),
    ]);
  });

  // ─── List users ──────────────────────────────────────────────────────────────

  it('admin can list all users', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(3); // admin + citizen + citizen2
    const firstUser = res.body[0];
    expect(firstUser).toHaveProperty('id');
    expect(firstUser).toHaveProperty('username');
    expect(firstUser).toHaveProperty('role');
    expect(firstUser).toHaveProperty('createdAt');
    expect(firstUser).toHaveProperty('counts');
  });

  it('admin can filter users by account type', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/users?accountType=owner')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((user: {providerProfile: {accountType: string} | null}) => {
      expect(user.providerProfile?.accountType).toBe('owner');
    });
  });

  it('admin can filter users by provider verification status', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/users?providerStatus=under_review')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((user: {providerProfile: {providerVerificationStatus: string} | null}) => {
      expect(user.providerProfile?.providerVerificationStatus).toBe('under_review');
    });
  });

  it('admin can filter by account type and provider status together', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/users?accountType=owner&providerStatus=under_review')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((user: {providerProfile: {accountType: string; providerVerificationStatus: string} | null}) => {
      expect(user.providerProfile?.accountType).toBe('owner');
      expect(user.providerProfile?.providerVerificationStatus).toBe('under_review');
    });
  });

  it('citizen cannot list users', async () => {
    await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${citizenToken}`)
      .expect(403);
  });

  it('unauthenticated request is rejected', async () => {
    await request(app.getHttpServer())
      .get('/admin/users')
      .expect(401);
  });

  // ─── User detail ─────────────────────────────────────────────────────────────

  it('admin can get user detail', async () => {
    const res = await request(app.getHttpServer())
      .get(`/admin/users/${seeded.users.citizen.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.id).toBe(seeded.users.citizen.id);
    expect(res.body.username).toBe('citizen');
    expect(res.body).toHaveProperty('counts');
    expect(res.body.counts).toHaveProperty('notifications');
    expect(res.body.providerProfile).toBeTruthy();
    expect(res.body.providerProfile.accountType).toBe('owner');
    expect(res.body.providerProfile.providerVerificationStatus).toBe('under_review');
  });

  it('admin user detail includes full provider profile fields', async () => {
    const res = await request(app.getHttpServer())
      .get(`/admin/users/${seeded.users.citizen.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const profile = res.body.providerProfile;
    expect(profile).toHaveProperty('businessName');
    expect(profile).toHaveProperty('contactPerson');
    expect(profile).toHaveProperty('phone');
    expect(profile).toHaveProperty('email');
    expect(profile).toHaveProperty('registrationNumber');
    expect(profile).toHaveProperty('adminNotes');
    expect(profile).toHaveProperty('rejectionReason');
    expect(profile).toHaveProperty('submittedAt');
  });

  it('user detail with no provider profile returns null providerProfile', async () => {
    const res = await request(app.getHttpServer())
      .get(`/admin/users/${seeded.users.admin.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.providerProfile).toBeNull();
  });

  it('returns 404 for unknown user id', async () => {
    await request(app.getHttpServer())
      .get('/admin/users/nonexistent-id')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });

  it('citizen cannot get user detail', async () => {
    await request(app.getHttpServer())
      .get(`/admin/users/${seeded.users.citizen.id}`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .expect(403);
  });

  // ─── Provider review actions ─────────────────────────────────────────────────

  it('admin can mark provider under review', async () => {
    // citizen2 is verified → move to under_review
    const res = await request(app.getHttpServer())
      .post(`/admin/users/${seeded.users.citizen2.id}/provider-review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({action: 'under_review'})
      .expect(201);

    expect(res.body.providerProfile.providerVerificationStatus).toBe('under_review');
  });

  it('admin can verify a provider', async () => {
    // citizen is under_review → verify
    const res = await request(app.getHttpServer())
      .post(`/admin/users/${seeded.users.citizen.id}/provider-review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({action: 'verify', notes: 'All documents valid.'})
      .expect(201);

    expect(res.body.providerProfile.providerVerificationStatus).toBe('verified');
  });

  it('verify creates an audit entry', async () => {
    await request(app.getHttpServer())
      .post(`/admin/users/${seeded.users.citizen.id}/provider-review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({action: 'verify'})
      .expect(201);

    const auditEntry = await prisma.auditLog.findFirst({
      where: {actionType: 'provider_verified'},
    });
    expect(auditEntry).toBeTruthy();
    expect((auditEntry?.metadata as {userId?: string}).userId).toBe(seeded.users.citizen.id);
  });

  it('verify creates a notification for the user', async () => {
    await request(app.getHttpServer())
      .post(`/admin/users/${seeded.users.citizen.id}/provider-review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({action: 'verify'})
      .expect(201);

    const notification = await prisma.notification.findFirst({
      where: {userId: seeded.users.citizen.id, type: 'provider_status_change'},
    });
    expect(notification).toBeTruthy();
    expect(notification?.title).toContain('verified');
  });

  it('admin can reject a provider', async () => {
    const res = await request(app.getHttpServer())
      .post(`/admin/users/${seeded.users.citizen.id}/provider-review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({action: 'reject', notes: 'Registration number does not match public records.'})
      .expect(201);

    expect(res.body.providerProfile.providerVerificationStatus).toBe('rejected');
  });

  it('reject requires notes', async () => {
    await request(app.getHttpServer())
      .post(`/admin/users/${seeded.users.citizen.id}/provider-review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({action: 'reject'})
      .expect(400);
  });

  it('reject creates an audit entry', async () => {
    await request(app.getHttpServer())
      .post(`/admin/users/${seeded.users.citizen.id}/provider-review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({action: 'reject', notes: 'Missing license.'})
      .expect(201);

    const auditEntry = await prisma.auditLog.findFirst({
      where: {actionType: 'provider_rejected'},
    });
    expect(auditEntry).toBeTruthy();
  });

  it('reject creates a notification for the user', async () => {
    const reason = 'Missing valid license documentation.';
    await request(app.getHttpServer())
      .post(`/admin/users/${seeded.users.citizen.id}/provider-review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({action: 'reject', notes: reason})
      .expect(201);

    const notification = await prisma.notification.findFirst({
      where: {userId: seeded.users.citizen.id, type: 'provider_status_change'},
    });
    expect(notification).toBeTruthy();
    expect(notification?.body).toContain(reason);
  });

  it('admin can suspend a provider', async () => {
    const res = await request(app.getHttpServer())
      .post(`/admin/users/${seeded.users.citizen2.id}/provider-review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({action: 'suspend', notes: 'Compliance issue flagged.'})
      .expect(201);

    expect(res.body.providerProfile.providerVerificationStatus).toBe('suspended');
  });

  it('suspend creates a notification for the user', async () => {
    await request(app.getHttpServer())
      .post(`/admin/users/${seeded.users.citizen2.id}/provider-review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({action: 'suspend'})
      .expect(201);

    const notification = await prisma.notification.findFirst({
      where: {userId: seeded.users.citizen2.id, type: 'provider_status_change'},
    });
    expect(notification).toBeTruthy();
    expect(notification?.title).toContain('suspended');
  });

  it('admin can update notes without changing status', async () => {
    const originalStatus = 'under_review';
    const res = await request(app.getHttpServer())
      .post(`/admin/users/${seeded.users.citizen.id}/provider-review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({action: 'update_notes', notes: 'Awaiting updated registration scan.'})
      .expect(201);

    expect(res.body.providerProfile.providerVerificationStatus).toBe(originalStatus);
    expect(res.body.providerProfile.adminNotes).toBe('Awaiting updated registration scan.');
  });

  it('returns 404 when reviewing provider for unknown user', async () => {
    await request(app.getHttpServer())
      .post('/admin/users/nonexistent/provider-review')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({action: 'verify'})
      .expect(404);
  });

  it('returns 400 when user has no provider profile', async () => {
    // admin user has no provider profile
    await request(app.getHttpServer())
      .post(`/admin/users/${seeded.users.admin.id}/provider-review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({action: 'verify'})
      .expect(400);
  });

  it('citizen cannot call provider-review endpoint', async () => {
    await request(app.getHttpServer())
      .post(`/admin/users/${seeded.users.citizen.id}/provider-review`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({action: 'verify'})
      .expect(403);
  });

  it('rejects invalid action values', async () => {
    await request(app.getHttpServer())
      .post(`/admin/users/${seeded.users.citizen.id}/provider-review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({action: 'invalid_action'})
      .expect(400);
  });

  // ─── Dashboard summary ───────────────────────────────────────────────────────

  it('dashboard summary includes pendingProviders count', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('pendingProviders');
    expect(typeof res.body.pendingProviders).toBe('number');
    // citizen has under_review profile in seed
    expect(res.body.pendingProviders).toBeGreaterThanOrEqual(1);
  });
});
