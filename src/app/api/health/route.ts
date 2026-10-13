import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    const counts = {
      users: await prisma.user.count(),
      applications: await prisma.application.count(),
      interviews: await prisma.interview.count(),
    }
    return NextResponse.json({ 
      status: 'ok', 
      database: 'connected',
      provider: 'Neon PostgreSQL',
      region: 'Frankfurt',
      counts,
      timestamp: new Date().toISOString()
    })
  } catch (e: any) {
    return NextResponse.json({ 
      status: 'error', 
      database: 'disconnected',
      error: e.message,
      hint: 'Add DATABASE_URL in Vercel Env Vars'
    }, { status: 500 })
  }
}
