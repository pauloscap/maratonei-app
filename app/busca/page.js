"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { BottomNav } from "../../components/BottomNav"

const IMG = "https://image.tmdb.org/t/p/w185"

export default function BuscaPage() {
  const [userId, setUserId] = useState("anon")
  const [trendSeries, setTrendSeries] = useState([])
  const [lancSeries, setLancSeries] = useState([])
  const [trendFilmes, setTrendFilmes] = useState([])
  const [novidadesFilmes, setNovidadesFilmes] = useState([])

  useEffect(() => {
    async function load() {
      try {
        const key = process.env.NEXT_PUBLIC_TMDB_KEY
        if(!key) return
        const [tS, lS, tF, nF, uid] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/trending/tv/week?api_key=${key}&language=pt-BR`).then(r=>r.json()),
          fetch(`https://api.themoviedb.org/3/tv/on_the_air?api_key=${key}&language=pt-BR`).then(r=>r.json()),
          fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${key}&language=pt-BR`).then(r=>r.json()),
          fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${key}&language=pt-BR&page=1`).then(r=>r.json()),
          import("@supabase/supabase-js").then(async m=>{
            const c=m.createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)
            const s=await c.auth.getSession(); return s.data.session?.user.id||"anon"
          })
        ])
        setTrendSeries(tS.results?.slice(0,12) || [])
        setLancSeries(lS.results?.slice(0,12) || [])
        setTrendFilmes(tF.results?.slice(0,12) || [])
        setNovidadesFilmes(nF.results?.slice(0,12) || [])
        setUserId(uid)
      } catch {}
    }
    load()
  }, [])

  function abrirSerie(it){
    const s={ id:String(it.id), titulo:it.name||it.title, img:it.poster_path?`https://image.tmdb.org/t/p/w342${it.poster_path}`:`https://picsum.photos/seed/${it.id}/400/600`, status:"quero_assistir" }
    localStorage.setItem(userId+":serie-atual", JSON.stringify(s))
    window.location.href="/serie/"+s.id
  }
  function abrirFilme(it){
    const f={ id:String(it.id), titulo:it.title||it.name, img:it.poster_path?`https://image.tmdb.org/t/p/w342${it.poster_path}`:`https://picsum.photos/seed/${it.id}/400/600`, status:"quero_assistir" }
    localStorage.setItem(userId+":filme-atual", JSON.stringify(f))
    window.location.href="/filme/"+f.id
  }

  const Row = ({ title, list, onClick }) => (
    <div style={{ marginBottom:26 }}>
      <h3 style={{ fontSize:15, fontWeight:800, margin:"0 0 10px 2px", fontFamily:"Sora,sans-serif" }}>{title}</h3>
      <div style={{ display:"flex", gap:12, overflowX:"auto", padding:"4px 2px 12px", scrollbarWidth:"none" }}>
        {list.map(it => (
          <div key={it.id} onClick={function(){ onClick(it) }} style={{ minWidth:110, cursor:"pointer" }}>
            <div style={{ width:110, height:165, borderRadius:12, overflow:"hidden", background:"#121B3A", border:"1px solid #ffffff14", position:"relative" }}>
              <img src={it.poster_path? `${IMG}${it.poster_path}` : ""} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} alt="" />
            </div>
            <div style={{ fontSize:11, marginTop:6, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:110, opacity:.85, fontWeight:600 }}>{it.name||it.title}</div>
          </div>
        ))}
        {list.length===0 && <div style={{fontSize:12, opacity:0.4, padding:"20px 0"}}>Carregando...</div>}
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

        <Row title="🔥 Tendências da Semana - Filmes" list={trendFilmes} onClick={abrirFilme} />
        <Row title="🎬 Novidades nos Cinemas" list={novidadesFilmes} onClick={abrirFilme} />
        <Row title="🔥 Tendências da Semana - Séries" list={trendSeries} onClick={abrirSerie} />
        <Row title="✨ Lançamentos e No Ar - Séries" list={lancSeries} onClick={abrirSerie} />
      </main>
      <BottomNav />
    </div>
  )
}
