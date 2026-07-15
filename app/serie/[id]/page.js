"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getSupa } from "../../../lib/supabase"
import { useSerieLogic } from "../../../lib/useSerieLogic"
import ListaEps from "../../../components/ListaEps"

const supa = getSupa()

export default function SeriePage() {
  const { id } = useParams()
  const router = useRouter()
  const [serie, setSerie] = useState(null)
  const [tmdb, setTmdb] = useState(null)
  const [loading, setLoading] = useState(true)

  const cleanId = String(id).replace("tmdb-","")
  const isTmdb = /^\d+$/.test(cleanId)

  const {
    status, setStatus, progresso, toggleEp,
    marcarTodos, totalEps, pct, abandonar
  } = useSerieLogic(isTmdb? `tmdb-${cleanId}` : id, serie)

  useEffect(() => {
    async function load() {
      try {
        if (isTmdb) {
          const r = await fetch(`https://api.themoviedb.org/3/tv/${cleanId}?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}&language=pt-BR`)
          const j = await r.json()
          setSerie({ id: `tmdb-${cleanId}`, titulo: j.name, poster: j.poster_path, tmdb_id: j.id, ano: j.first_air_date?.slice(0,4) })
          setTmdb(j)
        } else {
          const { data } = await supa.from("series").select("*").eq("id", id).maybeSingle()
          if (data) {
            setSerie(data)
            if (data.tmdb_id) {
              const r = await fetch(`https://api.themoviedb.org/3/tv/${data.tmdb_id}?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}&language=pt-BR`)
              const j = await r.json()
              setTmdb(j)
            }
          }
        }
      } catch {}
      setLoading(false)
    }
    if (id) load()
  }, [id, cleanId, isTmdb])

  const handleAdd = async () => {
    if (!isTmdb || !tmdb) return
    const n = { tmdb_id: tmdb.id, titulo: tmdb.name, poster: tmdb.poster_path, ano: tmdb.first_air_date?.slice(0,4) }
    const { data } = await supa.from("series").insert([n]).select().single()
    if (data) { localStorage.setItem("status-" + data.id, "quero_assistir"); router.replace("/serie/" + data.id) }
  }

  if (loading) return <div style={{ background:"#080F25", minHeight:"100vh", display:"grid", placeItems:"center", color:"#fff" }}>Carregando...</div>
  if (!serie) return <div style={{ background:"#080F25", minHeight:"100vh", color:"#fff", padding:20 }}><button onClick={()=>router.back()}>‹ Voltar</button><p>Não encontrado</p></div>

  const img = serie.poster?.startsWith("/")? `https://image.tmdb.org/t/p/w500${serie.poster}` : serie.poster || (tmdb?.poster_path && `https://image.tmdb.org/t/p/w500${tmdb.poster_path}`)
  const bg = tmdb?.backdrop_path? `https://image.tmdb.org/t/p/w780${tmdb.backdrop_path}` : img
  const sinopse = serie.sinopse || tmdb?.overview || "Sem sinopse."

  return (
    <div style={{ minHeight:"100vh", background:"#080F25", color:"#fff", paddingBottom:90, fontFamily:"Inter,Sora,sans-serif" }}>
      <header style={{ height:56, display:"flex", justifyContent:"space-between", padding:"0 16px", alignItems:"center", position:"sticky", top:0, background:"#080F25", zIndex:10, borderBottom:"1px solid #ffffff10" }}>
        <button onClick={()=>router.back()} style={{ width:32, height:32, borderRadius:999, border:0, background:"#ffffff12", color:"#fff", cursor:"pointer" }}>‹</button>
        <b style={{ fontSize:13, maxWidth:160, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{serie.titulo}</b>
        <button onClick={()=>abandonar(router)} style={{ height:30, padding:"0 10px", borderRadius:999, border:"1px solid #ff5a5a33", background:"#ff5a5a14", color:"#ff8a8a", fontSize:11, fontWeight:700 }}>🗑 Abandonar</button>
      </header>

      <div style={{ position:"relative", height:220, overflow:"hidden" }}><img src={bg} style={{ width:"100%", height:"100%", objectFit:"cover", opacity:.45 }} alt="" /><div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, #080F25 10%, transparent 90%)" }} /></div>

      <main style={{ maxWidth:860, margin:"0 auto", padding:"0 16px", marginTop:-60, position:"relative", zIndex:2 }}>
        <div style={{ display:"flex", gap:14 }}>
          <img src={img} style={{ width:110, height:165, borderRadius:14, objectFit:"cover", border:"1px solid #ffffff18" }} alt="" />
          <div style={{ flex:1, paddingTop:22 }}>
            <div style={{ fontWeight:900, fontSize:18, fontFamily:"Sora,sans-serif", lineHeight:1.2 }}>{serie.titulo}</div>
            <div style={{ fontSize:12, opacity:.5, marginTop:6 }}>{serie.ano} • {pct}% • {totalEps} eps</div>
            {isTmdb ? (
              <button onClick={handleAdd} style={{ marginTop:12, height:38, padding:"0 16px", borderRadius:999, border:0, background:"#FFD400", color:"#000", fontWeight:900, fontSize:13, cursor:"pointer" }}>+ Adicionar à minha lista</button>
            ) : (
              <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap" }}>
                <button onClick={()=>setStatus("quero_assistir")} style={{ height:34, padding:"0 12px", borderRadius:999, border:0, background: status==="quero_assistir"? "#fff":"#ffffff14", color: status==="quero_assistir"? "#000":"#fff", fontWeight:700, fontSize:12 }}>Quero Assistir</button>
                <button onClick={()=>setStatus("assistindo")} style={{ height:34, padding:"0 12px", borderRadius:999, border:0, background: status==="assistindo"? "#FFD400":"#ffffff14", color: status==="assistindo"? "#000":"#fff", fontWeight:800, fontSize:12 }}>Assistindo {pct>0? `${pct}%`:""}</button>
                <button onClick={()=>setStatus("ja_maratonei")} style={{ height:34, padding:"0 12px", borderRadius:999, border: status==="ja_maratonei"? "0":"1px solid #FFD400", background: status==="ja_maratonei"? "#FFD400":"transparent", color: status==="ja_maratonei"? "#000":"#FFD400", fontWeight:900, fontSize:12 }}>✓ Maratonei</button>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop:18, background:"#121B3A", border:"1px solid #ffffff10", borderRadius:14, padding:14 }}>
          <div style={{ fontSize:11, fontWeight:800, opacity:.5, marginBottom:8 }}>SINOPSE</div>
          <div style={{ fontSize:13, lineHeight:1.6, opacity:.85 }}>{sinopse}</div>
        </div>

        {!isTmdb && <div style={{ marginTop:16 }}><ListaEps tmdb={tmdb} progresso={progresso} toggleEp={toggleEp} marcarTodos={marcarTodos} totalEps={totalEps} /></div>}
      </main>
    </div>
  )
}
