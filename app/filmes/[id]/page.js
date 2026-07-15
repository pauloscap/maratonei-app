"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getSupa } from "../../../lib/supabase"

const supa = getSupa()

export default function FilmeDetalhe() {
  const { id } = useParams()
  const router = useRouter()
  const [filme, setFilme] = useState(null)
  const [tmdb, setTmdb] = useState(null)
  const [status, setStatus] = useState("quero_assistir")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        // 1. Tenta achar no Supabase pelo ID interno
        let { data } = await supa.from("series").select("*").eq("id", id).maybeSingle()

        // 2. Se não achou, pode ser um ID do TMDB vindo da busca
        if (!data &&!id.includes("-")) {
          const r = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}&language=pt-BR`)
          const j = await r.json()
          setTmdb(j)
          setFilme({
            id: id,
            titulo: j.title,
            poster: j.poster_path,
            sinopse: j.overview,
            ano: j.release_date?.slice(0,4),
            tmdb_id: j.id
          })
          setLoading(false)
          return
        }

        if (data) {
          setFilme(data)
          const s = localStorage.getItem("status-" + id)
          if (s) setStatus(s)

          // Busca detalhes do TMDB se tiver tmdb_id
          if (data.tmdb_id) {
            const r = await fetch(`https://api.themoviedb.org/3/movie/${data.tmdb_id}?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}&language=pt-BR`)
            const j = await r.json()
            setTmdb(j)
          }
        }
      } catch (e) { console.log(e) }
      setLoading(false)
    }
    if (id) load()
  }, [id])

  const setStt = (v) => {
    setStatus(v)
    try {
      localStorage.setItem("status-" + id, v)
      localStorage.setItem("_upd", Date.now())
    } catch {}
  }

  const abandonar = async () => {
    if (!confirm(`Abandonar "${filme?.titulo}"?`)) return
    try {
      localStorage.removeItem("status-" + id)
      localStorage.removeItem("progress-" + id)
      await supa.from("series").delete().eq("id", id)
      router.push("/")
    } catch (e) { alert(e.message) }
  }

  if (loading) return <div style={{ background:"#080F25", minHeight:"100vh", display:"grid", placeItems:"center", color:"#fff", fontFamily:"Inter,sans-serif" }}>Carregando...</div>
  if (!filme) return <div style={{ background:"#080F25", minHeight:"100vh", color:"#fff", padding:20 }}><button onClick={()=>router.back()}>‹ Voltar</button><p style={{ marginTop:20 }}>Filme não encontrado</p></div>

  const img = filme.poster?.startsWith("/")? `https://image.tmdb.org/t/p/w500${filme.poster}` : filme.poster || tmdb?.poster_path && `https://image.tmdb.org/t/p/w500${tmdb.poster_path}`
  const bg = tmdb?.backdrop_path? `https://image.tmdb.org/t/p/w780${tmdb.backdrop_path}` : img
  const sinopse = filme.sinopse || tmdb?.overview || "Sem sinopse disponível."

  return (
    <div style={{ minHeight:"100vh", background:"#080F25", color:"#fff", paddingBottom:90, fontFamily:"Inter,Sora,sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800&family=Sora:wght@600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ height:56, display:"flex", justifyContent:"space-between", padding:"0 16px", alignItems:"center", position:"sticky", top:0, background:"#080F25", zIndex:10, borderBottom:"1px solid #ffffff10" }}>
        <button onClick={()=>router.back()} style={{ width:32, height:32, borderRadius:999, border:0, background:"#ffffff12", color:"#fff", cursor:"pointer" }}>‹</button>
        <b style={{ fontSize:14, maxWidth:180, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{filme.titulo}</b>
        <button onClick={abandonar} style={{ height:30, padding:"0 10px", borderRadius:999, border:"1px solid #ff5a5a33", background:"#ff5a5a14", color:"#ff8a8a", fontSize:11, fontWeight:700 }}>🗑 Abandonar</button>
      </div>

      {/* Banner */}
      <div style={{ position:"relative", height:220, overflow:"hidden" }}>
        <img src={bg} style={{ width:"100%", height:"100%", objectFit:"cover", opacity:.45 }} alt="" />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, #080F25 10%, transparent 90%)" }} />
      </div>

      <div style={{ maxWidth:860, margin:"0 auto", padding:"0 16px", marginTop:-60, position:"relative", zIndex:2 }}>
        <div style={{ display:"flex", gap:14 }}>
          <img src={img} style={{ width:110, height:165, borderRadius:14, objectFit:"cover", background:"#121B3A", border:"1px solid #ffffff18", flexShrink:0 }} alt="" />
          <div style={{ flex:1, paddingTop:20 }}>
            <div style={{ fontWeight:900, fontSize:18, lineHeight:1.2, fontFamily:"Sora,sans-serif" }}>{filme.titulo}</div>
            <div style={{ fontSize:12, opacity:.5, marginTop:6 }}>{filme.ano || tmdb?.release_date?.slice(0,4)} • {tmdb?.runtime? `${tmdb.runtime} min` : "Filme"} • {tmdb?.vote_average?.toFixed(1)}★</div>
            <div style={{ display:"flex", gap:6, marginTop:12, flexWrap:"wrap" }}>
              <button onClick={()=>setStt("quero_assistir")} style={{ height:36, padding:"0 14px", borderRadius:999, border:0, background: status==="quero_assistir"? "#fff":"#ffffff14", color: status==="quero_assistir"? "#000":"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>Quero Assistir</button>
              <button onClick={()=>setStt("ja_assisti")} style={{ height:36, padding:"0 14px", borderRadius:999, border:0, background: status==="ja_assisti"? "#fff":"#ffffff14", color: status==="ja_assisti"? "#000":"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>Já Assisti</button>
              <button onClick={()=>setStt("ja_maratonei")} style={{ height:36, padding:"0 14px", borderRadius:999, border: status==="ja_maratonei"? "0":"1px solid #FFD400", background: status==="ja_maratonei"? "#FFD400":"transparent", color: status==="ja_maratonei"? "#000":"#FFD400", fontWeight:900, fontSize:13, cursor:"pointer" }}>✓ Já Maratonei</button>
            </div>
          </div>
        </div>

        <div style={{ marginTop:20, background:"#121B3A", border:"1px solid #ffffff10", borderRadius:14, padding:14 }}>
          <h3 style={{ fontSize:13, fontWeight:800, opacity:.6, marginBottom:8, fontFamily:"Sora,sans-serif" }}>SINOPSE</h3>
          <p style={{ fontSize:13, lineHeight:1.6, opacity:.85 }}>{sinopse}</p>
        </div>
      </div>
    </div>
  )
}
