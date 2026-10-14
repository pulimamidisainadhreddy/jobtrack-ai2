import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { currentUser } from '@/lib/user';
import { applicationData } from '@/lib/validation';

type Context = { params: Promise<{ id: string }> };
export async function PUT(req: Request, { params }: Context) {
  try {
    const { id } = await params;
    const user = await currentUser();
    const record = await prisma.application.findFirst({ where: { id, userId: user.id } });
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const data = applicationData(await req.json());
    return NextResponse.json(await prisma.application.update({ where: { id: record.id }, data }));
  } catch (error) {
    const isUserError = error instanceof Error && /required|Invalid status/.test(error.message);
    if (!isUserError) console.error('Applications PUT failed', error);
    return NextResponse.json({ error: isUserError ? (error as Error).message : 'Could not update application.' }, { status: isUserError ? 400 : 500 });
  }
}
export async function DELETE(_req: Request, { params }: Context) {
  try {
    const { id } = await params;
    const user = await currentUser();
    const record = await prisma.application.findFirst({ where: { id, userId: user.id } });
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.application.delete({ where: { id: record.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Applications DELETE failed', error);
    return NextResponse.json({ error: 'Could not delete application.' }, { status: 500 });
  }
}
