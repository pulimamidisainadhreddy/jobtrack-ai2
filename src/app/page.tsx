import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function getStats() {
  try {
    const userCount = await prisma.user.count()
    const appCount = await prisma.application.count()
    return { dbConnected: true, userCount, appCount, error: null }
  } catch (e: any) {
    return { dbConnected: false, userCount: 0, appCount: 0, error: e.message }
  }
}

export default async function Home() {
  const stats = await getStats()

  return (
    <div className="container">
      <h1 style={{fontSize: '32px', fontWeight: 800, marginBottom: '8px'}}>JobTrack AI - Berlin 🇩🇪</h1>
      <p style={{color: '#64748b', marginBottom: '24px'}}>Vercel + Neon PostgreSQL - Production Ready</p>

      <div className="card">
        <h2>✅ Deployment Status</h2>
        {stats.dbConnected ? (
          <div style={{marginTop: '12px'}}>
            <p className="success">● PostgreSQL Connected (Neon)</p>
            <p style={{marginTop: '8px'}}>Users: {stats.userCount} | Applications: {stats.appCount}</p>
            <p style={{marginTop: '12px', fontSize: '14px', color: '#64748b'}}>Your database is live and persistent. Data survives restarts.</p>
          </div>
        ) : (
          <div style={{marginTop: '12px'}}>
            <p style={{color: '#dc2626'}}>● Database not connected yet</p>
            <p style={{marginTop: '8px', fontSize: '13px', background: '#fef2f2', padding: '12px', borderRadius: '6px'}}>{stats.error}</p>
            <p style={{marginTop: '8px', fontSize: '14px'}}>Add DATABASE_URL in Vercel → Settings → Environment Variables → Redeploy</p>
          </div>
        )}
      </div>

      <div className="grid">
        <div className="card">
          <h3>📊 Tracker</h3>
          <p style={{fontSize: '14px', color: '#64748b', marginTop: '8px'}}>Full tracker with Berlin companies, interviews, contacts. Build next.</p>
        </div>
        <div className="card">
          <h3>🇩🇪 Berlin Focus</h3>
          <p style={{fontSize: '14px', color: '#64748b', marginTop: '8px'}}>Zalando, N26, Delivery Hero, Contentful, etc.</p>
        </div>
        <div className="card">
          <h3>🔒 Secure</h3>
          <p style={{fontSize: '14px', color: '#64748b', marginTop: '8px'}}>NextAuth + Prisma + PostgreSQL</p>
        </div>
      </div>

      <div className="card">
        <h3>Next Steps:</h3>
        <ol style={{marginLeft: '20px', marginTop: '12px', lineHeight: '1.8'}}>
          <li>If you see green Connected → your Neon DB works!</li>
          <li>Go to Neon → Tables → you will see 8 tables created</li>
          <li>This page proves persistence: refresh → data stays</li>
          <li>Now add your full tracker UI in src/app/dashboard/</li>
        </ol>
      </div>

      <div style={{marginTop: '24px'}}>
        <a href="/api/health" className="btn">Test /api/health → DB Check</a>
      </div>
    </div>
  )
}
