"use client"
import { useEffect, useState } from "react"

export default function AdminPage() {
  const [data, setData] = useState<any>(null)
  useEffect(() => { fetch("/api/admin/analytics").then(r=>r.json()).then(setData) }, [])

  if (!data) return <div style={{minHeight:'100vh',background:'#0e0f23',color:'white',display:'flex',alignItems:'center',justifyContent:'center'}}>Carregando base real...</div>

  const top = data.topSeries?.[0]
  const card:any = { background:'#1a1c36', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'20px', padding:'20px' }

  return (
    <div style={{minHeight:'100vh',background:'#0e0f23',color:'white',padding:'24px',fontFamily:'Inter,sans-serif'}}>
      <div style={{maxWidth:'1100px',margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <h1 style={{fontSize:'30px',fontWeight:900,margin:0}}>Maratonei Admin</h1>
            <p style={{color:'rgba(255,255,255,0.5)',fontSize:'12px',marginTop:'4px'}}>maratoneiapp.vercel.app • base real do Supabase</p>
          </div>
          <button onClick={()=>location.reload()} style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'999px',padding:'8px 16px',color:'white',fontSize:'12px',cursor:'pointer'}}>Atualizar</button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'16px',marginTop:'20px',marginBottom:'16px'}}>
          <div style={card}><div style={{fontSize:'11px',opacity:0.4,fontWeight:700}}>USUÁRIOS</div><div style={{fontSize:'36px',fontWeight:900,marginTop:'6px'}}>{data.totalUsuarios}</div><div style={{fontSize:'11px',color:'#34d399',marginTop:'6px'}}>● online</div></div>
          <div style={card}><div style={{fontSize:'11px',opacity:0.4,fontWeight:700}}>WATCHLIST</div><div style={{fontSize:'36px',fontWeight:900,marginTop:'6px'}}>{data.totalWatchlist}</div><div style={{fontSize:'11px',opacity:0.4,marginTop:'6px'}}>total salvo</div></div>
          <div style={card}><div style={{fontSize:'11px',opacity:0.4,fontWeight:700}}>MÉDIA / USER</div><div style={{fontSize:'36px',fontWeight:900,marginTop:'6px'}}>{(data.totalWatchlist / (data.totalUsuarios||1)).toFixed(1)}</div><div style={{fontSize:'11px',opacity:0.4,marginTop:'6px'}}>filmes por pessoa</div></div>
          <div style={card}><div style={{fontSize:'11px',opacity:0.4,fontWeight:700}}>TOP 1 AGORA</div><div style={{fontSize:'13px',fontWeight:700,marginTop:'8px'}}>{top?.titulo||'—'}</div><div style={{fontSize:'11px',opacity:0.4,marginTop:'4px'}}>{top?.total||0} saves</div></div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'16px',marginBottom:'16px'}}>
          <div style={card}><div style={{fontWeight:800,marginBottom:'14px'}}>📺 Filmes / Séries mais salvos</div>
            {data.topSeries?.map((s:any,i:number)=>(
              <div key={i} style={{marginBottom:'12px'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'6px'}}><span>{i+1}. {s.titulo}</span><span style={{opacity:0.4}}>{s.total} saves</span></div>
                <div style={{height:'6px',background:'rgba(255,255,255,0.07)',borderRadius:'999px'}}><div style={{height:'6px',width:`${(s.total/(top?.total||1))*100}%`,background:'linear-gradient(90deg,#8b5cf6,#ec4899)',borderRadius:'999px'}}/></div>
              </div>
            ))}
          </div>
          <div style={card}><div style={{fontWeight:800,marginBottom:'14px'}}>🎭 Gêneros mais vistos - BASE REAL</div>
            {data.generosMaisVistos?.map((g:any,i:number)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:'13px',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.06)'}}><span style={{opacity:0.8}}>{g.genero}</span><span style={{fontWeight:800}}>{g.total}x</span></div>
            ))}
            <div style={{fontSize:'10px',opacity:0.25,marginTop:'16px'}}>Hoje: {data.totalUsuarios} users • {data.totalWatchlist} watchlists • {data.totalSeries} títulos</div>
          </div>
        </div>

        {/* LISTA DE USUÁRIOS IGUAL AO SEU PRINT ANTIGO */}
        <div style={{...card, padding:'20px'}}>
          <div style={{fontWeight:800, fontSize:'13px', marginBottom:'14px'}}>👥 Usuários ({data.totalUsuarios}) — Base real do Supabase</div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'10px'}}>
            {data.usuarios?.map((u:any)=>(
              <div key={u.id} style={{display:'flex', alignItems:'center', gap:'10px', background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'14px', padding:'10px 12px'}}>
                <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nome||u.username||'U')}&background=random`} style={{width:'36px',height:'36px',borderRadius:'999px',objectFit:'cover'}} />
                <div style={{overflow:'hidden'}}>
                  <div style={{fontSize:'12px',fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{u.nome || u.username || 'Usuário'}</div>
                  <div style={{fontSize:'10px',opacity:0.4}}>{u.criado_em? new Date(u.criado_em).toLocaleDateString('pt-BR') : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
    {/* === NOVO - ACRESCENTAR SEM MEXER NO QUE JÁ TEM === */}
        <div style={{...card, marginBottom:'16px'}}>
          <div style={{display:'flex', gap:'8px', marginBottom:'16px'}}>
            {[
              {id:'filmes', label:`🎬 Filmes (${data.topFilmesTodos?.length||0})`},
              {id:'series', label:`📺 Séries (${data.topSeriesTodos?.length||0})`},
              {id:'users', label:`👥 Por Usuário`},
            ].map(tab=>(
              <button key={tab.id} onClick={()=>setAba(tab.id)} style={{
                background: aba===tab.id?'white':'rgba(255,255,255,0.08)',
                color: aba===tab.id?'#0e0f23':'white',
                border:'none', borderRadius:'999px', padding:'8px 14px',
                fontSize:'12px', fontWeight:700, cursor:'pointer'
              }}>{tab.label}</button>
            ))}
          </div>

          {aba==='filmes' && (
            <div style={{maxHeight:'400px', overflowY:'auto'}}>
              {data.topFilmesTodos?.map((s:any,i:number)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:'12px',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                  <span>{i+1}. {s.titulo}</span><span style={{opacity:0.4}}>{s.total} saves</span>
                </div>
              ))}
            </div>
          )}
          {aba==='series' && (
            <div style={{maxHeight:'400px', overflowY:'auto'}}>
              {data.topSeriesTodos?.map((s:any,i:number)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:'12px',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                  <span>{i+1}. {s.titulo}</span><span style={{opacity:0.4}}>{s.total} saves</span>
                </div>
              ))}
            </div>
          )}
          {aba==='users' && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'10px'}}>
              {data.usuariosDetalhado?.map((u:any)=>(
                <div key={u.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(0,0,0,0.2)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:'12px',padding:'10px 12px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <img src={u.avatar_url||`https://ui-avatars.com/api/?name=${u.nome}`} style={{width:'28px',height:'28px',borderRadius:'999px'}}/>
                    <span style={{fontSize:'12px',fontWeight:700}}>{u.nome}</span>
                  </div>
                  <div style={{fontSize:'11px',textAlign:'right'}}>
                    <div>🎬 {u.total_filmes} filmes</div>
                    <div>📺 {u.total_series} séries</div>
                    <div style={{fontWeight:800,marginTop:'2px'}}>= {u.total_geral} total</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
  )
}
