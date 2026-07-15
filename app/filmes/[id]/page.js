"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

export default function FilmePage() {
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [status, setStatus] = useState("quero_assistir")

  useEffect(() => {
    const cleanId = String(id).replace("tmdb-","")
    async function load() {
      try {
        const key = process.env.NEXT_PUBLIC_TMDB_KEY
        const r = await fetch(`https://api.themoviedb.org/3/movie/${cleanId}?api_key=${key}&language=pt-BR`)
        const j = await r.json()
        setData(j)
        const s = localStorage.getItem("filme-status-" + cleanId)
        if (s) setStatus(s)
      } catch {}
    }
    if (cleanId) load()
  }, [id])

  const save = (v) => {
    const cleanId = String(id).replace("tmdb-","")
    setStatus(v)
    localStorage.setItem("filme-status-" + cleanId, v)
    try { localStorage.setItem("_upd", Date.now()) } catch {}
  }

  if (!data) return <div style={{ background:"#080F25", minHeight:"100vh", display:"grid", placeItems:"center", color:"#fff" }}>Carregando filme...</div>

  const img = data.poster_path? `https://image.tmdb.org/t/p/w500${data.poster_path}` : ""
  const bg = data.backdrop_path? `https://image.tmdb.org/t/p/w780${data.backdrop_path}` : img

  return (
    <div style={{ minHeight:"100vh", background:"#080F25", color:"#fff", fontFamily:"Inter,Sora,sans-serif", paddingBottom:90 }}>
      <div style={{ height:56, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", borderBottom:"1px solid #ffffff10", position:"sticky", top:0, background:"#080F25", zIndex:10 }}>
        <button onClick={()=>router.back()} style={{ width:34, height:34, borderRadius:999, border:0, background:"#ffffff14", color:"#fff", cursor:"pointer" }}>‹</button>
        <b style={{ fontSize:13, maxWidth:200, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{data.title}</b>
        <div style={{ width:34 }} />
      </div>

      <div style={{ position:"relative", height:230, overflow:"hidden" }}>
        <img src={bg} style={{ width:"100%", height:"100%", objectFit:"cover", opacity:.5 }} alt="" />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, #080F25 15%, transparent 85%)" }} />
      </div>

      <div style={{ maxWidth:860, margin:"0 auto", padding:"0 16px", marginTop:-70, position:"relative" }}>
        <div style={{ display:"flex", gap:14 }}>
          <img src={img} style={{ width:110, height:165, borderRadius:14, objectFit:"cover", border:"1px solid #ffffff18" }} alt="" />
          <div style={{ flex:1, paddingTop:26 }}>
            <div style={{ fontWeight:900, fontSize:18, fontFamily:"Sora,sans-serif", lineHeight:1.2 }}>{data.title}</div>
            <div style={{ fontSize:12, opacity:.5, marginTop:6 }}>{data.release_date?.slice(0,4)} • {data.runtime}m • {data.vote_average?.toFixed(1)}★</div>
            <div style={{ display:"flex", gap:8, marginTop:14, flexWrap:"wrap" }}>
              <button onClick={()=>save("quero_assistir")} style={{ height:36, padding:"0 14px", borderRadius:999, border:0, background: status==="quero_assistir"? "#fff":"#ffffff14", color: status==="quero_assistir"? "#000":"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>Quero Assistir</button>
              <button onClick={()=>save("ja_assisti")} style={{ height:36, padding:"0 14px", borderRadius:999, border:0, background: status==="ja_assisti"? "#22c55e":"#ffffff14", color: status==="ja_assisti"? "#000":"#fff", fontWeight:800, fontSize:13, cursor:"pointer" }}>✓ Já Assisti</button>
              <button onClick={()=>{ if(confirm("Abandonar?")){ localStorage.removeItem("filme-status-"+id); router.push("/filmes") } }} style={{ height:36, padding:"0 12px", borderRadius:999, border:"1px solid #ff5a5a33", background:"#ff5a5a12", color:"#ff8a8a", fontSize:12, fontWeight:700, cursor:"pointer" }}>Abandonar</button>
            </div>
          </div>
        </div>
        <div style={{ marginTop:20, background:"#121B3A", border:"1px solid #ffffff10", borderRadius:14, padding:14 }}>
          <div style={{ fontSize:11, fontWeight:800, opacity:.5, marginBottom:8, letterSpacing:.5 }}>SINOPSE</div>
          <div style={{ fontSize:13, lineHeight:1.6, opacity:.85 }}>{data.overview || "Sem sinopse."}</div>
        </div>
      </div>
    </div>
  )
}
