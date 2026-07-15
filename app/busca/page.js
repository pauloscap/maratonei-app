"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { BottomNav } from "../../components/BottomNav"

export default function BuscaPage() {
  const [trend, setTrend] = useState([])
  const [lanc, setLanc] = useState([])

  useEffect(() => {
    async function load() {
      try {
        const key = process.env.NEXT_PUBLIC_TMDB_KEY
        const t = await fetch(`https://api.themoviedb.org/3/trending/tv/week?api_key=${key}&language=pt-BR`).then(r=>r.json())
        const l = await fetch(`https://api.themoviedb.org/3/tv/on_the_air?api_key=${key}&language=pt-BR`).then(r=>r.json())
        setTrend(t.results?.slice(0,10) || [])
        setLanc(l.results?.slice(0,10) || [])
      } catch {}
    }
    load()
  }, [])

  const Row = ({ title, list }) => (
    <div style={{ marginBottom:22 }}>
      <h3 style={{ fontSize:15, fontWeight:800, margin:"0 0 10px 2px", fontFamily:"Sora,sans-serif" }}>{title}</h3>
      <div style={{ display:"flex", gap:12, overflowX:"auto", padding:"4px 2px 10px" }}>
        {list.map(it => (
          <div key={it.id} style={{ minWidth:110 }}>
            <div style={{ width:110, height:165, borderRadius:12, overflow:"hidden", background:"#121B3A" }}>
              <img src={it.poster_path? `https://image.tmdb.org/t/p/w185${it.poster_path}` : ""} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" />
            </div>
            <div style={{ fontSize:11, marginTop:6, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:110, opacity:.8 }}>{it.name}</div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:"100vh", background:"#080F25", color:"#fff", paddingBottom:90, fontFamily:"Inter,Sora,sans-serif" }}>
      <header style={{ height:60, padding:"0 16px", display:"flex", alignItems:"center", borderBottom:"1px solid #ffffff10", position:"sticky", top:0, background:"rgba(8,15,37,.9)", backdropFilter:"blur(12px)", zIndex:10 }}>
        <h1 style={{ fontSize:18, fontWeight:800, fontFamily:"Sora,sans-serif" }}>Busca</h1>
      </header>
      <main style={{ maxWidth:1100, margin:"0 auto", padding:"16px 12px" }}>
        <Link href="/" style={{ display:"flex", alignItems:"center", gap:10, background:"#121B3A", border:"1px solid #ffffff18", height:46, borderRadius:999, padding:"0 16px", color:"#ffffff55", textDecoration:"none", fontSize:14, marginBottom:20 }}>🔍 Buscar série para adicionar...</Link>
        <Row title="🔥 Tendências da Semana" list={trend} />
        <Row title="✨ Lançamentos e No Ar" list={lanc} />
      </main>
      <BottomNav />
    </div>
  )
}
