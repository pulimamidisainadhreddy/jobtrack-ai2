import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
async function getUser(){
  let user = await prisma.user.findFirst()
  if(!user) user = await prisma.user.create({ data:{ email:'sainath@berlin.de', name:'Sainath', passwordHash:'temp' } })
  return user
}
export async function GET(){
  try{ const user=await getUser(); const apps=await prisma.application.findMany({ where:{ userId:user.id }, orderBy:{ createdAt:'desc' } }); return NextResponse.json(apps) }
  catch(e:any){ return NextResponse.json({ error:e.message }, { status:500 }) }
}
export async function POST(req:Request){
  try{
    const user=await getUser(); const body=await req.json()
    const app=await prisma.application.create({ data:{ userId:user.id, companyName:body.companyName, jobTitle:body.jobTitle||'Junior Data Engineer', jobLocation:body.jobLocation||'Berlin', status:body.status||'Applied', platform:body.platform||'LinkedIn', jobUrl:body.jobUrl||null, notes:body.notes||null } })
    return NextResponse.json(app)
  } catch(e:any){ return NextResponse.json({ error:e.message }, { status:500 }) }
}
