"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getSupa } from "../../lib/supabase"
import { BottomNav } from "../../components/BottomNav"

const supa = getSupa()

export default function FilmesPage() {
  const router = useRouter()
  const [F, setF] = useState([])
  const [M, setM] = useState({})
  const [q, setQ] = useState("")
  const [R, setR] = useState([])

  async function load() {
    const { data } = await supa.from("filmes").select("*").order("created_at", { ascending:false })
    if (data) {
      setF(data)
      let m = {}
      data.forEach(f => { m[f.id] = localStorage.getItem("filme-status-" + f.id) || "quero_assistir" })
      setM(m)
    }
  }

  useEffect(()=>{ load() }, [])

  async function buscar(v) {
    setQ(v)
    if (v.length < 2) { setR([]); return }
    const key = process.env.NEXT_PUBLIC_TMDB_KEY
    const r = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${key}&language=pt-BR&query=${encodeURIComponent(v)}`)
    const j = await r.json()
    setR(j.results?.slice(0, 8) || [])
  }

  const quero = F.filter(f => (M[f.id]||"quero_assistir")==="quero_assistir")
  const ja = F.filter(f => M[f.id]==="ja_assisti")

  const Card = ({ f }) => {
    const img = f.poster?.startsWith("/")? `https://image.tmdb.org/t/p/w500${f.poster}` : f.poster?.startsWith("http")? f.poster : f.poster? `https://image.tmdb.org/t/p/w500${f.poster}` : ""
    const ok = M[f.id]==="ja_assisti"
    return (
      <Link href={`/filme/${f.tmdb_id}`} style={{ textDecoration:"none", color:"#fff", minWidth:136 }}>
        <div style={{ width:136, height:204, borderRadius:14, overflow:"hidden", background:"#121B3A", border:"1px solid #ffffff12", position:"relative" }}>
          <img src={img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          {ok && <div style={{ position:"absolute", left:0, right:0, bottom:0, height:5, background:"#22c55e" }} />}
        </div>
        <div style={{ fontSize:12.5, marginTop:7, maxWidth:136, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", fontWeight:600 }}>{f.titulo}</div>
      </Link>
    )
  }

  return (
    <div style={{ minHeight:"100vh", background:"#080F25", color:"#fff", paddingBottom:90 }}>
      <header style={{ height:60, padding:"0 16px", display:"flex", alignItems:"center", borderBottom:"1px solid #ffffff10", position:"sticky", top:0, background:"rgba(8,15,37,.9)", backdropFilter:"blur(12px)", zIndex:10 }}>
        <h1 style={{ fontSize:18, fontWeight:800 }}>Filmes</h1>
      </header>
      <main style={{ maxWidth:1100, margin:"0 auto", padding:"16px 12px" }}>
        <div style={{ position:"relative", maxWidth:560, margin:"0 auto 20px" }}>
          <input value={q} onChange={e=>buscar(e.target.value)} placeholder="Buscar filme..." style={{ width:"100%", height:46, borderRadius:999, background:"#121B3A", border:"1px solid #ffffff18", padding:"0 16px 0 42px", color:"#fff", outline:"none" }} />
          <span style={{ position:"absolute", left:15, top:12, opacity:.5 }}>🔍</span>
          {R.length>0 && <div style={{ position:"absolute", top:52, left:0, right:0, background:"#121B3A", borderRadius:16, border:"1px solid #ffffff18", zIndex:9999, overflow:"hidden" }}>{R.map(r=>{ const img=r.poster_path? `https://image.tmdb.org/t/p/w92${r.poster_path}`:""; return <div key={r.id} onClick={()=>router.push(`/filme/${r.id}`)} style={{ display:"flex", gap:10, padding:"8px 10px", cursor:"pointer", borderBottom:"1px solid #ffffff0d" }}><img src={img} style={{ width:40, height:60, borderRadius:8 }} alt="" /><div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:700 }}>{r.title}</div><div style={{ fontSize:11, opacity:.45 }}>{r.release_date?.slice(0,4)}</div></div><span>›</span></div>})}</div>}
        </div>
        <h3 style={{ fontSize:15, fontWeight:800, margin:"16px 2px 10px", display:"flex", gap:8 }}><span style={{ width:4, height:15, background:"#FFD400", borderRadius:99 }} />Quero Assistir <span style={{ fontSize:12, opacity:.4 }}>• {quero.length}</span></h3>
        <div style={{ display:"flex", gap:12, overflowX:"auto", padding:"4px 2px 14px" }}>{quero.length? quero.map(f=><Card key={f.id} f={f} />) : <div style={{ opacity:.35, fontSize:13 }}>Nenhum filme ainda</div>}</div>
        <h3 style={{ fontSize:15, fontWeight:800, margin:"8px 2px 10px", display:"flex", gap:8 }}><span style={{ width:4, height:15, background:"#22c55e", borderRadius:99 }} />Já Assisti <span style={{ fontSize:12, opacity:.4 }}>✓ {ja.length}</span></h3>
        <div style={{ display:"flex", gap:12, overflowX:"auto", padding:"4px 2px 14px" }}>{ja.length? ja.map(f=><Card key={f.id} f={f} />) : <div style={{ opacity:.35, fontSize:13 }}>Marque um filme como assistido</div>}</div>
      </main>
      <BottomNav />
    </div>
  )
}
