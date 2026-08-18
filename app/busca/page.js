"use client"
import { useEffect, useState } from "react"
import { BottomNav } from "../../components/BottomNav"
import { createClient } from "@supabase/supabase-js"

const IMG = "https://image.tmdb.org/t/p/w185"
const IMG_BIG = "https://image.tmdb.org/t/p/w342"
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

export default function BuscaPage() {
  const [userId, setUserId] = useState("anon")
  const [trendSeries, setTrendSeries] = useState([])
  const [lancSeries, setLancSeries] = useState([])
  const [trendFilmes, setTrendFilmes] = useState([])
  const [novidadesFilmes, setNovidadesFilmes] = useState([])
  const [busca, setBusca] = useState("")
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const key = process.env.NEXT_PUBLIC_TMDB_KEY
        if(!key) return
        const [tS, lS, tF, nF, sess] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/trending/tv/week?api_key=${key}&language=pt-BR`).then(r=>r.json()),
          fetch(`https://api.themoviedb.org/3/tv/on_the_air?api_key=${key}&language=pt-BR`).then(r=>r.json()),
          fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${key}&language=pt-BR`).then(r=>r.json()),
          fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${key}&language=pt-BR&page=1`).then(r=>r.json()),
          supabase.auth.getSession()
        ])
        setTrendSeries(tS.results?.slice(0,12) || [])
        setLancSeries(lS.results?.slice(0,12) || [])
        setTrendFilmes(tF.results?.slice(0,12) || [])
        setNovidadesFilmes(nF.results?.slice(0,12) || [])
        setUserId(sess.data.session?.user.id || "anon")
      } catch {}
    }
    load()
  }, [])

  useEffect(() => {
    if(!busca.trim()){ setResultados([]); return }
    const t = setTimeout(async () => {
      setBuscando(true)
      try{
        const key = process.env.NEXT_PUBLIC_TMDB_KEY
        const r = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${key}&language=pt-BR&query=${encodeURIComponent(busca)}&page=1`, { cache:'no-store' })
        const j = await r.json()
        const filtrados = (j.results || []).filter(it => it.media_type === "tv" || it.media_type === "movie").slice(0, 20)
        setResultados(filtrados)
      }catch{ setResultados([]) }
      setBuscando(false)
    }, 400)
    return () => clearTimeout(t)
  }, [busca])

  async function abrirSerie(it){
    const s = {
      id: String(it.id),
      titulo: it.name || it.title,
      img: it.poster_path? `${IMG_BIG}${it.poster_path}` : `https://picsum.photos/seed/${it.id}/400/600`,
      status: ""
    }
    if(userId!=="anon"){
      await supabase.from("user_series").upsert({
        user_id: userId,
        serie_id: s.id,
        titulo: s.titulo,
        img: s.img,
        q: s.titulo,
        status: "",
        origem: "tmdb",
        eps_vistos: [],
        updated_at: new Date().toISOString()
      }, { onConflict:"user_id,serie_id" })
    }
    localStorage.setItem(userId+":serie-atual", JSON.stringify(s))
    window.location.href="/serie/"+s.id
  }

  async function abrirFilme(it){
    const f = {
      id: String(it.id),
      titulo: it.title || it.name,
      img: it.poster_path? `${IMG_BIG}${it.poster_path}` : `https://picsum.photos/seed/${it.id}/400/600`,
      status: ""
    }
    if(userId!=="anon"){
      await supabase.from("user_filmes").upsert({
        user_id: userId,
        filme_id: f.id,
        titulo: f.titulo,
        img: f.img,
        status: "",
        updated_at: new Date().toISOString()
      }, { onConflict:"user_id,filme_id" })
    }
    localStorage.setItem(userId+":filme-atual", JSON.stringify(f))
    window.location.href="/filme/"+f.id
  }

  function abrirMulti(it){
    if(it.media_type === "movie") abrirFilme(it)
    else abrirSerie(it)
  }

  const Row = ({ title, list, onClick }) => (
    <div style={{ marginBottom:26 }}>
      <h3 style={{ fontSize:15, fontWeight:800, margin:"0 0 10px 2px", fontFamily:"Sora,sans-serif" }}>{title}</h3>
      <div style={{ display:"flex", gap:12, overflowX:"auto", padding:"4px 2px 12px", scrollbarWidth:"none" }}>
        {list.map(it => (
          <div key={it.id} onClick={function(){ onClick(it) }} style={{ minWidth:110, cursor:"pointer" }}>
            <div style={{ width:110, height:165, borderRadius:12, overflow:"hidden", background:"#121B3A", border:"1px solid #ffffff14", position:"relative" }}>
              <img src={it.poster_path? `${IMG}${it.poster_path}` : ""} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} alt="" />
              <div style={{ position:"absolute", top:5, left:5, fontSize:8, fontWeight:900, padding:"2px 5px", borderRadius:6, background: it.title || it.media_type==="movie"? "#00D9FF" : "#FFD400", color:"#000" }}>{it.title || it.media_type==="movie"? "FILME" : "SÉRIE"}</div>
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
        <div style={{ display:"flex", alignItems:"center", gap:10, background:"#121B3A", border:"1px solid #ffffff18", height:46, borderRadius:999, padding:"0 16px", marginBottom:20 }}>
          <span style={{ opacity:0.5 }}>🔍</span>
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar série ou filme..." style={{ flex:1, background:"transparent", border:0, outline:"none", color:"#fff", fontSize:14 }} />
          {busca && <span onClick={()=>setBusca("")} style={{ cursor:"pointer", opacity:0.5 }}>✕</span>}
        </div>

        {busca.trim()? (
          <div>
            <h3 style={{ fontSize:14, fontWeight:800, marginBottom:12 }}>{buscando? "Buscando..." : `${resultados.length} resultados para "${busca}"`}</h3>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(110px,1fr))", gap:12 }}>
              {resultados.map(it => (
                <div key={it.id} onClick={()=>abrirMulti(it)} style={{ cursor:"pointer" }}>
                  <div style={{ width:"100%", aspectRatio:"2/3", borderRadius:12, overflow:"hidden", background:"#121B3A", border:"1px solid #ffffff14", position:"relative" }}>
                    <img src={it.poster_path? `https://image.tmdb.org/t/p/w342${it.poster_path}` : `https://picsum.photos/seed/${it.id}/400/600`} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" />
                    <div style={{ position:"absolute", top:6, left:6, fontSize:8, fontWeight:900, padding:"3px 6px", borderRadius:6, background: it.media_type==="movie"? "#00D9FF" : "#FFD400", color:"#000" }}>{it.media_type==="movie"? "FILME" : "SÉRIE"}</div>
                  </div>
                  <div style={{ fontSize:11, marginTop:6, fontWeight:700, lineHeight:1.2, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{it.title || it.name}</div>
                  <div style={{ fontSize:10, opacity:0.5 }}>{it.media_type==="movie"? (it.release_date?.slice(0,4)||"") : (it.first_air_date?.slice(0,4)||"")}</div>
                </div>
              ))}
            </div>
            {resultados.length===0 &&!buscando && <div style={{ textAlign:"center", opacity:0.4, marginTop:30, fontSize:13 }}>Nenhum resultado</div>}
          </div>
        ) : (
          <>
            <Row title="🔥 Tendências da Semana - Filmes" list={trendFilmes} onClick={abrirFilme} />
            <Row title="🎬 Novidades nos Cinemas" list={novidadesFilmes} onClick={abrirFilme} />
            <Row title="🔥 Tendências da Semana - Séries" list={trendSeries} onClick={abrirSerie} />
            <Row title="✨ Lançamentos e No Ar - Séries" list={lancSeries} onClick={abrirSerie} />
          </>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
