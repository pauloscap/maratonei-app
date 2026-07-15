"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BottomNav } from "../../components/BottomNav"

export default function FilmesPage() {
  const router = useRouter()
  const [q, setQ] = useState("")
  const [R, setR] = useState([])

  async function buscar(v) {
    setQ(v)
    if (v.length < 2) { setR([]); return }
    try {
      const key = process.env.NEXT_PUBLIC_TMDB_KEY
      const r = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${key}&language=pt-BR&query=${encodeURIComponent(v)}`)
      const j = await r.json()
      setR(j.results?.slice(0, 8) || [])
    } catch { setR([]) }
  }

  const goFilme = (id) => router.push(`/filme/${id}`)

  return (
    <div style={{ minHeight:"100vh", background:"#080F25", color:"#fff", paddingBottom:90, fontFamily:"Inter,Sora,sans-serif" }}>
      <header style={{ height:60, padding:"0 16px", display:"flex", alignItems:"center", borderBottom:"1px solid #ffffff10", position:"sticky", top:0, background:"rgba(8,15,37,.9)", backdropFilter:"blur(12px)", zIndex:10 }}>
        <h1 style={{ fontSize:18, fontWeight:800, fontFamily:"Sora,sans-serif" }}>Filmes</h1>
      </header>

      <main style={{ maxWidth:1100, margin:"0 auto", padding:"16px 12px" }}>
        <div style={{ position:"relative", maxWidth:560, margin:"0 auto 20px" }}>
          <input value={q} onChange={e=>buscar(e.target.value)} placeholder="Buscar filme..." style={{ width:"100%", height:46, borderRadius:999, background:"#121B3A", border:"1px solid #ffffff18", padding:"0 16px 0 42px", color:"#fff", outline:"none" }} />
          <span style={{ position:"absolute", left:15, top:12, opacity:.5 }}>🔍</span>
          {R.length>0 && (
            <div style={{ position:"absolute", top:52, left:0, right:0, background:"#121B3A", borderRadius:16, border:"1px solid #ffffff18", zIndex:9999, overflow:"hidden", boxShadow:"0 16px 40px #0008" }}>
              {R.map(r=>{
                const img = r.poster_path? `https://image.tmdb.org/t/p/w92${r.poster_path}` : ""
                return (
                  <div key={r.id} onClick={()=>goFilme(r.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderBottom:"1px solid #ffffff0d", cursor:"pointer" }}>
                    <img src={img} style={{ width:40, height:60, borderRadius:8, objectFit:"cover", background:"#0A0F25" }} alt="" />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700 }}>{r.title}</div>
                      <div style={{ fontSize:11, opacity:.45 }}>{r.release_date?.slice(0,4)} • {r.vote_average?.toFixed(1)}★ Filme</div>
                    </div>
                    <div style={{ fontSize:12, opacity:.6 }}>›</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ textAlign:"center", marginTop:60, opacity:.35 }}>
          <div style={{ fontSize:40, marginBottom:10 }}>🎬</div>
          <div style={{ fontSize:14 }}>Busque um filme acima</div>
          <div style={{ fontSize:12, marginTop:6 }}>Clique no resultado para ver banner e sinopse</div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
