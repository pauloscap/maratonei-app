"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { loadFilmes, loadFilmesLS, buscarFilmeTMDB } from "../../lib/filmesLogic"
import { BottomNav } from "../../components/BottomNav"

export default function FilmesPage() {
  const router = useRouter()
  const [F, setF] = useState([])
  const [M, setM] = useState({})
  const [q, setQ] = useState("")
  const [R, setR] = useState([])

  useEffect(() => { loadFilmes(setF) }, [])
  useEffect(() => { if (F.length) loadFilmesLS(F, setM) }, [F])

  const quero = F.filter(f => (M[f.id]||"quero_assistir") === "quero_assistir")
  const assisti = F.filter(f => M[f.id] === "ja_assisti")

  const Card = ({ f }) => {
    const img = f.poster?.startsWith("/")? `https://image.tmdb.org/t/p/w500${f.poster}` : f.poster || ""
    const ok = M[f.id]==="ja_assisti"
    return (
      <Link href={`/filme/${f.tmdb_id || f.id}`} style={{ textDecoration:"none", color:"#fff", minWidth:136 }}>
        <div style={{ width:136, height:204, borderRadius:14, overflow:"hidden", background:"#121B3A", position:"relative", border:"1px solid #ffffff12" }}>
          <img src={img} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" />
          {ok && <div style={{ position:"absolute", left:0, right:0, bottom:0, height:5, background:"#22c55e" }} />}
        </div>
        <div style={{ fontSize:12.5, marginTop:7, maxWidth:136, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", fontWeight:600 }}>{f.titulo}</div>
      </Link>
    )
  }

  const goFilme = (id) => router.push(`/filme/${id}`)

  return (
    <div style={{ minHeight:"100vh", background:"#080F25", color:"#fff", paddingBottom:90, fontFamily:"Inter,Sora,sans-serif" }}>
      <header style={{ height:60, padding:"0 16px", display:"flex", alignItems:"center", borderBottom:"1px solid #ffffff10", position:"sticky", top:0, background:"rgba(8,15,37,.9)", backdropFilter:"blur(12px)", zIndex:10 }}>
        <h1 style={{ fontSize:18, fontWeight:800 }}>Filmes</h1>
      </header>

      <main style={{ maxWidth:1100, margin:"0 auto", padding:"16px 12px" }}>
        <div style={{ position:"relative", maxWidth:560, margin:"0 auto 20px" }}>
          <input value={q} onChange={e=>{ setQ(e.target.value); buscarFilmeTMDB(e.target.value, setR)}} placeholder="Buscar filme..." style={{ width:"100%", height:46, borderRadius:999, background:"#121B3A", border:"1px solid #ffffff18", padding:"0 16px 0 42px", color:"#fff", outline:"none" }} />
          <span style={{ position:"absolute", left:15, top:12, opacity:.5 }}>🔍</span>
          {R.length>0 && <div style={{ position:"absolute", top:52, left:0, right:0, background:"#121B3A", borderRadius:16, border:"1px solid #ffffff18", zIndex:9999, overflow:"hidden", boxShadow:"0 16px 40px #0008" }}>
            {R.map(r=>{ const img=r.poster_path? `https://image.tmdb.org/t/p/w92${r.poster_path}`:""; return <div key={r.id} onClick={()=>goFilme(r.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderBottom:"1px solid #ffffff0d", cursor:"pointer" }}><img src={img} style={{ width:40, height:60, borderRadius:8, objectFit:"cover" }} alt="" /><div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:700 }}>{r.title}</div><div style={{ fontSize:11, opacity:.45 }}>{r.release_date?.slice(0,4)} • {r.vote_average?.toFixed(1)}★</div></div><span>›</span></div>})}
          </div>}
        </div>

        <h3 style={{ fontSize:15, fontWeight:800, margin:"16px 2px 10px", display:"flex", gap:8, alignItems:"center" }}><span style={{ width:4, height:15, background:"#FFD400", borderRadius:99 }} />Quero Assistir <span style={{ fontSize:12, opacity:.4 }}>• {quero.length}</span></h3>
        <div style={{ display:"flex", gap:12, overflowX:"auto", padding:"4px 2px 14px" }}>{quero.length? quero.map(f=> <Card key={f.id} f={f} />) : <div style={{ opacity:.35, fontSize:13, padding:"10px 4px" }}>Nenhum filme ainda</div>}</div>

        <h3 style={{ fontSize:15, fontWeight:800, margin:"8px 2px 10px", display:"flex", gap:8, alignItems:"center" }}><span style={{ width:4, height:15, background:"#22c55e", borderRadius:99 }} />Já Assisti <span style={{ fontSize:12, opacity:.4 }}>✓ {assisti.length}</span></h3>
        <div style={{ display:"flex", gap:12, overflowX:"auto", padding:"4px 2px 14px" }}>{assisti.length? assisti.map(f=> <Card key={f.id} f={f} />) : <div style={{ opacity:.35, fontSize:13, padding:"10px 4px" }}>Marque um filme como assistido</div>}</div>
      </main>

      <BottomNav />
    </div>
  )
}
