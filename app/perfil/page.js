"use client"
import { useEffect, useState } from "react"
import { BottomNav } from "../../components/BottomNav"

export default function PerfilPage() {
  const [stats, setStats] = useState({ total:0, mar:0, horas:0 })

  useEffect(() => {
    try {
      let total=0, mar=0, eps=0
      for (let i=0;i<localStorage.length;i++){
        const k=localStorage.key(i)
        if(k?.startsWith("status-")) total++
        if(k && localStorage.getItem(k)==="ja_maratonei") mar++
        if(k?.startsWith("progress-")){
          const v=JSON.parse(localStorage.getItem(k)||"[]")
          if(Array.isArray(v)) eps+=v.filter(x=>x!=="100%").length
        }
      }
      setStats({ total, mar, horas: Math.round(eps*0.75) })
    } catch {}
  }, [])

  return (
    <div style={{ minHeight:"100vh", background:"#080F25", color:"#fff", paddingBottom:90, fontFamily:"Inter,Sora,sans-serif" }}>
      <header style={{ height:60, padding:"0 16px", display:"flex", alignItems:"center", borderBottom:"1px solid #ffffff10" }}>
        <h1 style={{ fontSize:18, fontWeight:800, fontFamily:"Sora,sans-serif" }}>Perfil</h1>
      </header>

      <main style={{ maxWidth:600, margin:"0 auto", padding:"20px 16px" }}>
        <div style={{ display:"flex", gap:14, alignItems:"center", background:"#121B3A", border:"1px solid #ffffff10", borderRadius:16, padding:16 }}>
          <div style={{ width:56, height:56, borderRadius:999, background:"#FFD400", display:"grid", placeItems:"center", color:"#000", fontWeight:900, fontSize:22 }}>P</div>
          <div><div style={{ fontWeight:800, fontSize:16, fontFamily:"Sora,sans-serif" }}>Você</div><div style={{ fontSize:12, opacity:.5 }}>Nível {stats.mar+1} • {stats.mar*100} XP</div></div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginTop:16 }}>
          <div style={{ background:"#121B3A", borderRadius:14, padding:14, textAlign:"center", border:"1px solid #ffffff10" }}><div style={{ fontSize:20, fontWeight:800 }}>{stats.total}</div><div style={{ fontSize:11, opacity:.5 }}>Séries</div></div>
          <div style={{ background:"#121B3A", borderRadius:14, padding:14, textAlign:"center", border:"1px solid #ffffff10" }}><div style={{ fontSize:20, fontWeight:800, color:"#FFD400" }}>{stats.mar}</div><div style={{ fontSize:11, opacity:.5 }}>Maratonadas</div></div>
          <div style={{ background:"#121B3A", borderRadius:14, padding:14, textAlign:"center", border:"1px solid #ffffff10" }}><div style={{ fontSize:20, fontWeight:800 }}>{stats.horas}h</div><div style={{ fontSize:11, opacity:.5 }}>Assistidas</div></div>
        </div>

        <div style={{ marginTop:20, background:"#121B3A", border:"1px solid #ffffff10", borderRadius:16, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:800, marginBottom:10, fontFamily:"Sora,sans-serif" }}>🏆 Ranking & Conquistas</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}><span>🥇 Primeira Maratona</span><span style={{ color:"#22c55e", fontWeight:700 }}>{stats.mar>0? "Desbloqueada":"Bloqueada"}</span></div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}><span>🔥 3 Séries Assistindo</span><span style={{ opacity:.5 }}>{stats.total>=3? "Desbloqueada":"Falta "+Math.max(0,3-stats.total)}</span></div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}><span>⏱️ 50h de maratona</span><span style={{ opacity:.5 }}>{stats.horas>=50? "Desbloqueada": stats.horas+"h / 50h"}</span></div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
