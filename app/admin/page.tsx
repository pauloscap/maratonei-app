"use client"
import { useEffect, useState } from "react"

export default function AdminPage(){
  const [users,setUsers]=useState<any[]>([])
  const [stats,setStats]=useState<any>(null)
  const [error,setError]=useState("")

  useEffect(()=>{
    Promise.all([
      fetch("/api/admin/users").then(r=>r.json()).catch(()=>[]),
      fetch("/api/admin/analytics").then(r=>r.json()).catch(()=>null)
    ]).then(([u,s])=>{
      setUsers(Array.isArray(u)?u:[])
      setStats(s)
    }).catch(e=>setError(String(e)))
  },[])

  return (
    <div style={{minHeight:"100vh", background:"#0a0f1f", color:"white", padding:24}}>
      <h1 style={{fontSize:28, fontWeight:700}}>Maratonei Admin</h1>
      {error && <p style={{color:"red"}}>{error}</p>}

      <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, margin:"20px 0"}}>
        <div style={{background:"#16213e", padding:16, borderRadius:12}}>Usuários<br/><b style={{fontSize:24}}>{stats?.totalUsuarios?? "-"}</b></div>
        <div style={{background:"#16213e", padding:16, borderRadius:12}}>Watchlist<br/><b style={{fontSize:24}}>{stats?.totalWatchlist?? "-"}</b></div>
        <div style={{background:"#16213e", padding:16, borderRadius:12}}>Média<br/><b style={{fontSize:24}}>{stats?.mediaPorUsuario?? "-"}</b></div>
        <div style={{background:"#16213e", padding:16, borderRadius:12}}>Top 1<br/><b>{stats?.topSeries?.[0]?.titulo || "-"}</b></div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
        <div style={{background:"#16213e", padding:16, borderRadius:12}}>
          <h3>Top séries/filmes</h3>
          {stats?.topSeries?.map((s:any,i:number)=><div key={i} style={{display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #ffffff10"}}><span>{s.titulo}</span><b>{s.count}</b></div>)}
          {!stats?.topSeries?.length && <p style={{color:"#888"}}>Sem dados</p>}
        </div>
        <div style={{background:"#16213e", padding:16, borderRadius:12}}>
          <h3>Gêneros</h3>
          {stats?.topGeneros?.map((g:any,i:number)=><div key={i} style={{display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #ffffff10"}}><span>{g.genero}</span><b>{g.count}</b></div>)}
          {!stats?.topGeneros?.length && <p style={{color:"#888"}}>Salve um título novo com o código novo que já aparece. Hoje tem 16 users e 2 watchlists (ID 3 e Elle)</p>}
        </div>
      </div>

      <div style={{background:"#16213e", padding:16, borderRadius:12, marginTop:16}}>
        <h3>Usuários ({users.length})</h3>
        {users.slice(0,12).map((u:any)=><div key={u.id} style={{padding:"6px 0"}}>{u.nome || u.email || u.id}</div>)}
      </div>
    </div>
  )
}
