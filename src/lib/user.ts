import { prisma } from './db';

// Keeps legacy records: uses the same single-user lookup as the original project.
export async function currentUser() {
  let user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!user) {
    user = await prisma.user.create({
      data: { email: 'jobtrack@local.app', name: 'Sainadh', passwordHash: 'session-only' }
    });
  }
  return user;
}
