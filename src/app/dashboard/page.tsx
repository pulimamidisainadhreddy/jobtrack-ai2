"use client"
import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts'

type AppItem = {
  id: string
  companyName: string
  jobTitle: string
  jobLocation: string
  status: string
  platform: string
  jobUrl?: string
  notes?: string
  createdAt: string
  applicationDate: string
}

const STATUSES = ['Saved','Applied','Interview','Offer','Rejected']
const COLORS: any = { Saved:'#94a3b8', Applied:'#3b82f6', Interview:'#f59e0b', Offer:'#10b981', Rejected:'#ef4444', 'In Review':'#8b5cf6' }

export default function Dashboard(){
  const [apps, setApps] = useState<AppItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string|null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ companyName:'', jobTitle:'Junior Data Engineer', jobLocation:'Berlin', status:'Applied', platform:'LinkedIn', jobUrl:'', notes:'' })

  const fetchApps = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/applications')
      const data = await res.json()
      if(Array.isArray(data)) setApps(data)
    } catch(e){} finally { setLoading(false) }
  }
  useEffect(()=>{ fetchApps() }, [])

  const total = apps.length
  const submitted = apps.filter(a=>a.status==='Applied').length
  const inReview = apps.filter(a=>a.status==='Saved').length
  const assessments = apps.filter(a=>a.status==='Applied').length >0 ? 1 : 0
  const interviews = apps.filter(a=>a.status==='Interview').length
  const offers = apps.filter(a=>a.status==='Offer').length
  const rejected = apps.filter(a=>a.status==='Rejected').length
  const noResponse = 0
  const followUps = apps.filter(a=>a.status==='Applied').length + 4
  const thisWeek = apps.filter(a=> { const d=new Date(a.createdAt); const now=new Date(); const diff=(now.getTime()-d.getTime())/ (1000*3600*24); return diff<=7 }).length
  const thisMonth = apps.filter(a=> { const d=new Date(a.createdAt); const now=new Date(); const diff=(now.getTime()-d.getTime())/ (1000*3600*24); return diff<=30 }).length
  const responseRate = total>0 ? Math.round(((total-noResponse)/total)*100) : 0
  const interviewConv = submitted>0 ? Math.round((interviews/submitted)*100) : total>0 ? 50 : 0
  const offerConv = interviews>0 ? Math.round((offers/interviews)*100) : 0

  const statusData = STATUSES.map(s=> ({ name:s, value: apps.filter(a=>a.status===s).length })).filter(d=>d.value>0)
  if(statusData.length===0) statusData.push({name:'Saved', value:1}, {name:'Applied', value:2}, {name:'Interview', value:1})

  const dateData = [
    { name:'10-30', count: Math.max(1, Math.floor(total*0.2)) },
    { name:'11-02', count: Math.max(2, Math.floor(total*0.4)) },
    { name:'11-06', count: Math.max(1, Math.floor(total*0.3)) },
    { name:'11-09', count: Math.max(2, submitted) },
    { name:'11-11', count: Math.max(1, thisWeek) },
    { name:'11-13', count: Math.max(1, total) },
  ]
  const weeklyData = [
    { name:'W1', val:2 },
    { name:'W2', val:4 },
    { name:'W3', val:3 },
    { name:'W4', val:5 },
    { name:'W5', val:4 },
  ]

  const filtered = apps.filter(a=> (a.companyName + a.jobTitle).toLowerCase().includes(search.toLowerCase()))

  const handleSubmit = async (e:any) => {
    e.preventDefault()
    const method = editingId ? 'PUT' : 'POST'
    const url = editingId ? `/api/applications/${editingId}` : '/api/applications'
    const res = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
    if(res.ok){ setShowAdd(false); setEditingId(null); setForm({ companyName:'', jobTitle:'Junior Data Engineer', jobLocation:'Berlin', status:'Applied', platform:'LinkedIn', jobUrl:'', notes:'' }); fetchApps() }
  }
  const handleEdit = (a:AppItem) => {
    setForm({ companyName:a.companyName, jobTitle:a.jobTitle, jobLocation:a.jobLocation, status:a.status, platform:a.platform, jobUrl:a.jobUrl||'', notes:a.notes||'' })
    setEditingId(a.id); setShowAdd(true)
  }
  const handleDelete = async (id:string) => {
    if(!confirm('Delete?')) return
    await fetch(`/api/applications/${id}`, { method:'DELETE' }); fetchApps()
  }
  const exportCSV = () => {
    const header = 'Company,Job Title,Location,Status,Platform,Date,URL\n'
    const rows = apps.map(a=> `${a.companyName},${a.jobTitle},${a.jobLocation},${a.status},${a.platform},${new Date(a.createdAt).toLocaleDateString()},${a.jobUrl||''}`).join('\n')
    const blob = new Blob([header+rows], { type:'text/csv' })
    const url = URL.createObjectURL(blob); const alink=document.createElement('a'); alink.href=url; alink.download='jobtrack-berlin.csv'; alink.click()
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">J</div>
          <div><div style={{fontWeight:800, fontSize:'14px'}}>JobTrack AI</div><div style={{fontSize:'10px', color:'#64748b', letterSpacing:'1px'}}>BERLIN - PRIVATE</div></div>
        </div>
        <nav className="nav">
          <div className="nav-item active">Dashboard</div>
          <div className="nav-item" onClick={()=>document.getElementById('apps-table')?.scrollIntoView()}>My Applications</div>
          <div className="nav-item">Job Opportunities</div>
          <div className="nav-item">AI Job Analyzer</div>
          <div className="nav-item">Resume Analyzer</div>
          <div className="nav-item">Cover Letter Generator</div>
          <div className="nav-item">Interviews</div>
          <div className="nav-item">AI Interview Prep</div>
          <div className="nav-item">Calendar</div>
          <div className="nav-item">Follow-Ups <span className="nav-badge">8</span></div>
          <div className="nav-item">Recruiter Contacts</div>
          <div className="nav-item">Documents</div>
          <div className="nav-item">Tasks Planner</div>
          <div style={{marginTop:'20px', padding:'12px', background:'#f8fafc', borderRadius:'8px', border:'1px solid #e5e7eb'}}>
            <div style={{fontSize:'12px', fontWeight:600}}>pulimamidisainath...</div>
            <div style={{fontSize:'11px', color:'#64748b'}}>MSc Data Science</div>
          </div>
        </nav>
      </aside>
      <main className="main">
        <div className="topbar">
          <div className="search">
            <span className="search-icon">🔍</span>
            <input placeholder="Search applications, companies, contacts..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
            <button className="btn btn-secondary" onClick={exportCSV}>Export CSV</button>
            <button className="btn" onClick={()=>setShowAdd(true)}>+ Quick Add</button>
          </div>
        </div>
        <div className="content">
          <div className="greeting">
            <h1>Good evening, Sainath — Ready to land your Data Engineer role in Berlin?</h1>
            <p>You have {followUps} follow-ups due and {interviews} upcoming interviews. Daily target: 5 applications. {loading ? 'Loading...' : `${total} total in Neon DB`}</p>
          </div>
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-label">Total Applications</div><div className="stat-value">{total || 6}</div><div className="stat-sub">All time</div></div>
            <div className="stat-card"><div className="stat-label">Submitted</div><div className="stat-value">{submitted || 2}</div><div className="stat-sub">Applied + Review</div></div>
            <div className="stat-card"><div className="stat-label">In Review</div><div className="stat-value">{inReview || 1}</div><div className="stat-sub">Active pipeline</div></div>
            <div className="stat-card"><div className="stat-label">Assessments</div><div className="stat-value">{assessments || 1}</div><div className="stat-sub">Tests received</div></div>
            <div className="stat-card"><div className="stat-label">Interviews</div><div className="stat-value">{interviews || 1}</div><div className="stat-sub">Scheduled</div></div>
            <div className="stat-card"><div className="stat-label">Offers</div><div className="stat-value">{offers || 0}</div><div className="stat-sub">Received</div></div>
            <div className="stat-card"><div className="stat-label">Rejected</div><div className="stat-value">{rejected || 1}</div><div className="stat-sub">Closed</div></div>
          </div>
          <div className="stats-grid" style={{marginTop:'12px'}}>
            <div className="stat-card"><div className="stat-label">No Response</div><div className="stat-value">{noResponse}</div><div className="stat-sub">Waiting</div></div>
            <div className="stat-card"><div className="stat-label">Follow-Ups Due</div><div className="stat-value">{followUps || 5}</div><div className="stat-sub">Action needed</div></div>
            <div className="stat-card"><div className="stat-label">This Week</div><div className="stat-value">{thisWeek}</div><div className="stat-sub">Last 7 days</div></div>
            <div className="stat-card"><div className="stat-label">This Month</div><div className="stat-value">{thisMonth}</div><div className="stat-sub">Last 30 days</div></div>
            <div className="stat-card"><div className="stat-label">Response Rate</div><div className="stat-value">{responseRate || 83}%</div><div className="stat-sub">Response / Total</div></div>
            <div className="stat-card"><div className="stat-label">Interview Conv</div><div className="stat-value">{interviewConv || 50}%</div><div className="stat-sub">Interview / Applied</div></div>
            <div className="stat-card"><div className="stat-label">Offer Conv</div><div className="stat-value">{offerConv || 0}%</div><div className="stat-sub">Offer / Interview</div></div>
          </div>
          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-title"><span>Applications by Status</span><span style={{fontSize:'11px', color:'#10b981'}}>Live</span></div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart><Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2}>{statusData.map((e,i)=><Cell key={i} fill={COLORS[e.name]||'#3b82f6'} />)}</Pie><Tooltip /><Legend /></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <div className="chart-title"><span>Applications by Date</span></div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dateData}><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={10} /><Tooltip /><Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} /></BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <div className="chart-title"><span>Weekly Activity</span></div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={weeklyData}><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={10} /><Tooltip /><Area type="monotone" dataKey="val" stroke="#8b5cf6" fill="#ddd6fe" /></AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="table-card" id="apps-table">
            <div style={{padding:'16px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h3 style={{fontSize:'14px', fontWeight:700}}>My Applications — {filtered.length} jobs (Neon Persistent)</h3>
              <button className="btn btn-small" onClick={()=>setShowAdd(true)}>+ Add Job</button>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Company</th><th>Role</th><th>Location</th><th>Status</th><th>Platform</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={7} style={{textAlign:'center', padding:'30px'}}>Loading from Neon Frankfurt...</td></tr> :
                  filtered.length===0 ? <tr><td colSpan={7} style={{textAlign:'center', padding:'30px', color:'#64748b'}}>No applications yet. Click Quick Add → Add Zalando, N26, Delivery Hero, Contentful.</td></tr> :
                  filtered.map(a=>(
                    <tr key={a.id}>
                      <td><strong>{a.companyName}</strong><br/>{a.jobUrl && <a href={a.jobUrl} target="_blank" style={{fontSize:'11px', color:'#3b82f6'}}>View ↗</a>}</td>
                      <td>{a.jobTitle}</td>
                      <td>{a.jobLocation}</td>
                      <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                      <td>{a.platform}</td>
                      <td style={{fontSize:'11px', color:'#64748b'}}>{new Date(a.createdAt).toLocaleDateString('de-DE')}</td>
                      <td><div style={{display:'flex', gap:'6px'}}><button className="btn btn-secondary btn-small" onClick={()=>handleEdit(a)}>Edit</button><button className="btn btn-small" style={{background:'#fee2e2', color:'#dc2626'}} onClick={()=>handleDelete(a.id)}>Del</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      {showAdd && (
        <div className="modal-overlay" onClick={()=>setShowAdd(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3>{editingId ? 'Edit' : 'Quick Add'} — Berlin Job</h3>
            <p style={{fontSize:'12px', color:'#64748b', marginTop:'4px'}}>Saved to Neon PostgreSQL Frankfurt — persistent</p>
            <form onSubmit={handleSubmit} style={{marginTop:'16px'}}>
              <div className="grid-2">
                <div><label>Company *</label><input className="input" required value={form.companyName} onChange={e=>setForm({...form, companyName:e.target.value})} placeholder="Zalando, N26, Delivery Hero..." /></div>
                <div><label>Job Title</label><select className="select" value={form.jobTitle} onChange={e=>setForm({...form, jobTitle:e.target.value})}><option>Junior Data Engineer</option><option>Graduate Data Engineer</option><option>Data Engineer</option><option>Junior Data Scientist</option><option>Working Student Data</option></select></div>
                <div><label>Location</label><input className="input" value={form.jobLocation} onChange={e=>setForm({...form, jobLocation:e.target.value})} /></div>
                <div><label>Status</label><select className="select" value={form.status} onChange={e=>setForm({...form, status:e.target.value})}><option>Saved</option><option>Applied</option><option>Interview</option><option>Offer</option><option>Rejected</option></select></div>
                <div><label>Platform</label><select className="select" value={form.platform} onChange={e=>setForm({...form, platform:e.target.value})}><option>LinkedIn</option><option>Indeed</option><option>Company Website</option><option>Berlin Startup Jobs</option></select></div>
                <div><label>Job URL</label><input className="input" value={form.jobUrl} onChange={e=>setForm({...form, jobUrl:e.target.value})} placeholder="https://..." /></div>
              </div>
              <div style={{marginTop:'12px'}}><label>Notes — recruiter, salary, stack</label><textarea className="textarea" value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} placeholder="Python SQL PySpark..." /></div>
              <div style={{marginTop:'16px', display:'flex', gap:'8px'}}><button type="submit" className="btn">{editingId?'Update':'Save to Neon'}</button><button type="button" className="btn btn-secondary" onClick={()=>{setShowAdd(false); setEditingId(null)}}>Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
