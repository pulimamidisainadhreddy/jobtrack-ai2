import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { currentUser } from '@/lib/user';
export const dynamic = 'force-dynamic';
function startOfWeek(d = new Date()) {
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - (day === 0 ? 6 : day - 1));
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
async function load() {
  const user = await currentUser();
  let goal = await prisma.goalSettings.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id, weekStart: startOfWeek() } });
  if (goal.weekStart < startOfWeek()) {
    goal = await prisma.goalSettings.update({ where: { userId: user.id }, data: { weekStart: startOfWeek(), networkingDone: 0, followupsDone: 0, prepDone: 0 } });
  }
  return goal;
}
export async function GET() {
  try { return NextResponse.json(await load()); }
  catch (error) { console.error('Goals GET failed', error); return NextResponse.json({ error: 'Could not load goals' }, { status: 500 }); }
}
export async function PUT(req: Request) {
  try {
    const goal = await load();
    const body = await req.json();
    const fields = ['applications', 'interviews', 'networking', 'followups', 'preparation', 'networkingDone', 'followupsDone', 'prepDone'] as const;
    const update: Partial<Record<typeof fields[number], number>> = {};
    for (const field of fields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        const n = Number(body[field]);
        if (!Number.isInteger(n) || n < 0 || n > 1000) return NextResponse.json({ error: `Invalid ${field}` }, { status: 400 });
        update[field] = n;
      }
    }
    return NextResponse.json(await prisma.goalSettings.update({ where: { id: goal.id }, data: update }));
  } catch (error) { console.error('Goals PUT failed', error); return NextResponse.json({ error: 'Could not save goals' }, { status: 500 }); }
}
