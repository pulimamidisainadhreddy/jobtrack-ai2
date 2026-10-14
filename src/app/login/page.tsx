'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { LockKeyhole, ArrowRight } from 'lucide-react';
export default function Login() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to sign in');
      router.replace('/dashboard'); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Try again'); }
    finally { setBusy(false); }
  }
  return <main className="login-screen"><div className="login-card"><div className="brand-mark">j<span>.</span></div>
    <h1>Welcome back</h1><p>Your personal job search workspace. All application records are stored in your connected database.</p>
    <form onSubmit={submit}><label htmlFor="password">Workspace password</label><input id="password" type="password" required autoFocus value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" autoComplete="current-password" />
      {error && <div className="message error">{error}</div>}
      <button className="primary full" disabled={busy}><LockKeyhole size={16}/>{busy ? 'Signing in...' : 'Unlock workspace'} <ArrowRight size={16}/></button></form>
    <div className="login-foot">PRIVATE WORKSPACE · BERLIN, GERMANY</div>
  </div></main>;
}
