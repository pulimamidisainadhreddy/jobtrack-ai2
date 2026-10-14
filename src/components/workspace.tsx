'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ChangeEvent, type ComponentType, type CSSProperties } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, BriefcaseBusiness, Columns3, Sparkles, CalendarClock, Target, Database,
  Plus, Search, Menu, X, Moon, Sun, Download, Upload, Pencil, Trash2, ExternalLink,
  MapPin, AlertCircle, ArrowRight, ChevronLeft, ChevronRight, CheckCircle2, TrendingUp,
  Copy, LogOut, RefreshCw, Filter, Save, Check, BarChart3, CalendarDays, Mail, ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, BarChart, Bar
} from 'recharts';
import { GERMAN_LEVELS, PLATFORMS, STATUSES, WORK_TYPES } from '@/lib/validation';
import { scoreDescription } from '@/lib/scoring';
import { parseCSV } from '@/lib/csv';

type Application = {
  id: string;
  companyName: string; jobTitle: string; jobLocation: string; status: string; platform: string;
  jobUrl: string | null; jobDescription: string | null; notes: string | null;
  applicationDate: string; createdAt: string; updatedAt: string;
  salaryMin: number | null; salaryMax: number | null;
  workArrangement: string | null; germanLevel: string | null;
  recruiterName: string | null; recruiterContact: string | null; cvVersion: string | null;
  followUpDate: string | null; interviewDates: string[];
};
type FormData = {
  companyName: string; jobTitle: string; jobLocation: string; status: string; platform: string;
  jobUrl: string; jobDescription: string; notes: string; applicationDate: string;
  salaryMin: string; salaryMax: string; workArrangement: string; germanLevel: string;
  recruiterName: string; recruiterContact: string; cvVersion: string;
  followUpDate: string; interviewDates: string;
};
type Goals = {
  applications: number; interviews: number; networking: number; followups: number; preparation: number;
  networkingDone: number; followupsDone: number; prepDone: number;
};
const initialGoals: Goals = { applications: 20, interviews: 2, networking: 5, followups: 3, preparation: 4, networkingDone: 0, followupsDone: 0, prepDone: 0 };
const SKILLS = ['Python', 'SQL', 'PySpark', 'Kafka', 'Airflow', 'PostgreSQL', 'Docker', 'AWS', 'Git', 'Power BI'];
const palette: Record<string, string> = {
  'Saved': '#94a3b8', 'Applied': '#5075db', 'Under Review': '#8278d9',
  'Online Assessment': '#d78fb2', 'Interview Scheduled': '#e88949',
  'Technical Interview': '#d69b38', 'HR Interview': '#d69b38', 'Final Interview': '#0d9488',
  'Offer': '#279876', 'Offer Received': '#279876', 'Rejected': '#cc6570', 'No Response': '#a6a19b', 'Withdrawn': '#858585'
};
const nav = [
  { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard },
  { id: 'applications', title: 'Applications', icon: BriefcaseBusiness },
  { id: 'kanban', title: 'Kanban Board', icon: Columns3 },
  { id: 'assistant', title: 'AI Assistant', icon: Sparkles },
  { id: 'follow-ups', title: 'Follow-ups', icon: CalendarClock },
  { id: 'goals', title: 'Goals', icon: Target },
  { id: 'data', title: 'Data & Export', icon: Database }
];
const boardColumns = ['Saved', 'Applied', 'Under Review', 'Online Assessment', 'Interview Scheduled', 'Technical Interview', 'HR Interview', 'Final Interview', 'Offer', 'Offer Received', 'Rejected', 'No Response', 'Withdrawn'];
const localISODate = (date: Date) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
const today = () => localISODate(new Date());
const plainDate = (s?: string | null) => s ? s.slice(0, 10) : '';
const formatDate = (s?: string | null) => s ? new Date(`${plainDate(s)}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';
function daysSince(s: string) { return Math.max(0, Math.floor((Date.now() - new Date(s).getTime()) / 86400000)); }
function monday(d: Date) { const n = new Date(d); n.setHours(0, 0, 0, 0); n.setDate(n.getDate() - ((n.getDay() + 6) % 7)); return n; }
function blankForm(): FormData { return { companyName: '', jobTitle: 'Junior Data Engineer', jobLocation: 'Berlin, Germany', status: 'Saved', platform: 'LinkedIn', jobUrl: '', jobDescription: '', notes: '', applicationDate: today(), salaryMin: '', salaryMax: '', workArrangement: '', germanLevel: '', recruiterName: '', recruiterContact: '', cvVersion: '', followUpDate: '', interviewDates: '' }; }
function fromApp(a: Application): FormData {
  return {
    companyName: a.companyName, jobTitle: a.jobTitle, jobLocation: a.jobLocation, status: a.status,
    platform: a.platform, jobUrl: a.jobUrl || '', jobDescription: a.jobDescription || '', notes: a.notes || '',
    applicationDate: plainDate(a.applicationDate), salaryMin: a.salaryMin?.toString() || '', salaryMax: a.salaryMax?.toString() || '',
    workArrangement: a.workArrangement || '', germanLevel: a.germanLevel || '', recruiterName: a.recruiterName || '',
    recruiterContact: a.recruiterContact || '', cvVersion: a.cvVersion || '', followUpDate: plainDate(a.followUpDate),
    interviewDates: (a.interviewDates || []).map(plainDate).join(', ')
  };
}
function toPayload(f: FormData) {
  return { ...f, interviewDates: f.interviewDates.split(',').map(s => s.trim()).filter(Boolean), salaryMin: f.salaryMin || null, salaryMax: f.salaryMax || null };
}
function IconLabel({ text, count }: { text: string; count?: number }) { return <span className="section-label">{text}{typeof count === 'number' ? ` · ${count}` : ''}</span>; }
function StatusTag({ value }: { value: string }) { return <span className="status-pill" style={{ '--status-color': palette[value] || '#7d8190' } as CSSProperties}><span className="status-dot" />{value}</span>; }
function Empty({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) {
  return <div className="empty"><div className="empty-icon"><BriefcaseBusiness size={22} /></div><h3>{title}</h3><p>{detail}</p>{action}</div>;
}
function Tile({ label, value, sub, icon: Icon }: { label: string; value: string | number; sub: string; icon: ComponentType<{ size?: number }> }) {
  return <div className="tile"><div className="tile-top"><span>{label}</span><Icon size={17}/></div><div className="tile-value">{value}</div><div className="tile-sub">{sub}</div></div>;
}
function download(text: string, fileName: string, type: string) {
  const blob = new Blob([text], { type }); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = fileName; document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
}

export default function Workspace({ section }: { section: string }) {
  const router = useRouter();
  const [apps, setApps] = useState<Application[]>([]);
  const [goals, setGoals] = useState<Goals>(initialGoals);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const [search, setSearch] = useState(''); const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState(''); const [workFilter, setWorkFilter] = useState(''); const [germanFilter, setGermanFilter] = useState('');
  const [showForm, setShowForm] = useState(false); const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(blankForm);
  const [mobile, setMobile] = useState(false); const [dark, setDark] = useState(false);
  const [assistantId, setAssistantId] = useState(''); const [description, setDescription] = useState<string | null>(null);
  const [skills, setSkills] = useState(SKILLS.join(', ')); const [tone, setTone] = useState('Professional');
  const [month, setMonth] = useState(() => new Date()); const [selectedDate, setSelectedDate] = useState(today());
  const [importRows, setImportRows] = useState<FormData[]>([]); const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [res, goalRes] = await Promise.all([fetch('/api/applications', { cache: 'no-store' }), fetch('/api/goals', { cache: 'no-store' })]);
      if (!res.ok) throw new Error((await res.json()).error || 'Could not load applications');
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Unexpected server response');
      setApps(data);
      if (goalRes.ok) setGoals(await goalRes.json());
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load your data'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { const id = new URLSearchParams(window.location.search).get('app'); if (id) setAssistantId(id); }, [section]);
  useEffect(() => {
    const setting = localStorage.getItem('jobtrack_theme');
    const selected = setting === 'dark' || (!setting && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDark(selected); document.documentElement.classList.toggle('dark', selected);
    const saved = localStorage.getItem('jobtrack_skills'); if (saved) setSkills(saved);
  }, []);
  function toggleTheme() { setDark(old => { const next = !old; document.documentElement.classList.toggle('dark', next); localStorage.setItem('jobtrack_theme', next ? 'dark' : 'light'); return next; }); }
  function openNew() { setEditing(null); setForm(blankForm()); setShowForm(true); }
  function openEdit(a: Application) { setEditing(a.id); setForm(fromApp(a)); setShowForm(true); }
  function notify(text: string) { setMessage(text); setError(''); }
  async function requestJSON(url: string, method: string, body?: unknown) {
    const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
    return result;
  }
  async function submitApplication(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const duplicate = apps.find(a => a.id !== editing && a.companyName.toLowerCase() === form.companyName.trim().toLowerCase() && a.jobTitle.toLowerCase() === form.jobTitle.trim().toLowerCase() && a.jobLocation.toLowerCase() === form.jobLocation.trim().toLowerCase());
      if (duplicate && !window.confirm(`Similar application exists: ${duplicate.companyName} – ${duplicate.jobTitle}. Save anyway?`)) return;
      await requestJSON(editing ? `/api/applications/${editing}` : '/api/applications', editing ? 'PUT' : 'POST', toPayload(form));
      setShowForm(false); setEditing(null); notify(editing ? 'Application updated.' : 'Application saved to PostgreSQL.');
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save'); }
    finally { setSaving(false); }
  }
  async function updateApp(app: Application, partial: Partial<FormData>) {
    try {
      await requestJSON(`/api/applications/${app.id}`, 'PUT', toPayload({ ...fromApp(app), ...partial }));
      await load();
      notify('Application updated.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to change status'); await load(); }
  }
  async function deleteApp(app: Application) {
    if (!confirm(`Permanently delete your application to ${app.companyName}?`)) return;
    try { await requestJSON(`/api/applications/${app.id}`, 'DELETE'); setApps(old => old.filter(a => a.id !== app.id)); notify('Application deleted.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to delete'); }
  }
  async function saveGoals(next: Goals) {
    setSaving(true);
    try { const saved = await requestJSON('/api/goals', 'PUT', next); setGoals(saved); notify('Goals saved to PostgreSQL.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not save goals'); }
    finally { setSaving(false); }
  }
  const weekStart = monday(new Date());
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const weeklyApps = apps.filter(a => new Date(a.applicationDate) >= weekStart && a.status !== 'Saved').length;
  const interviewApps = apps.filter(a => /Interview/.test(a.status));
  const appliedApps = apps.filter(a => a.status !== 'Saved');
  const thisMonth = apps.filter(a => new Date(a.applicationDate) >= monthStart).length;
  const followups = apps.filter(a => ['Applied', 'Under Review', 'No Response'].includes(a.status) &&
    ((a.followUpDate && plainDate(a.followUpDate) <= today()) || (!a.followUpDate && daysSince(a.applicationDate) >= 7)));
  const upcomingInterviews = apps.flatMap(a => (a.interviewDates || []).filter(d => plainDate(d) >= today()).map(d => ({ app: a, date: d }))).sort((a, b) => a.date.localeCompare(b.date));
  const responseCount = apps.filter(a => !['Saved', 'Applied', 'No Response'].includes(a.status)).length;
  const responseRate = appliedApps.length ? Math.round(100 * responseCount / appliedApps.length) : 0;
  const stats = [
    { label: 'Total applications', value: apps.length, sub: `${thisMonth} this month`, icon: BriefcaseBusiness },
    { label: 'Submitted', value: appliedApps.length, sub: 'All sent applications', icon: ArrowRight },
    { label: 'Interviews', value: interviewApps.length, sub: 'In interview stages', icon: CalendarDays },
    { label: 'Offers', value: apps.filter(a => a.status === 'Offer' || a.status === 'Offer Received').length, sub: 'Offers received', icon: CheckCircle2 }
  ];
  const filtered = apps.filter(a => {
    if (search && !`${a.companyName} ${a.jobTitle} ${a.jobLocation} ${a.platform}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilters.length && !statusFilters.includes(a.status)) return false;
    if (locationFilter && !a.jobLocation.toLowerCase().includes(locationFilter.toLowerCase())) return false;
    if (workFilter && a.workArrangement !== workFilter) return false;
    if (germanFilter && a.germanLevel !== germanFilter) return false;
    return true;
  });
  const statusData = STATUSES.map(s => ({ name: s, value: apps.filter(a => a.status === s).length, color: palette[s] })).filter(d => d.value);
  const monthlyData = useMemo(() => {
    const result: { month: string; applications: number; interviews: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      result.push({ month: d.toLocaleDateString('en-US', { month: 'short' }),
        applications: apps.filter(a => plainDate(a.applicationDate).startsWith(key)).length,
        interviews: apps.filter(a => /Interview/.test(a.status) && plainDate(a.applicationDate).startsWith(key)).length });
    }
    return result;
  }, [apps]);
  const skillList = skills.split(',').map(s => s.trim()).filter(Boolean);
  const selectedApp = apps.find(a => a.id === assistantId);
  const textToAnalyze = description ?? selectedApp?.jobDescription ?? '';
  const analysis = useMemo(() => scoreDescription(textToAnalyze, skillList), [textToAnalyze, skills]);
  function exportCSV() {
    const columns = ['companyName', 'jobTitle', 'jobLocation', 'status', 'platform', 'applicationDate', 'jobUrl', 'salaryMin', 'salaryMax', 'workArrangement', 'germanLevel', 'recruiterName', 'recruiterContact', 'cvVersion', 'followUpDate', 'interviewDates', 'jobDescription', 'notes'];
    const quote = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const lines = [columns.join(','), ...apps.map(a => columns.map(c => {
      const value = a[c as keyof Application];
      return quote(c === 'applicationDate' || c === 'followUpDate' ? plainDate(value as string) : c === 'interviewDates' ? (a.interviewDates || []).map(plainDate).join('|') : value);
    }).join(','))];
    download('\uFEFF' + lines.join('\r\n'), `jobtrack-backup-${today()}.csv`, 'text/csv;charset=utf-8');
  }
  async function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setError('');
    try {
      if (file.size > 5_000_000) throw new Error('Please choose a CSV file smaller than 5 MB.');
      const rows = parseCSV(await file.text());
      if (rows.length < 2) throw new Error('CSV has no data rows.');
      const header = rows[0].map(h => h.trim());
      if (!header.some(h => ['companyName', 'company'].includes(h)) || !header.includes('jobTitle')) throw new Error('CSV must contain companyName (or company) and jobTitle headers.');
      const next = rows.slice(1).map(row => {
        const entry: Record<string, string> = {};
        header.forEach((h, i) => entry[h] = row[i] || '');
        const values = blankForm();
        const keys = Object.keys(values) as (keyof FormData)[];
        for (const key of keys) if (entry[key] !== undefined) values[key] = entry[key];
        values.companyName = entry.companyName || entry.company || '';
        values.jobLocation = entry.jobLocation || entry.location || values.jobLocation;
        values.applicationDate = plainDate(entry.applicationDate || entry.dateApplied || values.applicationDate);
        values.interviewDates = (entry.interviewDates || '').split('|').join(', ');
        return values;
      }).filter(r => r.companyName && r.jobTitle).slice(0, 500);
      setImportRows(next); notify(`${next.length} rows ready to import. Review before saving.`);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not parse CSV'); }
    finally { if (fileInput.current) fileInput.current.value = ''; }
  }
  async function importCSV() {
    setSaving(true); setError(''); let success = 0;
    try {
      const known = new Set(apps.map(a => `${a.companyName}|${a.jobTitle}|${a.jobLocation}`.toLowerCase()));
      for (const item of importRows) {
        const key = `${item.companyName}|${item.jobTitle}|${item.jobLocation}`.toLowerCase();
        if (known.has(key)) continue;
        await requestJSON('/api/applications', 'POST', toPayload(item));
        known.add(key); success++;
      }
      setImportRows([]); notify(`Imported ${success} new applications. Duplicates were skipped.`); await load();
    } catch (err) { setError(`${success} imported before an error: ${err instanceof Error ? err.message : 'unknown error'}`); await load(); }
    finally { setSaving(false); }
  }
  async function markFollowedUp(app: Application) {
    try {
      const due = new Date(); due.setDate(due.getDate() + 7);
      await requestJSON(`/api/applications/${app.id}`, 'PUT', toPayload({ ...fromApp(app), followUpDate: localISODate(due) }));
      await saveGoals({ ...goals, followupsDone: goals.followupsDone + 1 });
      await load(); notify('Follow-up completed and next reminder set for 7 days.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save follow-up'); await load(); }
  }
  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); router.refresh(); }

  return <div className="workspace">
    <aside className={`sidebar ${mobile ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand"><div className="brand-mark">j<span>.</span></div><div><strong>jobtrack</strong><small>YOUR CAREER COMPANION</small></div><button className="icon-button mobile-close" onClick={() => setMobile(false)} aria-label="Close menu"><X size={18}/></button></div>
      <div className="side-profile"><div className="profile-avatar">SR</div><div><strong>Sainadh Reddy</strong><small>Berlin · Data Engineer</small></div></div>
      <div className="side-label">WORKSPACE</div>
      <nav className="side-nav" aria-label="Main navigation">{nav.map(item => <Link key={item.id} href={`/${item.id}`} className={`nav-link ${section === item.id ? 'active' : ''}`} onClick={() => setMobile(false)}><item.icon size={18}/><span>{item.title}</span>{item.id === 'follow-ups' && followups.length > 0 && <b>{followups.length}</b>}</Link>)}</nav>
      <div className="sidebar-bottom"><div className="side-tip"><Sparkles size={17}/><strong>Your next opportunity</strong><p>Stay organized, follow up, and keep progressing toward a data engineering role.</p></div><div className="sidebar-actions"><button className="icon-button" title="Change theme" onClick={toggleTheme}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button><button className="sidebar-logout" onClick={logout}><LogOut size={15}/> Sign out</button></div></div>
    </aside>
    {mobile && <div className="mobile-scrim" onClick={() => setMobile(false)}/>}
    <div className="page-wrap">
      <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobile(true)} aria-label="Open navigation"><Menu size={21}/></button><div className="top-search"><Search size={17}/><input aria-label="Search applications" placeholder="Search companies, roles, locations..." value={search} onChange={e => { setSearch(e.target.value); if (section !== 'applications' && e.target.value) router.push('/applications'); }}/></div><div className="top-actions"><span className="autosave"><span style={{ background: error ? '#dc404d' : '#36b384' }}/> {error ? 'Database error' : loading ? 'Loading...' : 'PostgreSQL connected'}</span><button className="icon-button" title="Refresh data" onClick={() => void load()}><RefreshCw size={18}/></button><button className="icon-button theme-top" title="Toggle dark mode" onClick={toggleTheme}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button><button className="primary quick-add" onClick={openNew}><Plus size={16}/> <span>New Application</span></button></div></header>
      <main className="main-content">
        {error && <div className="message error" role="alert"><AlertCircle size={16}/>{error}<button onClick={() => setError('')} aria-label="Dismiss error"><X size={15}/></button></div>}
        {message && !error && <div className="message success" role="status"><CheckCircle2 size={16}/>{message}<button onClick={() => setMessage('')} aria-label="Dismiss notice"><X size={15}/></button></div>}
        {loading ? <div className="loading-state"><RefreshCw size={20} className="spinner"/> Loading your saved applications...</div> : <>
          {section === 'dashboard' && <>
            <div className="heading-row"><div><div className="eyebrow">YOUR JOB SEARCH AT A GLANCE</div><h1>Dashboard<span className="orange-point">.</span></h1><p className="page-subtitle">Your job search, at a glance. Live data from PostgreSQL.</p></div><button className="outline" onClick={exportCSV}><Download size={16}/> Export CSV</button></div>
            <div className="tile-grid">{stats.map(s => <Tile key={s.label} {...s}/>)}</div>
            <div className="dashboard-bottom-metrics"><div><TrendingUp size={17}/><strong>{responseRate}%</strong><span>response rate (from submitted applications)</span></div><div><CalendarClock size={17}/><strong>{followups.length}</strong><span>follow-ups due</span></div><div><Target size={17}/><strong>{weeklyApps}/{goals.applications}</strong><span>weekly application goal</span></div></div>
            <div className="two-charts"><section className="surface chart-panel"><div className="panel-heading"><h2>Status breakdown</h2><IconLabel text="LIVE"/></div>{statusData.length ? <><div className="donut-wrap"><ResponsiveContainer width="100%" height={215}><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={59} outerRadius={84} paddingAngle={3}>{statusData.map(d => <Cell key={d.name} fill={d.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="donut-middle"><b>{apps.length}</b><span>applications</span></div></div><div className="legend">{statusData.map(d => <span key={d.name}><i style={{ background: d.color }}/>{d.name} <b>{d.value}</b></span>)}</div></> : <Empty title="No applications yet" detail="Add your first application to see live charts." action={<button className="primary" onClick={openNew}><Plus size={15}/> Add an application</button>}/>}</section>
              <section className="surface chart-panel"><div className="panel-heading"><h2>Monthly progress</h2><IconLabel text="LAST 6 MONTHS"/></div><p className="chart-help">Applications recorded per month</p><div className="chart-area"><ResponsiveContainer width="100%" height={260}><AreaChart data={monthlyData}><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted)' }}/><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted)' }}/><Tooltip/><Area type="monotone" dataKey="applications" stroke="#e76b4a" strokeWidth={3} fill="#fbe3da" fillOpacity={0.8}/></AreaChart></ResponsiveContainer></div></section>
            </div>
            <section className="surface recent-panel"><div className="panel-heading"><h2>Recent applications</h2><Link className="text-link" href="/applications">View all <ArrowRight size={15}/></Link></div><div className="table-scroll"><table className="records"><thead><tr><th>Company / Role</th><th>Location</th><th>Applied on</th><th>Status</th><th></th></tr></thead><tbody>{apps.slice(0, 5).map(a => <tr key={a.id}><td><strong>{a.companyName}</strong><small>{a.jobTitle}</small></td><td>{a.jobLocation}</td><td>{formatDate(a.applicationDate)}</td><td><StatusTag value={a.status}/></td><td><button className="table-action" onClick={() => openEdit(a)} title="Edit"><Pencil size={15}/></button></td></tr>)}{apps.length === 0 && <tr><td colSpan={5} className="table-empty">No records yet. Click “New Application” to begin.</td></tr>}</tbody></table></div></section>
          </>}
          {section === 'applications' && <>
            <div className="heading-row"><div><div className="eyebrow">TRACK EVERY OPPORTUNITY</div><h1>Applications<span className="orange-point">.</span></h1><p className="page-subtitle">All your applications in one searchable, editable place.</p></div><button className="primary" onClick={openNew}><Plus size={16}/> New Application</button></div>
            <div className="surface filters-panel"><div className="filters-top"><div className="filter-heading"><Filter size={16}/> Filters <span>· {filtered.length} of {apps.length} applications</span></div><button className="text-link" onClick={() => { setSearch(''); setStatusFilters([]); setLocationFilter(''); setWorkFilter(''); setGermanFilter(''); }}>Clear all</button></div>
              <div className="status-chips"><button className={`chip ${statusFilters.length === 0 ? 'selected' : ''}`} onClick={() => setStatusFilters([])}>All</button>{STATUSES.map(s => <button key={s} className={`chip ${statusFilters.includes(s) ? 'selected' : ''}`} onClick={() => setStatusFilters(old => old.includes(s) ? old.filter(x => x !== s) : [...old, s])}>{s}</button>)}</div>
              <div className="filter-fields"><label>Location<input placeholder="Berlin, Hamburg..." value={locationFilter} onChange={e => setLocationFilter(e.target.value)}/></label><label>Work arrangement<select value={workFilter} onChange={e => setWorkFilter(e.target.value)}><option value="">All arrangements</option>{WORK_TYPES.map(s => <option key={s}>{s}</option>)}</select></label><label>German requirement<select value={germanFilter} onChange={e => setGermanFilter(e.target.value)}><option value="">All levels</option>{GERMAN_LEVELS.map(s => <option key={s}>{s}</option>)}</select></label></div>
            </div>
            <div className="surface apps-panel"><div className="panel-heading"><h2>All applications <span className="muted-count">({filtered.length})</span></h2><button className="text-link" onClick={exportCSV}><Download size={15}/> Download CSV</button></div>
              {filtered.length ? <div className="table-scroll"><table className="records"><thead><tr><th>Company / Role</th><th>Location</th><th>Status</th><th>Applied on</th><th>Work type</th><th>Platform</th><th>Actions</th></tr></thead><tbody>{filtered.map(a => <tr key={a.id}><td className="company-cell"><strong>{a.companyName}</strong><small>{a.jobTitle}</small></td><td><MapPin size={13} className="small-icon"/>{a.jobLocation}</td><td><select className="table-status" aria-label={`Status for ${a.companyName}`} value={a.status} onChange={e => void updateApp(a, { status: e.target.value })}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></td><td>{formatDate(a.applicationDate)}</td><td>{a.workArrangement || '—'}</td><td>{a.platform}</td><td><div className="row-actions">{a.jobUrl && <a className="table-action" href={a.jobUrl} target="_blank" rel="noopener noreferrer" title="Open job posting"><ExternalLink size={15}/></a>}<button className="table-action" onClick={() => openEdit(a)} title="Edit"><Pencil size={15}/></button><button className="table-action danger-action" onClick={() => void deleteApp(a)} title="Delete"><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div> : <Empty title="No matching applications" detail="Try changing the filters or add a new application." action={<button className="primary" onClick={openNew}><Plus size={15}/> Add application</button>}/>}</div>
          </>}
          {section === 'kanban' && <>
            <div className="heading-row"><div><div className="eyebrow">VISUALIZE YOUR PIPELINE</div><h1>Kanban Board<span className="orange-point">.</span></h1><p className="page-subtitle">Drag cards across columns to change status. Every move saves to PostgreSQL.</p></div><button className="primary" onClick={openNew}><Plus size={16}/> Add job</button></div>
            {apps.length === 0 ? <div className="surface"><Empty title="Your board is ready" detail="Add an application to start moving it through your hiring pipeline." action={<button className="primary" onClick={openNew}><Plus size={15}/> Add application</button>}/></div> : <div className="board-scroller"><div className="board">{boardColumns.map(status => <div key={status} className="board-column" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); const app = apps.find(a => a.id === id); if (app && app.status !== status) void updateApp(app, { status }); }}><div className="board-head"><span className="board-bullet" style={{ background: palette[status] }}/><strong>{status}</strong><b>{apps.filter(a => a.status === status).length}</b></div><div className="board-list">{apps.filter(a => a.status === status).map(a => <article className="board-card" key={a.id} draggable onDragStart={e => e.dataTransfer.setData('text/plain', a.id)}><div className="board-card-company">{a.companyName}</div><strong>{a.jobTitle}</strong><small><MapPin size={12}/>{a.jobLocation}</small><div className="board-card-foot"><span>{formatDate(a.applicationDate)}</span><button className="table-action" onClick={() => openEdit(a)} title="Edit"><Pencil size={14}/></button></div></article>)}{!apps.some(a => a.status === status) && <div className="drop-hint">Drop here</div>}</div></div>)}</div></div>}
          </>}
          {section === 'assistant' && <>
            <div className="heading-row"><div><div className="eyebrow">SMART CAREER TOOLS</div><h1>AI Assistant<span className="orange-point">.</span></h1><p className="page-subtitle">Understand job skill requirements and write a professional follow-up.</p></div></div>
            <div className="notice"><Sparkles size={18}/><div><strong>Local keyword analysis — no external AI API</strong><p>This tool compares the text with your listed skills. It is not a verified ATS score or a generative AI model.</p></div></div>
            <div className="assistant-grid"><section className="surface padded"><div className="panel-heading"><h2>Job description analyzer</h2></div><label className="field">Select a saved application<select value={assistantId} onChange={e => { setAssistantId(e.target.value); setDescription(null); }}><option value="">Paste a job description below</option>{apps.map(a => <option value={a.id} key={a.id}>{a.companyName} — {a.jobTitle}</option>)}</select></label><label className="field">Job description<textarea rows={8} placeholder="Paste a real job description..." value={description ?? selectedApp?.jobDescription ?? ''} onChange={e => setDescription(e.target.value)}/></label><label className="field">Your skills (comma separated)<textarea rows={3} value={skills} onChange={e => { setSkills(e.target.value); localStorage.setItem('jobtrack_skills', e.target.value); }}/></label></section>
              <section className="surface padded"><div className="panel-heading"><h2>Skill-match analysis</h2></div>{textToAnalyze.trim() ? <><div className="analysis-score"><b>{analysis.percentage === null ? '—' : `${analysis.percentage}%`}</b><div><strong>Keyword overlap</strong><p>Matched {analysis.matched.length} of {analysis.found.length} detected technologies</p></div></div><h3 className="mini-heading">Matched skills</h3><div className="tag-list">{analysis.matched.length ? analysis.matched.map(k => <span className="skill-tag good" key={k}><Check size={13}/>{k}</span>) : <p className="muted-small">No matches in your listed skills.</p>}</div><h3 className="mini-heading">Potential skill gaps</h3><div className="tag-list">{analysis.missing.length ? analysis.missing.map(k => <span className="skill-tag gap" key={k}>{k}</span>) : <p className="muted-small">No additional recognized technologies found.</p>}</div><div className="assistant-tip"><strong>Next step</strong><p>Show evidence of the missing skills in a project only if you have actually used them. Highlight the matching technologies on your CV.</p></div></> : <Empty title="Add a job description" detail="A keyword comparison will appear here when you paste the vacancy requirements."/>}</section></div>
            <section className="surface padded followup-generator"><div className="panel-heading"><h2><Mail size={18}/> Follow-up email generator</h2></div><div className="filter-fields"><label>Application<select value={assistantId} onChange={e => setAssistantId(e.target.value)}><option value="">Choose an application</option>{apps.map(a => <option key={a.id} value={a.id}>{a.companyName} — {a.jobTitle}</option>)}</select></label><label>Tone<select value={tone} onChange={e => setTone(e.target.value)}><option>Professional</option><option>Friendly</option><option>Concise</option></select></label></div>{selectedApp ? <div className="generated-email"><div className="email-subject"><strong>Subject:</strong> Follow-up: {selectedApp.jobTitle} at {selectedApp.companyName}</div><pre>{tone === 'Friendly' ? `Hi ${selectedApp.recruiterName || 'Hiring Team'},\n\nHope you're doing well! I wanted to check in about my application for the ${selectedApp.jobTitle} position at ${selectedApp.companyName}.\n\nI remain excited about the opportunity and would appreciate any update on next steps.\n\nThanks so much!\nSainadh Reddy Pulimamidi` : tone === 'Concise' ? `Dear ${selectedApp.recruiterName || 'Hiring Team'},\n\nI am following up on my application for ${selectedApp.jobTitle} at ${selectedApp.companyName}. I remain interested and would appreciate an update when convenient.\n\nBest regards,\nSainadh Reddy Pulimamidi` : `Dear ${selectedApp.recruiterName || 'Hiring Manager'},\n\nI hope you are doing well. I am writing to follow up on my application for the ${selectedApp.jobTitle} position at ${selectedApp.companyName}, submitted on ${formatDate(selectedApp.applicationDate)}.\n\nI remain enthusiastic about this opportunity to contribute my experience with ${skillList.slice(0, 3).join(', ')}. I would appreciate any updates regarding the recruitment timeline or next steps.\n\nThank you for your consideration.\n\nKind regards,\nSainadh Reddy Pulimamidi\nBerlin, Germany`}</pre><button className="outline" onClick={() => { const body = document.querySelector('.generated-email pre')?.textContent || ''; navigator.clipboard.writeText(`Subject: Follow-up: ${selectedApp.jobTitle} at ${selectedApp.companyName}\n\n${body}`).then(() => notify('Email copied.')); }}><Copy size={15}/> Copy email</button></div> : <p className="muted-small">Choose an application to create an editable email draft.</p>}</section>
          </>}
          {section === 'follow-ups' && <>
            <div className="heading-row"><div><div className="eyebrow">NEVER MISS THE NEXT STEP</div><h1>Follow-ups & Calendar<span className="orange-point">.</span></h1><p className="page-subtitle">Automatically flag applications without a response after 7 days, or set your own dates.</p></div></div>
            <div className="followup-grid"><div className="followup-left">
              <section className="surface padded"><div className="panel-heading"><h2><AlertCircle size={18}/> Follow-ups due</h2><span className="count-bubble">{followups.length}</span></div>{followups.length ? <div className="followup-list">{followups.map(a => <div className="followup-item" key={a.id}><div><strong>{a.companyName}</strong><p>{a.jobTitle} · {formatDate(a.applicationDate)}</p><span className="muted-small">{a.followUpDate ? `Reminder: ${formatDate(a.followUpDate)}` : `${daysSince(a.applicationDate)} days since application`}</span></div><div className="followup-buttons"><button className="outline small" onClick={() => { router.push(`/assistant?app=${encodeURIComponent(a.id)}`); }}><Mail size={14}/> Draft</button><button className="outline small" title="Reschedule this reminder for 7 days later" onClick={() => { const d = new Date(); d.setDate(d.getDate() + 7); void updateApp(a, { followUpDate: localISODate(d) }); }}>Snooze 7d</button><button className="outline small" onClick={() => void markFollowedUp(a)}><Check size={14}/> Done</button><button className="table-action" title="Edit follow-up date" onClick={() => openEdit(a)}><Pencil size={14}/></button></div></div>)}</div> : <div className="inline-empty"><CheckCircle2 size={21}/> No follow-ups due right now.</div>}</section>
              <section className="surface padded"><div className="panel-heading"><h2><CalendarDays size={18}/> Upcoming interviews</h2><span className="count-bubble">{upcomingInterviews.length}</span></div>{upcomingInterviews.length ? <div className="followup-list">{upcomingInterviews.map(({ app, date }, i) => <div className="followup-item" key={`${app.id}-${date}-${i}`}><div><strong>{app.companyName}</strong><p>{app.jobTitle}</p></div><span className="date-chip">{formatDate(date)}</span></div>)}</div> : <div className="inline-empty">Add interview dates when editing an application to see them here.</div>}</section>
            </div><section className="surface padded calendar-panel"><div className="panel-heading"><h2>Calendar</h2><div className="month-controls"><button aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={17}/></button><strong>{month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</strong><button aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={17}/></button></div></div>
              <div className="calendar"><div className="calendar-labels">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <span key={d}>{d}</span>)}</div><div className="calendar-days">{Array.from({ length: (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7 }, (_, i) => <span key={`pad-${i}`}/>)}{Array.from({ length: new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate() }, (_, i) => {
                const date = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
                const follow = apps.some(a => plainDate(a.followUpDate) === date);
                const interview = apps.some(a => (a.interviewDates || []).some(d => plainDate(d) === date));
                return <button key={date} onClick={() => setSelectedDate(date)} className={`${selectedDate === date ? 'date-selected' : ''} ${date === today() ? 'date-today' : ''}`}><span>{i + 1}</span>{(follow || interview) && <span className="calendar-dots">{follow && <i className="orange-dot"/>}{interview && <i className="green-dot"/>}</span>}</button>;
              })}</div></div><div className="calendar-key"><span><i className="orange-dot"/> Follow-up</span><span><i className="green-dot"/> Interview</span></div><div className="selected-events"><strong>{formatDate(selectedDate)} · Events</strong>{apps.filter(a => plainDate(a.followUpDate) === selectedDate || (a.interviewDates || []).some(d => plainDate(d) === selectedDate)).map(a => <p key={a.id}>{a.companyName} — {a.jobTitle} {plainDate(a.followUpDate) === selectedDate ? '(Follow-up)' : '(Interview)'}</p>)}{!apps.some(a => plainDate(a.followUpDate) === selectedDate || (a.interviewDates || []).some(d => plainDate(d) === selectedDate)) && <p>No events on this date.</p>}</div>
            </section></div>
          </>}
          {section === 'goals' && <>
            <div className="heading-row"><div><div className="eyebrow">CONSISTENCY COMPOUNDS</div><h1>Weekly Goals<span className="orange-point">.</span></h1><p className="page-subtitle">Set your targets. Application totals are based on real saved records.</p></div><button className="primary" disabled={saving} onClick={() => void saveGoals(goals)}><Save size={16}/>{saving ? 'Saving...' : 'Save goals'}</button></div>
            <div className="goal-grid">{[
              { title: 'Applications', targetKey: 'applications' as const, done: weeklyApps, icon: BriefcaseBusiness, manual: false },
              { title: 'Interviews', targetKey: 'interviews' as const, done: apps.flatMap(a => a.interviewDates || []).filter(date => new Date(date) >= weekStart && new Date(date) < new Date(weekStart.getTime() + 7 * 86400000)).length, icon: CalendarDays, manual: false },
              { title: 'Networking contacts', targetKey: 'networking' as const, done: goals.networkingDone, icon: Mail, manual: true },
              { title: 'Follow-up emails', targetKey: 'followups' as const, done: goals.followupsDone, icon: CalendarClock, manual: true },
              { title: 'Interview preparation', targetKey: 'preparation' as const, done: goals.prepDone, icon: Sparkles, manual: true }
            ].map(item => {
              const target = goals[item.targetKey]; const percent = target ? Math.min(100, Math.round(item.done / target * 100)) : 0;
              return <section className="surface goal-card" key={item.title}><div className="goal-top"><span className="goal-icon"><item.icon size={19}/></span><strong>{item.title}</strong></div><div className="goal-numbers"><b>{item.done}</b><span> / {target} this week</span></div><div className="progress-track"><div style={{ width: `${percent}%` }}/></div><p>{percent}% of weekly goal</p><label className="goal-target">Weekly target <input type="number" min={1} max={1000} value={target} onChange={e => setGoals(g => ({ ...g, [item.targetKey]: Math.min(1000, Math.max(1, Number(e.target.value) || 1)) }))}/></label>{item.manual && <div className="goal-counter"><span>Mark activity complete</span><button onClick={() => void saveGoals({ ...goals, [item.targetKey === 'networking' ? 'networkingDone' : item.targetKey === 'followups' ? 'followupsDone' : 'prepDone']: Math.max(0, item.done - 1) })}>−</button><b>{item.done}</b><button onClick={() => void saveGoals({ ...goals, [item.targetKey === 'networking' ? 'networkingDone' : item.targetKey === 'followups' ? 'followupsDone' : 'prepDone']: item.done + 1 })}>+</button></div>}</section>;
            })}</div>
            <section className="surface padded"><h2>This week's progress</h2><p className="progress-summary">Week of {formatDate(weekStart.toISOString())}. You have submitted <strong>{weeklyApps}</strong> applications so far, with <strong>{interviewApps.length}</strong> currently in interview stages. Your weekly activity targets can be edited above. Manual counters reset at the start of each week.</p></section>
          </>}
          {section === 'data' && <>
            <div className="heading-row"><div><div className="eyebrow">YOUR DATA, YOUR CONTROL</div><h1>Data & Export<span className="orange-point">.</span></h1><p className="page-subtitle">Backup, import, and manage your application data.</p></div></div>
            <div className="notice green"><ShieldCheck size={20}/><div><strong>Applications are stored in PostgreSQL (Neon)</strong><p>Unlike the uploaded HTML reference, your applications are saved on the server. Use your workspace password, protect environment variables, and make regular backups.</p></div></div>
            <div className="data-grid"><section className="surface padded data-action"><div className="action-symbol"><Download size={24}/></div><h2>Export your applications</h2><p>Download all {apps.length} saved applications as a CSV spreadsheet. Includes dates, notes, and application details.</p><button className="primary full" onClick={exportCSV}><Download size={16}/> Export CSV</button></section><section className="surface padded data-action"><div className="action-symbol"><Upload size={24}/></div><h2>Import a CSV backup</h2><p>Import your saved CSV or one exported from the reference design. Review rows first; duplicates are skipped.</p><input ref={fileInput} type="file" accept=".csv,text/csv" onChange={e => void handleImport(e)} hidden/><button className="outline full" onClick={() => fileInput.current?.click()}><Upload size={16}/> Select CSV</button></section></div>
            {importRows.length > 0 && <section className="surface padded import-preview"><div className="panel-heading"><h2>Import preview · {importRows.length} rows</h2><button className="table-action" onClick={() => setImportRows([])}><X size={18}/></button></div><div className="table-scroll"><table className="records"><thead><tr><th>Company</th><th>Role</th><th>Location</th><th>Status</th></tr></thead><tbody>{importRows.slice(0, 10).map((a, i) => <tr key={i}><td>{a.companyName}</td><td>{a.jobTitle}</td><td>{a.jobLocation}</td><td>{a.status}</td></tr>)}</tbody></table></div>{importRows.length > 10 && <p className="muted-small">Showing first 10 of {importRows.length} records</p>}<button className="primary" disabled={saving} onClick={() => void importCSV()}>{saving ? 'Importing...' : `Import up to ${importRows.length} records`}</button></section>}
            <section className="surface padded privacy-details"><h2>Privacy & backup checklist</h2><p>Your app does not use the browser-only storage from the reference HTML for applications. Your data stays in the configured database until you delete it or your database provider removes it according to your plan. This project is a personal single-user tracker, not an enterprise multi-user authentication system.</p><p><strong>Recommended:</strong> Export weekly, enable database backups if available, use a strong TRACKER_PASSWORD and AUTH_SECRET, keep DATABASE_URL private, and never commit .env files to GitHub.</p></section>
          </>}
        </>}
      </main>
    </div>
    {showForm && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setShowForm(false); }}><section className="edit-modal" role="dialog" aria-modal="true" aria-label={editing ? 'Edit application' : 'Add application'}><div className="modal-header"><div><h2>{editing ? 'Edit application' : 'New application'}</h2><p>Saved securely in your PostgreSQL database</p></div><button className="icon-button" onClick={() => setShowForm(false)} title="Close"><X size={20}/></button></div><form onSubmit={e => void submitApplication(e)}><div className="form-content"><div className="form-grid">
      <label className="field">Company *<input required maxLength={180} placeholder="e.g. Zalando" value={form.companyName} onChange={e => setForm(v => ({ ...v, companyName: e.target.value }))}/></label>
      <label className="field">Job title *<input required maxLength={180} placeholder="Junior Data Engineer" value={form.jobTitle} onChange={e => setForm(v => ({ ...v, jobTitle: e.target.value }))}/></label>
      <label className="field">Location<input value={form.jobLocation} onChange={e => setForm(v => ({ ...v, jobLocation: e.target.value }))}/></label>
      <label className="field">Status<select value={form.status} onChange={e => setForm(v => ({ ...v, status: e.target.value }))}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></label>
      <label className="field">Application date<input type="date" required value={form.applicationDate} onChange={e => setForm(v => ({ ...v, applicationDate: e.target.value }))}/></label>
      <label className="field">Platform<select value={form.platform} onChange={e => setForm(v => ({ ...v, platform: e.target.value }))}>{PLATFORMS.map(s => <option key={s}>{s}</option>)}</select></label>
      <label className="field form-span">Job URL<input type="url" placeholder="https://company.com/careers/..." value={form.jobUrl} onChange={e => setForm(v => ({ ...v, jobUrl: e.target.value }))}/></label>
      <label className="field">Work arrangement<select value={form.workArrangement} onChange={e => setForm(v => ({ ...v, workArrangement: e.target.value }))}><option value="">Not specified</option>{WORK_TYPES.map(s => <option key={s}>{s}</option>)}</select></label>
      <label className="field">German language requirement<select value={form.germanLevel} onChange={e => setForm(v => ({ ...v, germanLevel: e.target.value }))}><option value="">Not specified</option>{GERMAN_LEVELS.map(s => <option key={s}>{s}</option>)}</select></label>
      <label className="field">Annual salary min (€)<input type="number" min="0" value={form.salaryMin} onChange={e => setForm(v => ({ ...v, salaryMin: e.target.value }))}/></label>
      <label className="field">Annual salary max (€)<input type="number" min="0" value={form.salaryMax} onChange={e => setForm(v => ({ ...v, salaryMax: e.target.value }))}/></label>
      <label className="field">Recruiter name<input placeholder="Optional" value={form.recruiterName} onChange={e => setForm(v => ({ ...v, recruiterName: e.target.value }))}/></label>
      <label className="field">Recruiter email / LinkedIn<input value={form.recruiterContact} onChange={e => setForm(v => ({ ...v, recruiterContact: e.target.value }))}/></label>
      <label className="field">CV version<input placeholder="e.g. CV_data_engineer_v2" value={form.cvVersion} onChange={e => setForm(v => ({ ...v, cvVersion: e.target.value }))}/></label>
      <label className="field">Follow-up reminder<input type="date" value={form.followUpDate} onChange={e => setForm(v => ({ ...v, followUpDate: e.target.value }))}/></label>
      <label className="field form-span">Interview dates (comma separated, YYYY-MM-DD)<input placeholder="2026-11-03, 2026-11-07" value={form.interviewDates} onChange={e => setForm(v => ({ ...v, interviewDates: e.target.value }))}/></label>
      <label className="field form-span">Job description<textarea rows={4} placeholder="Paste requirements to analyze in AI Assistant" value={form.jobDescription} onChange={e => setForm(v => ({ ...v, jobDescription: e.target.value }))}/></label>
      <label className="field form-span">Notes<textarea rows={3} placeholder="Recruiter details, next steps, salary, interview notes..." value={form.notes} onChange={e => setForm(v => ({ ...v, notes: e.target.value }))}/></label>
    </div></div><div className="modal-footer"><button type="button" className="outline" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" disabled={saving} className="primary"><Save size={16}/>{saving ? 'Saving...' : editing ? 'Save changes' : 'Save application'}</button></div></form></section></div>}
  </div>;
}
