import {PrismaClient, UserRole} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function bootstrapAdmin() {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!username) throw new Error('ADMIN_USERNAME is required.');
  if (!password || password.length < 12) {
    throw new Error('ADMIN_PASSWORD must contain at least 12 characters.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.user.upsert({
    where: {username},
    update: {passwordHash, role: UserRole.admin},
    create: {username, passwordHash, role: UserRole.admin},
    select: {id: true, username: true, role: true},
  });

  console.log(`Admin account ready: ${admin.username} (${admin.id})`);
}

bootstrapAdmin()
  .catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
