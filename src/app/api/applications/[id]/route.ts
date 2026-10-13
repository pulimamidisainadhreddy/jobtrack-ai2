import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
export async function PUT(req:Request, { params }:{ params:{ id:string } }){
  try{ const body=await req.json(); const u=await prisma.application.update({ where:{ id:params.id }, data:{ companyName:body.companyName, jobTitle:body.jobTitle, jobLocation:body.jobLocation, status:body.status, platform:body.platform, jobUrl:body.jobUrl, notes:body.notes } }); return NextResponse.json(u) }
  catch(e:any){ return NextResponse.json({ error:e.message }, { status:500 }) }
}
export async function DELETE(req:Request, { params }:{ params:{ id:string } }){
  try{ await prisma.application.delete({ where:{ id:params.id } }); return NextResponse.json({ ok:true }) }
  catch(e:any){ return NextResponse.json({ error:e.message }, { status:500 }) }
}
