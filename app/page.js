"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { BottomNav } from "../components/BottomNav"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

const IDS_REMOVER = ["101","102","103","201"]

export default function Home() {
  const [userId, setUserId] = useState("anon")
  const [busca, setBusca] = useState("")
  const [series, setSeries] = useState([])
  const [resultados, setResultados] = useState([])
  const [view, setView] = useState("grade")
  const [userFoto, setUserFoto] = useState("")
  const [userInicial, setUserInicial] = useState("P")

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) { window.location.href = "/login"; return }
      const uid = data.session.user.id
      const u = data.session.user
      setUserId(uid)
      setUserFoto(u.user_metadata?.avatar_url || "")
      setUserInicial((u.user_metadata?.full_name || u.email || "P")[0].toUpperCase())
      const savedView = localStorage.getItem(uid + ":view-mode")
      if (savedView) setView(savedView)

      IDS_REMOVER.forEach(function(badId){
        localStorage.removeItem(uid + ":status-" + badId)
        localStorage.removeItem(uid + ":eps-" + badId)
        localStorage.removeItem(uid + ":total-" + badId)
      })
      await supabase.from("user_series").delete().eq("user_id", uid).in("serie_id", IDS_REMOVER)

      // 1. TENTA SUPABASE PRIMEIRO (fonte da verdade)
      const { data: doSupabase } = await supabase.from("user_series").select("*").eq("user_id", uid)

      let listaBase = []
      if (doSupabase && doSupabase.length > 0) {
        listaBase = doSupabase.map(function(r){ return { id: String(r.serie_id), titulo: r.titulo, img: r.img, q: r.q, status: r.status } })
        localStorage.setItem(uid + ":minhas-series", JSON.stringify(listaBase))
      } else {
        // 2. SE SUPABASE VAZIO, TENTA LOCALSTORAGE DESSE UID
        let salvas = JSON.parse(localStorage.getItem(uid + ":minhas-series") || "null")
        if (salvas && salvas.length > 0) {
          salvas = salvas.filter(function(s){ return IDS_REMOVER.indexOf(String(s.id)) === -1 })
          listaBase = salvas
        } else {
          // 3. USUÁRIO NOVO = COMEÇA LIMPO (SEM BASE)
          listaBase = []
        }
      }

      const comDados = await Promise.all(listaBase.map(async function(s){
        let img = s.img
        if (!img) {
          try {
            const q = s.q || s.titulo
            const r = await fetch("https://api.tvmaze.com/search/shows?q=" + encodeURIComponent(q))
            const j = await r.json()
            img = j && j[0] && j[0].show && (j[0].show.image? (j[0].show.image.medium || j[0].show.image.original) : "")
          } catch(e){}
        }
        const st = localStorage.getItem(uid + ":status-" + s.id) || s.status
        const epsVistos = JSON.parse(localStorage.getItem(uid + ":eps-" + s.id) || "[]")
        const totalSalvo = Number(localStorage.getItem(uid + ":total-" + s.id) || 0)
        let progresso = 0
        if (st === "maratonei") progresso = 100
        else if (st === "quero_assistir") progresso = 0
        else if (totalSalvo > 0) progresso = Math.round((epsVistos.length / totalSalvo) * 100)
        else if (epsVistos.length > 0) progresso = Math.min(15 + epsVistos.length * 6, 92)
        return {...s, id: String(s.id), img: img || "https://picsum.photos/seed/"+s.id+"/400/600", status: st, progresso: progresso, epsVistos: epsVistos.length, totalEps: totalSalvo }
      }))
      setSeries(comDados)
    }
    init()
  }, [])

  useEffect(() => {
    if (!busca.trim()) { setResultados([]); return }
    const t = setTimeout(async function(){
      try {
        const r = await fetch("https://api.tvmaze.com/search/shows?q=" + encodeURIComponent(busca))
        const j = await r.json()
        const lista = j.slice(0, 8).map(function(item){ return { id: String(item.show.id), titulo: item.show.name, ano: item.show.premiered? item.show.premiered.slice(0,4) : "", img: item.show.image? (item.show.image.medium || item.show.image.original) : "https://picsum.photos/seed/"+item.show.id+"/400/600" } })
        setResultados(lista)
      } catch(e){ setResultados([]) }
    }, 350)
    return function(){ clearTimeout(t) }
  }, [busca])

  function toggleView(){ const novo = view === "grade"? "lista" : "grade"; setView(novo); localStorage.setItem(userId + ":view-mode", novo) }
  function salvarLista(novaLista){ setSeries(novaLista); localStorage.setItem(userId + ":minhas-series", JSON.stringify(novaLista)) }
  async function adicionarSerie(s){
    const nova = { id: String(s.id), titulo: s.titulo, ano: s.ano || "2024", status: "quero_assistir", img: s.img, q: s.titulo, progresso:0, epsVistos:0, totalEps:0 }
    const novaLista = [nova].concat(series.filter(function(x){ return String(x.id)!== String(nova.id) }))
    salvarLista(novaLista)
    localStorage.setItem(userId + ":serie-atual", JSON.stringify(nova))
    await supabase.from("user_series").upsert({ user_id: userId, serie_id: nova.id, titulo: nova.titulo, ano: nova.ano, img: nova.img, q: nova.q, status: nova.status, updated_at: new Date().toISOString() }, { onConflict: 'user_id,serie_id' })
    setBusca(""); setResultados([])
    setTimeout(function(){ window.location.href = "/serie/" + nova.id }, 100)
  }
  function abrir(s){ localStorage.setItem(userId + ":serie-atual", JSON.stringify(s)); window.location.href = "/serie/" + s.id }

  const assistindo = series.filter(function(s){ return s.status === "assistindo" })
  const queroAssistir = series.filter(function(s){ return s.status === "quero_assistir" })
  const maratonei = series.filter(function(s){ return s.status === "maratonei" })

  function CardGrade(props){
    const s = props.s
    return (<div onClick={function(){ abrir(s) }} className="card-grade"><div className="poster-wrap"><img src={s.img} alt="" loading="lazy" /><div className="badge">{s.status === "quero_assistir"? "QUERO" : s.status.toUpperCase()}</div><div className="progress-track"><div className="progress-fill" style={{ width: s.progresso + "%", background: s.status==="maratonei"? "#22c55e" : s.status==="quero_assistir"? "#8b5cf6" : "#FFD400" }} /></div></div><div className="titulo">{s.titulo}</div>{s.status==="assistindo" && <div className="sub">{s.epsVistos>0? s.epsVistos+(s.totalEps?"/"+s.totalEps:"")+" eps • ":""}{s.progresso}%</div>}</div>)
  }
  function CardLista(props){
    const s = props.s
    return (<div onClick={function(){ abrir(s) }} style={{ display:"flex", gap:12, padding:10, background:"#12182F", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, cursor:"pointer", alignItems:"center" }}><div style={{ position:"relative", width:52, height:78, minWidth:52, borderRadius:8, overflow:"hidden", background:"#0A0F2A" }}><img src={s.img} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" /></div><div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:13, fontWeight:800, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{s.titulo}</div><div style={{ fontSize:11, opacity:0.5 }}>{s.progresso>0? s.progresso+"% assistido" : "Ainda não começou"}</div></div><div style={{ opacity:0.3 }}>›</div></div>)
  }
  function Secao(props){
    return (<div style={{ marginTop:24 }}><div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}><div style={{ width:3, height:14, background:props.cor, borderRadius:99 }} /><b style={{ fontSize:14, fontFamily:"Sora,sans-serif" }}>{props.titulo}</b><span style={{ fontSize:11, opacity:0.4 }}>- {props.qtd}</span></div>{view==="grade"? <div className="grid-responsive">{props.children}</div> : <div style={{ display:"grid", gap:8 }}>{props.children}</div>}{props.qtd===0 && <div style={{fontSize:12, opacity:0.3, padding:"10px 2px"}}>Nenhuma série aqui ainda</div>}</div>)
  }

  return (
    <div style={{ minHeight:"100vh", background:"#0A0F2A", color:"#fff", paddingBottom:90 }}>
      <style>{`.grid-responsive{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}@media(min-width:480px){.grid-responsive{grid-template-columns:repeat(4,1fr)}}@media(min-width:768px){.grid-responsive{grid-template-columns:repeat(5,1fr);gap:14px}}@media(min-width:1024px){.grid-responsive{grid-template-columns:repeat(6,1fr);gap:16px}}.card-grade{cursor:pointer;display:flex;flex-direction:column;width:100%}.poster-wrap{width:100%;height:0;padding-bottom:150%;position:relative;border-radius:12px;overflow:hidden;background:#12182F;border:1px solid rgba(255,255,255,0.08)}.poster-wrap img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.badge{position:absolute;top:6px;left:6px;background:#FFD400;color:#000;font-size:8px;font-weight:900;padding:3px 6px;border-radius:6px}.progress-track{position:absolute;bottom:0;left:0;right:0;height:4px;background:rgba(0,0,0,0.65)}.progress-fill{height:100%}.titulo{font-size:11.5px;font-weight:700;margin-top:7px;line-height:1.25;height:28px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}.sub{font-size:10px;opacity:0.5;margin-top:2px}`}</style>
      <header style={{ height:62, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 14px", borderBottom:"1px solid rgba(255,255,255,0.06)", position:"sticky", top:0, background:"rgba(10,15,42,0.92)", backdropFilter:"blur(12px)", zIndex:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}><img src="/icon-192.png" alt="maratonei" style={{ width:32, height:32, borderRadius:8, objectFit:"contain" }} /><b style={{ fontFamily:"Sora,sans-serif", fontWeight:900, fontSize:16 }}>maratonei</b></div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}><button onClick={toggleView} style={{ background:"#121A3A", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", borderRadius:8, padding:"6px 10px", fontSize:11, cursor:"pointer", height:32, fontWeight:700 }}>{view==="grade"? "Lista" : "Grade"}</button><button onClick={function(){ window.location.href="/perfil" }} style={{ width:36, height:36, borderRadius:999, overflow:"hidden", border:"1.5px solid #FFD40055", background:"#121B3A", display:"grid", placeItems:"center", cursor:"pointer", padding:0 }}>{userFoto? <img src={userFoto} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt=""/> : <span style={{ fontWeight:900, fontSize:12, color:"#FFD400" }}>{userInicial}</span>}</button></div>
      </header>
      <div style={{ maxWidth:1280, margin:"0 auto", padding:14, position:"relative" }}>
        <div style={{ background:"#121A3A", border:"1px solid rgba(255,255,255,0.08)", borderRadius:999, display:"flex", alignItems:"center", padding:"0 14px", height:42, maxWidth:420, margin:"0 auto" }}><span style={{ opacity:0.4, marginRight:8 }}>⌕</span><input value={busca} onChange={function(e){ setBusca(e.target.value) }} placeholder="Buscar série para adicionar..." style={{ flex:1, background:"transparent", border:0, outline:"none", color:"#fff", fontSize:13 }} />{busca && <span onClick={function(){ setBusca("") }} style={{ cursor:"pointer", opacity:0.5 }}>✕</span>}</div>
        {busca && <div style={{ position:"absolute", top:62, left:14, right:14, maxWidth:420, margin:"0 auto", background:"#12182F", border:"1px solid rgba(255,255,255,0.12)", borderRadius:16, zIndex:50, overflow:"hidden" }}>{resultados.map(function(r){ return (<div key={r.id} onClick={function(){ adicionarSerie(r) }} style={{ display:"flex", gap:10, padding:10, borderBottom:"1px solid rgba(255,255,255,0.05)", cursor:"pointer" }}><img src={r.img} style={{ width:44, height:66, borderRadius:8, objectFit:"cover" }} alt="" /><div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:800 }}>{r.titulo}</div><div style={{ fontSize:10, color:"#FFD400", fontWeight:800, marginTop:4 }}>+ ADICIONAR</div></div></div>) })}</div>}
        {series.length===0 &&!busca? <div style={{textAlign:"center", padding:"60px 20px", opacity:0.5}}><div style={{fontSize:48, marginBottom:12}}>🍿</div><div style={{fontWeight:800}}>Sua lista está vazia</div><div style={{fontSize:13, marginTop:6}}>Busque sua primeira série acima</div></div> :!busca && <><Secao titulo="Assistindo" cor="#FFD400" qtd={assistindo.length}>{assistindo.map(function(s){ return view==="grade"? <CardGrade key={s.id} s={s}/> : <CardLista key={s.id} s={s}/> })}</Secao><Secao titulo="Quero Assistir" cor="#8b5cf6" qtd={queroAssistir.length}>{queroAssistir.map(function(s){ return view==="grade"? <CardGrade key={s.id} s={s}/> : <CardLista key={s.id} s={s}/> })}</Secao><Secao titulo="Maratonei" cor="#22c55e" qtd={maratonei.length}>{maratonei.map(function(s){ return view==="grade"? <CardGrade key={s.id} s={s}/> : <CardLista key={s.id} s={s}/> })}</Secao></>}
      </div><BottomNav />
    </div>
  )
}
