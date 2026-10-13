import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
export async function GET(){
  try{
    await prisma.$queryRaw`SELECT 1`
    const c = await prisma.application.count()
    return NextResponse.json({ status:'ok', database:'connected', provider:'Neon Frankfurt', applications:c, dashboard:'/dashboard' })
  } catch(e:any){ return NextResponse.json({ status:'error', error:e.message }, {status:500}) }
}
