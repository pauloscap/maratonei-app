"use client"
import { useEffect, useState } from "react"

export default function AdminPage(){
  const [users,setUsers]=useState<any[]>([])
  const [stats,setStats]=useState<any>(null)

  const load = async ()=>{
    const [u,s] = await Promise.all([
      fetch("/api/admin/users").then(r=>r.json()),
      fetch("/api/admin/analytics").then(r=>r.json())
    ])
    setUsers(Array.isArray(u)?u:[])
    setStats(s)
  }
  useEffect(()=>{load()},[])

  const card: any = { background:"#16213e", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:16 }
  const kpiLabel: any = { fontSize:11, letterSpacing:1, color:"rgba(255,255,255,0.4)", textTransform:"uppercase" as any }

  return (
    <div style={{minHeight:"100vh", background:"#0a0f1f", color:"white", padding:24, fontFamily:"Inter, sans-serif"}}>
      <div style={{maxWidth:1120, margin:"0 auto"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24}}>
          <div>
            <div style={{fontSize:32, fontWeight:900}}>Maratonei Admin</div>
            <div style={{fontSize:13, color:"rgba(255,255,255,0.5)", marginTop:4}}>maratoneiapp.vercel.app • base real do Supabase</div>
          </div>
          <button onClick={load} style={{fontSize:12, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.1)", padding:"8px 16px", borderRadius:999, color:"white", cursor:"pointer"}}>Atualizar</button>
        </div>

        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12, marginBottom:20}}>
          <div style={card}><div style={kpiLabel}>Usuários</div><div style={{fontSize:32, fontWeight:800, marginTop:4}}>{stats?.totalUsuarios || users.length}</div><div style={{fontSize:11, color:"#34d399", marginTop:4}}>● online</div></div>
          <div style={card}><div style={kpiLabel}>Watchlist</div><div style={{fontSize:32, fontWeight:800, marginTop:4}}>{stats?.totalWatchlist || 0}</div><div style={{fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:4}}>total salvo</div></div>
          <div style={card}><div style={kpiLabel}>Média / user</div><div style={{fontSize:32, fontWeight:800, marginTop:4}}>{stats?.mediaPorUsuario || "0"}</div><div style={{fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:4}}>filmes por pessoa</div></div>
          <div style={card}><div style={kpiLabel}>Top 1 agora</div><div style={{fontSize:14, fontWeight:700, marginTop:8, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{stats?.topSeries?.[0]?.titulo || "—"}</div><div style={{fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:4}}>{stats?.topSeries?.[0]?.count || 0} saves</div></div>
        </div>

        <div style={{display:"grid", gridTemplateColumns:"2fr 1fr", gap:12, marginBottom:20}}>
          <div style={card}>
            <div style={{fontWeight:700, fontSize:14, marginBottom:16}}>📈 Filmes / Séries mais salvos</div>
            {(stats?.topSeries||[]).map((s:any,i:number)=>{
              const max = stats?.topSeries?.[0]?.count || 1
              const pct = (s.count/max)*100
              return (
                <div key={i} style={{marginBottom:12}}>
                  <div style={{display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:6}}><span>{i+1}. {s.titulo}</span><b>{s.count}</b></div>
                  <div style={{height:10, background:"rgba(0,0,0,0.4)", borderRadius:999, overflow:"hidden"}}><div style={{height:"100%", width:`${pct}%`, background:"linear-gradient(90deg,#8b5cf6,#ec4899)", borderRadius:999}} /></div>
                </div>
              )
            })}
          </div>
          <div style={card}>
            <div style={{fontWeight:700, fontSize:14, marginBottom:16}}>🎭 Gêneros mais vistos</div>
            {stats?.topGeneros?.length? stats.topGeneros.map((g:any,i:number)=>{
              const total = stats.topGeneros.reduce((a:any,c:any)=>a+c.count,0)
              const pct = Math.round((g.count/total)*100)
              return <div key={i} style={{display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.05)", fontSize:13}}><span style={{display:"flex", alignItems:"center", gap:8}}><span style={{width:10,height:10,borderRadius:999,background:`hsl(${260+i*30} 80% 60%)`, display:"inline-block"}} />{g.genero}</span><b>{g.count} <span style={{fontWeight:400, color:"rgba(255,255,255,0.4)"}}>({pct}%)</span></b></div>
            }) : (
              <div style={{textAlign:"center", padding:"32px 0"}}>
                <div style={{fontSize:36, marginBottom:12}}>🍿</div>
                <div style={{fontSize:12, color:"rgba(255,255,255,0.6)", lineHeight:1.6}}>Ainda sem gêneros.<br/>Seu registro da Elle foi com código antigo.<br/>Salve um título novo com o salvar-titulo novo que já preenche.</div>
                <div style={{fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:12}}>Hoje: 16 users • 2 watchlists</div>
              </div>
            )}
          </div>
        </div>

        <div style={card}>
          <div style={{fontWeight:700, fontSize:14, marginBottom:16}}>👥 Usuários ({users.length}) — Base real do Supabase</div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:10}}>
            {users.map((u:any)=>(
              <div key={u.id} style={{display:"flex", alignItems:"center", gap:12, background:"rgba(0,0,0,0.2)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:12, padding:10}}>
                <img src={u.avatar_url} alt="" style={{width:40,height:40,borderRadius:999, background:"white", objectFit:"cover"}} />
                <div style={{minWidth:0}}><div style={{fontSize:13, fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{u.nome}</div><div style={{fontSize:11, color:"rgba(255,255,255,0.4)"}}>{new Date(u.criado_em).toLocaleDateString("pt-BR")}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
