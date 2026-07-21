"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { BottomNav } from "../../components/BottomNav"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

const BASE_FILMES = [
  { id: "tt0468569", titulo: "Batman: Cavaleiro das Trevas (2008)", img: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg", status: "quero_assistir" },
]

export default function FilmesPage() {
  const [userId, setUserId] = useState("anon")
  const [busca, setBusca] = useState("")
  const [filmes, setFilmes] = useState([])
  const [resultados, setResultados] = useState([])
  const [view, setView] = useState("grade")
  const [msg, setMsg] = useState("")

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
      lista = lista.map(function(f){ let st=f.status; if(st==="maratonei"||st==="assistido") st="ja_assisti"; if(st==="assistindo") st="quero_assistir"; return {...f, id:String(f.id), status:st||"quero_assistir"} })
      setFilmes(lista)
    }
    init()
  }, [])

  useEffect(function(){
    if (!busca.trim()) { setResultados([]); setMsg(""); return }
    const t = setTimeout(async function(){
      setMsg("Buscando...")
      try {
        // API sem chave que busca no IMDb e funciona em PT-BR
        const q = encodeURIComponent(busca.trim())
        const r = await fetch("https://search.imdbot.workers.dev/?q=" + q)
        const j = await r.json()
        let lista = []
        if (j.description && j.description.length) {
          lista = j.description.filter(function(it){ return it.q==="feature" || it.q==="TV movie" ||!it.q }).slice(0,12).map(function(it){
            const id = it.id
            const titulo = it.l + (it.y? " ("+it.y+")" : "")
            const img = it.i? it.i.imageUrl : "https://picsum.photos/seed/" + id + "/400/600"
            return { id: id, titulo: titulo, img: img }
          })
        }
        // se nao achou, tenta OMDb como backup
        if (!lista.length) {
          const r2 = await fetch("https://www.omdbapi.com/?apikey=thewdb&s=" + q + "&type=movie")
          const j2 = await r2.json()
          if (j2.Search) lista = j2.Search.slice(0,10).map(function(it){ return { id: it.imdbID, titulo: it.Title + " ("+it.Year+")", img: it.Poster!=="N/A"? it.Poster : "https://picsum.photos/seed/"+it.imdbID+"/400/600" } })
        }
        setResultados(lista)
        setMsg(lista.length? "" : "Nenhum filme encontrado para '"+busca+"'")
      } catch(e){ setResultados([]); setMsg("Erro ao buscar, tente novamente") }
    }, 350)
    return function(){ clearTimeout(t) }
  }, [busca])

  function toggle(){ const n = view==="grade"? "lista" : "grade"; setView(n); localStorage.setItem(userId + ":view-filmes", n) }
  async function add(f){
    const novo = { id: String(f.id), titulo: f.titulo, img: f.img, status: "quero_assistir" }
    const nl = [novo].concat(filmes.filter(function(x){ return String(x.id)!== String(novo.id) }))
    setFilmes(nl)
    localStorage.setItem(userId + ":meus-filmes", JSON.stringify(nl))
    try { await supabase.from("user_filmes").upsert({ user_id: userId, filme_id: novo.id, titulo: novo.titulo, img: novo.img, status: novo.status, updated_at: new Date().toISOString() }, { onConflict: "user_id,filme_id" }) } catch(e){}
    setBusca(""); setResultados([]); setMsg("")
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
          <input value={busca} onChange={function(e){ setBusca(e.target.value) }} placeholder="Buscar filme (ex: devoradores de estrelas, divertida mente)" style={{ flex:1, background:"transparent", border:0, outline:"none", color:"#fff", fontSize:13 }} />
          {busca && <span onClick={function(){ setBusca(""); setResultados([]) }} style={{ cursor:"pointer", opacity:0.5, paddingLeft:8 }}>X</span>}
        </div>
        {busca && <div style={{ position:"absolute", top:62, left:14, right:14, maxWidth:420, margin:"0 auto", background:"#12182F", border:"1px solid #2a3566", borderRadius:12, zIndex:50, overflow:"hidden" }}>
          {resultados.map(function(r){ return <div key={r.id} onClick={function(){ add(r) }} style={{ display:"flex", gap:10, padding:10, borderBottom:"1px solid #1e274f", cursor:"pointer" }}><img src={r.img} style={{ width:40, height:60, borderRadius:6, objectFit:"cover", background:"#000" }} alt="" /><div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:700 }}>{r.titulo}</div><div style={{ fontSize:10, color:"#FFD400", fontWeight:800, marginTop:4 }}>+ ADICIONAR</div></div></div> })}
          {msg && <div style={{ padding:12, fontSize:12, opacity:0.5 }}>{msg}</div>}
        </div>}
        {!busca && <div><Secao titulo="Quero Assistir" cor="#8b5cf6" qtd={quero.length}>{quero.length? quero.map(function(s){ return view==="grade"? <div key={s.id} onClick={function(){ abrir(s) }} className="card"><div className="poster"><img src={s.img} alt="" /><div className="badge">QUERO</div></div><div className="tit">{s.titulo}</div></div> : <div key={s.id} onClick={function(){ abrir(s) }} className="row"><img src={s.img} alt="" /><div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:800 }}>{s.titulo}</div></div></div> }) : <div style={{ fontSize:12, opacity:0.4, padding:"10px 0" }}>Nenhum filme ainda</div>}</Secao><Secao titulo="Ja Assisti" cor="#22c55e" qtd={vistos.length}>{vistos.length? vistos.map(function(s){ return view==="grade"? <div key={s.id} onClick={function(){ abrir(s) }} className="card"><div className="poster"><img src={s.img} alt="" /><div className="badge" style={{ background:"#22c55e", color:"#fff" }}>VISTO</div></div><div className="tit">{s.titulo}</div></div> : <div key={s.id} onClick={function(){ abrir(s) }} className="row"><img src={s.img} alt="" /><div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:800 }}>{s.titulo}</div></div></div> }) : <div style={{ fontSize:12, opacity:0.4, padding:"10px 0" }}>Nenhum visto ainda</div>}</Secao></div>}
      </div>
      <BottomNav />
    </div>
  )
}
