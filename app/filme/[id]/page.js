"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getSupa } from "../../../lib/supabase"

const supa = getSupa()

export default function FilmePage() {
  const { id } = useParams()
  const router = useRouter()
  const [f, setF] = useState(null)
  const [st, setSt] = useState("quero_assistir")
  const [savedId, setSavedId] = useState(null)

  useEffect(() => {
    if (!id) return
    const key = process.env.NEXT_PUBLIC_TMDB_KEY
    fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${key}&language=pt-BR`)
     .then(r => r.json())
     .then(async j => {
        setF(j)
        // verifica se já está salvo no Supabase
        try {
          const { data } = await supa.from("filmes").select("*").eq("tmdb_id", j.id).maybeSingle()
          if (data) {
            setSavedId(data.id)
            const s = localStorage.getItem("filme-status-" + data.id)
            if (s) setSt(s)
          }
        } catch {}
      })
  }, [id])

  const fixar = async (status) => {
    if (!f) return
    setSt(status)
    try {
      let rowId = savedId
      // 1. Se ainda não existe no Supabase, cria
      if (!rowId) {
        const novo = {
          tmdb_id: f.id,
          titulo: f.title,
          poster: f.poster_path,
          ano: f.release_date? new Date(f.release_date).getFullYear() : null
        }
        const { data, error } = await supa.from("filmes").insert([novo]).select().single()
        if (error) throw error
        rowId = data.id
        setSavedId(rowId)
      }
      // 2. Salva status no localStorage usando o ID do Supabase
      localStorage.setItem("filme-status-" + rowId, status)
      localStorage.setItem("_upd", Date.now())
    } catch (e) {
      alert("Erro ao fixar: " + e.message)
    }
  }

  const abandonar = async () => {
    if (!confirm(`Abandonar "${f?.title}"?`)) return
    try {
      if (savedId) {
        await supa.from("filmes").delete().eq("id", savedId)
        localStorage.removeItem("filme-status-" + savedId)
      }
      router.push("/filmes")
    } catch (e) { alert(e.message) }
  }

  if (!f) return <div style={{ background:"#080F25", minHeight:"100vh", display:"grid", placeItems:"center", color:"#fff" }}>Carregando...</div>
  if (!f.title) return <div style={{ background:"#080F25", minHeight:"100vh", padding:20, color:"#fff" }}><button onClick={()=>router.back()}>‹ Voltar</button></div>

  const poster = f.poster_path? `https://image.tmdb.org/t/p/w500${f.poster_path}` : ""
  const bg = f.backdrop_path? `https://image.tmdb.org/t/p/w780${f.backdrop_path}` : poster

  return (
    <div style={{ minHeight:"100vh", background:"#080F25", color:"#fff", paddingBottom:90, fontFamily:"Inter,sans-serif" }}>
      <header style={{ height:56, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", borderBottom:"1px solid #ffffff10", position:"sticky", top:0, background:"#080F25", zIndex:10 }}>
        <button onClick={()=>router.back()} style={{ width:32, height:32, borderRadius:999, border:0, background:"#ffffff14", color:"#fff", cursor:"pointer" }}>‹</button>
        <b style={{ fontSize:13, maxWidth:180, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{f.title}</b>
        <button onClick={abandonar} style={{ height:30, padding:"0 10px", borderRadius:999, border:"1px solid #ff5a5a33", background:"#ff5a5a14", color:"#ff8a8a", fontSize:11, fontWeight:700 }}>Abandonar</button>
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
              <button onClick={()=>fixar("quero_assistir")} style={{ height:36, padding:"0 14px", borderRadius:999, border:0, cursor:"pointer", background: st==="quero_assistir"? "#fff":"#ffffff14", color: st==="quero_assistir"? "#000":"#fff", fontWeight:700, fontSize:13 }}>Quero Assistir</button>
              <button onClick={()=>fixar("ja_assisti")} style={{ height:36, padding:"0 14px", borderRadius:999, border:0, cursor:"pointer", background: st==="ja_assisti"? "#22c55e":"#ffffff14", color: st==="ja_assisti"? "#000":"#fff", fontWeight:800, fontSize:13 }}>Já Assisti</button>
            </div>
            {savedId && <div style={{ fontSize:11, opacity:.5, marginTop:8 }}>✓ Fixado na sua lista</div>}
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
