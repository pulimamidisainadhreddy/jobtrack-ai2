import Link from 'next/link'
export default function Home(){
  return (
    <div style={{display:'flex', minHeight:'100vh', alignItems:'center', justifyContent:'center', background:'#f6f7f9'}}>
      <div style={{background:'#fff', border:'1px solid #e5e7eb', borderRadius:'12px', padding:'40px', textAlign:'center', maxWidth:'480px'}}>
        <div style={{width:'48px', height:'48px', background:'#0f172a', color:'#fff', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, margin:'0 auto 16px'}}>J</div>
        <h1 style={{fontSize:'22px', fontWeight:800}}>JobTrack AI</h1>
        <p style={{fontSize:'12px', color:'#64748b', letterSpacing:'1px', marginTop:'4px'}}>BERLIN - PRIVATE</p>
        <p style={{color:'#64748b', fontSize:'14px', marginTop:'16px'}}>Ready to land your Data Engineer role in Berlin?</p>
        <Link href="/dashboard" style={{display:'inline-block', marginTop:'24px', background:'#0f172a', color:'#fff', padding:'12px 24px', borderRadius:'8px', fontWeight:600, textDecoration:'none'}}>Open Dashboard →</Link>
        <div style={{marginTop:'16px', fontSize:'12px'}}><a href="/api/health" style={{color:'#64748b'}}>Check API Health</a></div>
      </div>
    </div>
  )
}
