"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

export default function FilmePage() {
  const { id } = useParams()
  const router = useRouter()
  const [f, setF] = useState(null)
  const [st, setSt] = useState("quero_assistir")

  useEffect(() => {
    if (!id) return
    const key = process.env.NEXT_PUBLIC_TMDB_KEY
    fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${key}&language=pt-BR`)
     .then(r => r.json())
     .then(j => {
        setF(j)
        try {
          const s = localStorage.getItem("filme-" + id)
          if (s) setSt(s)
        } catch {}
      })
  }, [id])

  const save = (v) => {
    setSt(v)
    try { localStorage.setItem("filme-" + id, v); localStorage.setItem("_upd", Date.now()) } catch {}
  }

  if (!f) return <div style={{ background:"#080F25", minHeight:"100vh", display:"grid", placeItems:"center", color:"#fff" }}>Carregando...</div>
  if (!f.title) return <div style={{ background:"#080F25", minHeight:"100vh", padding:20, color:"#fff" }}><button onClick={()=>router.back()}>‹ Voltar</button><p>Filme não encontrado. Verifique a chave TMDB.</p></div>

  const poster = f.poster_path? `https://image.tmdb.org/t/p/w500${f.poster_path}` : ""
  const bg = f.backdrop_path? `https://image.tmdb.org/t/p/w780${f.backdrop_path}` : poster

  return (
    <div style={{ minHeight:"100vh", background:"#080F25", color:"#fff", paddingBottom:90, fontFamily:"Inter,sans-serif" }}>
      <header style={{ height:56, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", borderBottom:"1px solid #ffffff10", position:"sticky", top:0, background:"#080F25", zIndex:10 }}>
        <button onClick={()=>router.back()} style={{ width:32, height:32, borderRadius:999, border:0, background:"#ffffff14", color:"#fff", cursor:"pointer" }}>‹</button>
        <b style={{ fontSize:13, maxWidth:180, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{f.title}</b>
        <button onClick={()=>{ if(confirm("Abandonar?")){ try{localStorage.removeItem("filme-"+id)}catch{}; router.push("/filmes") } }} style={{ height:30, padding:"0 10px", borderRadius:999, border:"1px solid #ff5a5a33", background:"#ff5a5a14", color:"#ff8a8a", fontSize:11, fontWeight:700 }}>Abandonar</button>
      </header>

      <div style={{ height:220, position:"relative", overflow:"hidden" }}>
        <img src={bg} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", opacity:.5 }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, #080F25 15%, transparent 85%)" }} />
      </div>

      <main style={{ maxWidth:860, margin:"0 auto", padding:"0 16px", marginTop:-60, position:"relative" }}>
        <div style={{ display:"flex", gap:14 }}>
          <img src={poster} alt="" style={{ width:110, height:165, borderRadius:14, objectFit:"cover", background:"#121B3A", border:"1px solid #ffffff18" }} />
          <div style={{ flex:1, paddingTop:22 }}>
            <div style={{ fontWeight:900, fontSize:18, lineHeight:1.2 }}>{f.title}</div>
            <div style={{ fontSize:12, opacity:.5, marginTop:6 }}>{f.release_date?.slice(0,4)} • {f.runtime} min • {f.vote_average?.toFixed(1)}★</div>
            <div style={{ display:"flex", gap:8, marginTop:14, flexWrap:"wrap" }}>
              <button onClick={()=>save("quero_assistir")} style={{ height:36, padding:"0 14px", borderRadius:999, border:0, cursor:"pointer", background: st==="quero_assistir"? "#fff":"#ffffff14", color: st==="quero_assistir"? "#000":"#fff", fontWeight:700, fontSize:13 }}>Quero Assistir</button>
              <button onClick={()=>save("ja_assisti")} style={{ height:36, padding:"0 14px", borderRadius:999, border:0, cursor:"pointer", background: st==="ja_assisti"? "#22c55e":"#ffffff14", color: st==="ja_assisti"? "#000":"#fff", fontWeight:800, fontSize:13 }}>Já Assisti</button>
            </div>
          </div>
        </div>

        <div style={{ marginTop:20, background:"#121B3A", border:"1px solid #ffffff10", borderRadius:14, padding:14 }}>
          <div style={{ fontSize:11, fontWeight:800, opacity:.5, marginBottom:8, letterSpacing:.5 }}>SINOPSE</div>
          <div style={{ fontSize:13, lineHeight:1.6, opacity:.85 }}>{f.overview || "Sem sinopse."}</div>
        </div>
      </main>
    </div>
  )
}
