"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { BottomNav } from "../../components/BottomNav"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)
const TMDB_KEY = "4e44d9029b1273360df0be1de39768d1"
const TMDB_IMG = "https://image.tmdb.org/t/p/w342"

const BASE_FILMES = [
  { id: "155", titulo: "Batman: Cavaleiro das Trevas", titulo_original: "The Dark Knight", img: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg", status: "quero_assistir" },
  { id: "299534", titulo: "Vingadores: Ultimato (2019)", titulo_original: "Avengers: Endgame", img: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg", status: "ja_assisti" },
]

export default function FilmesPage() {
  const [userId, setUserId] = useState("anon")
  const [busca, setBusca] = useState("")
  const [filmes, setFilmes] = useState([])
  const [resultados, setResultados] = useState([])
  const [view, setView] = useState("grade")

  useEffect(() => {
    async function init() {
      const s = await supabase.auth.getSession()
      if (!s.data.session) { window.location.href = "/login"; return }
      const uid = s.data.session.user.id
      setUserId(uid)
      const v = localStorage.getItem(uid + ":view-filmes")
      if (v) setView(v)
      const raw = localStorage.getItem(uid + ":meus-filmes")
      let lista = raw? JSON.parse(raw) : BASE_FILMES
      lista = lista.map(function(f){ let st=f.status; if(st==="maratonei"||st==="assistido") st="ja_assisti"; if(st==="assistindo") st="quero_assistir"; return {...f, id:String(f.id), status:st||"quero_assistir"} }).filter(function(f){ return f.titulo!=="Game of Thrones" })
      setFilmes(lista)
    }
    init()
  }, [])

  useEffect(function(){
    if (!busca.trim()) { setResultados([]); return }
    const t = setTimeout(async function(){
      try {
        const q = encodeURIComponent(busca.trim())
        const [rPt, rEn] = await Promise.all([
          fetch("https://api.themoviedb.org/3/search/movie?api_key=" + TMDB_KEY + "&language=pt-BR&query=" + q + "&include_adult=false&page=1"),
          fetch("https://api.themoviedb.org/3/search/movie?api_key=" + TMDB_KEY + "&language=en-US&query=" + q + "&include_adult=false&page=1")
        ])
        const jPt = await rPt.json()
        const jEn = await rEn.json()
        const map = {}
        const todos = [].concat(jPt.results||[]).concat(jEn.results||[])
        todos.forEach(function(m){
          const id = String(m.id)
          if (map[id]) return
          const tituloPt = m.title || m.original_title
          const ano = m.release_date? " (" + m.release_date.slice(0,4) + ")" : ""
          map[id] = {
            id: id,
            titulo: tituloPt + ano,
            titulo_original: m.original_title,
            img: m.poster_path? TMDB_IMG + m.poster_path : "https://picsum.photos/seed/" + id + "/400/600"
          }
        })
        let lista = Object.values(map).slice(0,12)
        const termo = busca.toLowerCase()
        lista.sort(function(a,b){ const aPt=a.titulo.toLowerCase().includes(termo)?0:1; const bPt=b.titulo.toLowerCase().includes(termo)?0:1; return aPt-bPt })
        setResultados(lista)
      } catch(e){ setResultados([]) }
    }, 350)
    return function(){ clearTimeout(t) }
  }, [busca])

  function toggle(){ const n = view==="grade"? "lista" : "grade"; setView(n); localStorage.setItem(userId + ":view-filmes", n) }
  async function add(f){
    const novo = { id: String(f.id), titulo: f.titulo, titulo_original: f.titulo_original, img: f.img, status: "quero_assistir" }
    const nl = [novo].concat(filmes.filter(function(x){ return String(x.id)!== String(novo.id) }))
    setFilmes(nl)
    localStorage.setItem(userId + ":meus-filmes", JSON.stringify(nl))
    try { await supabase.from("user_filmes").upsert({ user_id: userId, filme_id: novo.id, titulo: novo.titulo, img: novo.img, status: novo.status, updated_at: new Date().toISOString() }, { onConflict: "user_id,filme_id" }) } catch(e){}
    setBusca(""); setResultados([])
  }
  function abrir(f){ localStorage.setItem(userId + ":filme-atual", JSON.stringify(f)); window.location.href = "/filme/" + f.id }

  const quero = filmes.filter(function(x){ return x.status === "quero_assistir" })
  const vistos = filmes.filter(function(x){ return x.status === "ja_assisti" })
  function Secao(p){ return <div style={{ marginTop:22 }}><div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10 }}><div style={{ width:3, height:14, background:p.cor, borderRadius:99 }} /><b style={{ fontSize:14 }}>{p.titulo}</b><span style={{ fontSize:11, opacity:0.4 }}> - {p.qtd}</span></div><div className={view==="grade"? "grid" : "list"}>{p.children}</div></div> }

  return (
    <div style={{ minHeight:"100vh", background:"#0A0F2A", color:"#fff", paddingBottom:90 }}>
      <style>{`
  .grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px; } @media(min-width:768px){.grid{ grid-template-columns:repeat(5,1fr); } } @media(min-width:1024px){.grid{ grid-template-columns:repeat(6,1fr); } }
  .list{ display:grid; gap:8px; }.card{ cursor:pointer; }.poster{ width:100%; aspect-ratio:2/3; border-radius:12px; overflow:hidden; background:#12182F; border:1px solid #222b5a; position:relative; }.poster img{ width:100%; height:100%; object-fit:cover; }.badge{ position:absolute; top:6px; left:6px; background:#FFD400; color:#000; font-size:8px; font-weight:900; padding:3px 6px; border-radius:6px; }.tit{ font-size:12px; font-weight:700; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }.row{ display:flex; gap:12px; padding:10px; background:#12182F; border:1px solid #222b5a; border-radius:12px; cursor:pointer; }.row img{ width:52px; height:78px; border-radius:8px; object-fit:cover; }
      `}</style>
      <header style={{ height:56, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 14px", borderBottom:"1px solid #1e274f", position:"sticky", top:0, background:"#0A0F2A", zIndex:20 }}>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}><div style={{ width:28, height:28, borderRadius:8, background:"#FFD400", color:"#000", display:"grid", placeItems:"center", fontWeight:900 }}>M</div><b>maratonei</b></div>
        <button onClick={toggle} style={{ background:"#121A3A", border:"1px solid #2a3566", color:"#fff", borderRadius:8, padding:"6px 10px", fontSize:11, cursor:"pointer" }}>{view==="grade"? "Lista" : "Grade"}</button>
      </header>
      <div style={{ maxWidth:1280, margin:"0 auto", padding:14, position:"relative" }}>
        <div style={{ background:"#121A3A", border:"1px solid #2a3566", borderRadius:999, display:"flex", alignItems:"center", padding:"0 14px", height:42, maxWidth:420, margin:"0 auto" }}>
          <input value={busca} onChange={function(e){ setBusca(e.target.value) }} placeholder="Buscar filme em PT (ex: divertida mente, vingadores)" style={{ flex:1, background:"transparent", border:0, outline:"none", color:"#fff", fontSize:13 }} />
          {busca && <span onClick={function(){ setBusca("") }} style={{ cursor:"pointer", opacity:0.5 }}>X</span>}
        </div>
        {busca && <div style={{ position:"absolute", top:62, left:14, right:14, maxWidth:420, margin:"0 auto", background:"#12182F", border:"1px solid #2a3566", borderRadius:12, zIndex:50, overflow:"hidden" }}>
          {resultados.map(function(r){ return <div key={r.id} onClick={function(){ add(r) }} style={{ display:"flex", gap:10, padding:10, borderBottom:"1px solid #1e274f", cursor:"pointer" }}><img src={r.img} style={{ width:40, height:60, borderRadius:6, objectFit:"cover" }} alt="" /><div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:700 }}>{r.titulo}</div>{r.titulo_original && r.titulo_original.toLowerCase()!==r.titulo.toLowerCase().replace(/ \([0-9]{4}\)/,"").toLowerCase() && <div style={{ fontSize:10, opacity:0.5 }}>{r.titulo_original}</div>}<div style={{ fontSize:10, color:"#FFD400", fontWeight:800, marginTop:2 }}>+ ADICIONAR</div></div></div> })}
          {resultados.length===0 && <div style={{ padding:12, fontSize:12, opacity:0.5 }}>Nenhum resultado. Tente: vingadores, divertida mente, batman</div>}
        </div>}
        {!busca && <div><Secao titulo="Quero Assistir" cor="#8b5cf6" qtd={quero.length}>{quero.map(function(s){ return view==="grade"? <div key={s.id} onClick={function(){ abrir(s) }} className="card"><div className="poster"><img src={s.img} alt="" /><div className="badge">QUERO</div></div><div className="tit">{s.titulo}</div></div> : <div key={s.id} onClick={function(){ abrir(s) }} className="row"><img src={s.img} alt="" /><div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:800 }}>{s.titulo}</div></div></div> })}</Secao><Secao titulo="Ja Assisti" cor="#22c55e" qtd={vistos.length}>{vistos.map(function(s){ return view==="grade"? <div key={s.id} onClick={function(){ abrir(s) }} className="card"><div className="poster"><img src={s.img} alt="" /><div className="badge" style={{ background:"#22c55e", color:"#fff" }}>VISTO</div></div><div className="tit">{s.titulo}</div></div> : <div key={s.id} onClick={function(){ abrir(s) }} className="row"><img src={s.img} alt="" /><div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:800 }}>{s.titulo}</div></div></div> })}</Secao></div>}
      </div>
      <BottomNav />
    </div>
  )
}
