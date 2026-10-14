import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { currentUser } from '@/lib/user';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const user = await currentUser();
    const grouped = await prisma.application.groupBy({ by: ['status'], where: { userId: user.id }, _count: { _all: true } });
    const counts: Record<string, number> = { total: 0 };
    for (const row of grouped) {
      counts[row.status] = row._count._all;
      counts.total += row._count._all;
    }
    return NextResponse.json(counts);
  } catch {
    return NextResponse.json({ error: 'Could not load stats' }, { status: 500 });
  }
}
