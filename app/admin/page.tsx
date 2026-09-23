"use client"
import { useEffect, useState } from "react"

export default function AdminPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch("/api/admin/analytics").then(r => r.json()).then(setData)
  }, [])

  if (!data) return <div style={{minHeight:'100vh',background:'#0e0f23',color:'white',display:'flex',alignItems:'center',justifyContent:'center'}}>Carregando base real de 17 usuários...</div>

  const top = data.topSeries?.[0]
  const media = (data.totalWatchlist / 17).toFixed(1)

  const card: any = { background:'#1a1c36', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'20px', padding:'20px' }

  return (
    <div style={{minHeight:'100vh', background:'#0e0f23', color:'white', padding:'24px', fontFamily:'Inter, system-ui, sans-serif'}}>
      <div style={{maxWidth:'1100px', margin:'0 auto'}}>
        <h1 style={{fontSize:'32px', fontWeight:900, margin:0}}>Maratonei Admin</h1>
        <p style={{color:'rgba(255,255,255,0.5)', fontSize:'13px', marginTop:'6px', marginBottom:'24px'}}>maratoneiapp.vercel.app • base real do Supabase • 17 usuários • {data.totalSeries} títulos • paulor.garcia7@gmail.com incluído</p>

        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:'16px', marginBottom:'20px'}}>
          <div style={card}>
            <div style={{fontSize:'11px', letterSpacing:'1px', opacity:0.4, fontWeight:700}}>USUÁRIOS</div>
            <div style={{fontSize:'40px', fontWeight:900, marginTop:'8px'}}>17</div>
            <div style={{fontSize:'11px', marginTop:'8px', color:'#34d399'}}>● online</div>
          </div>
          <div style={card}>
            <div style={{fontSize:'11px', letterSpacing:'1px', opacity:0.4, fontWeight:700}}>WATCHLIST</div>
            <div style={{fontSize:'40px', fontWeight:900, marginTop:'8px'}}>{data.totalWatchlist}</div>
            <div style={{fontSize:'11px', marginTop:'8px', opacity:0.4}}>total salvo</div>
          </div>
          <div style={card}>
            <div style={{fontSize:'11px', letterSpacing:'1px', opacity:0.4, fontWeight:700}}>MÉDIA / USER</div>
            <div style={{fontSize:'40px', fontWeight:900, marginTop:'8px'}}>{media}</div>
            <div style={{fontSize:'11px', marginTop:'8px', opacity:0.4}}>filmes por pessoa</div>
          </div>
          <div style={card}>
            <div style={{fontSize:'11px', letterSpacing:'1px', opacity:0.4, fontWeight:700}}>TOP 1 AGORA</div>
            <div style={{fontSize:'14px', fontWeight:700, marginTop:'8px'}}>{top?.titulo || '—'}</div>
            <div style={{fontSize:'11px', marginTop:'8px', opacity:0.4}}>{top?.total || 0} saves</div>
          </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'16px'}}>
          <div style={card}>
            <div style={{fontWeight:800, marginBottom:'16px'}}>📺 Filmes / Séries mais salvos</div>
            {data.topSeries?.map((s:any,i:number)=>(
              <div key={i} style={{marginBottom:'14px'}}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'6px'}}>
                  <span>{i+1}. {s.titulo}</span><span style={{opacity:0.4}}>{s.total} saves</span>
                </div>
                <div style={{height:'8px', background:'rgba(255,255,255,0.06)', borderRadius:'999px'}}>
                  <div style={{height:'8px', width:`${(s.total/(top?.total||1))*100}%`, background:'linear-gradient(90deg,#8b5cf6,#ec4899)', borderRadius:'999px'}} />
                </div>
              </div>
            ))}
          </div>

          <div style={card}>
            <div style={{fontWeight:800, marginBottom:'16px'}}>🎭 Gêneros mais vistos - BASE REAL</div>
            {data.generosMaisVistos?.map((g:any,i:number)=>(
              <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize:'13px', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                <span style={{opacity:0.8}}>{g.genero}</span><span style={{fontWeight:800}}>{g.total}x</span>
              </div>
            ))}
            <div style={{fontSize:'10px', opacity:0.2, marginTop:'20px'}}>Hoje: 17 users • {data.totalWatchlist} watchlists • {data.totalSeries} títulos</div>
          </div>
        </div>
      </div>
    </div>
  )
}
