import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { currentUser } from '@/lib/user';
import { applicationData } from '@/lib/validation';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const user = await currentUser();
    const apps = await prisma.application.findMany({ where: { userId: user.id }, orderBy: { applicationDate: 'desc' } });
    return NextResponse.json(apps);
  } catch (error) {
    console.error('Applications GET failed', error);
    return NextResponse.json({ error: 'Could not load applications. Check the database connection.' }, { status: 500 });
  }
}
export async function POST(req: Request) {
  try {
    const data = applicationData(await req.json());
    const user = await currentUser();
    const app = await prisma.application.create({ data: { ...data, userId: user.id } });
    return NextResponse.json(app, { status: 201 });
  } catch (error) {
    const isUserError = error instanceof Error && /required|Invalid status/.test(error.message);
    if (!isUserError) console.error('Applications POST failed', error);
    return NextResponse.json({ error: isUserError ? (error as Error).message : 'Could not save application.' }, { status: isUserError ? 400 : 500 });
  }
}
