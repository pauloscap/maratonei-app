"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { BottomNav } from "../components/BottomNav"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)
const IDS_REMOVER = ["101","102","103","201"]
const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_KEY || "4e44d9029b1273360df0be1de39768d1"
const TMDB_IMG = "https://image.tmdb.org/t/p/w342"

async function buscarSeriesPTBR(q){
  const termo = q.trim()
  if(!termo) return []
  try{
    const r = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_KEY}&language=pt-BR&query=${encodeURIComponent(termo)}`)
    const j = await r.json()
    if(j.results && j.results.length){
      return j.results.slice(0,8).map(function(m){
        return {
          id: String(m.id),
          titulo: m.name || m.original_name,
          tituloOriginal: m.original_name,
          ano: m.first_air_date? m.first_air_date.slice(0,4) : "",
          img: m.poster_path? TMDB_IMG + m.poster_path : "https://picsum.photos/seed/"+m.id+"/400/600",
          origem: "tmdb"
        }
      })
    }
  }catch(e){}
  try{
    const r2 = await fetch("https://api.tvmaze.com/search/shows?q=" + encodeURIComponent(termo))
    const j2 = await r2.json()
    return j2.slice(0,8).map(function(item){
      return {
        id: String(item.show.id),
        titulo: item.show.name,
        ano: item.show.premiered? item.show.premiered.slice(0,4) : "",
        img: item.show.image? (item.show.image.medium || item.show.image.original) : "https://picsum.photos/seed/"+item.show.id+"/400/600",
        origem: "tvmaze"
      }
    })
  }catch(e){ return [] }
}

export default function Home() {
  const [userId, setUserId] = useState("anon")
  const [busca, setBusca] = useState("")
  const [series, setSeries] = useState([])
  const [resultados, setResultados] = useState([])
  const [view, setView] = useState("grade")
  const [userFoto, setUserFoto] = useState("")
  const [userInicial, setUserInicial] = useState("P")
  const [loading, setLoading] = useState(true)
  const [serieOverlay, setSerieOverlay] = useState(null)

  async function carregarSeries(uid) {
    const { data: doSupabase } = await supabase.from("user_series").select("*").eq("user_id", uid).order("updated_at", { ascending: false })

    const localRaw = localStorage.getItem(uid + ":minhas-series")
    const doLocal = localRaw? JSON.parse(localRaw) : []

    const mapaFinal = {}

    if (doSupabase) {
      doSupabase.forEach(function(r){
        mapaFinal[String(r.serie_id)] = {
          id: String(r.serie_id),
          titulo: r.titulo,
          ano: r.ano || "0000",
          img: r.img,
          q: r.q,
          status: r.status,
          origem: r.origem || "tmdb"
        }
      })
    }

    const seriesPraSubir = []
    doLocal.forEach(function(s){
      const sid = String(s.id)
      if (!mapaFinal[sid] && IDS_REMOVER.indexOf(sid) === -1) {
        mapaFinal[sid] = s
        seriesPraSubir.push({
          user_id: uid,
          serie_id: sid,
          titulo: s.titulo,
          ano: s.ano || "0000",
          img: s.img,
          q: s.q || s.tituloOriginal || s.titulo,
          status: s.status || "quero_assistir",
          origem: s.origem || "tmdb",
          updated_at: new Date().toISOString()
        })
      }
    })

    if (seriesPraSubir.length > 0) {
      await supabase.from("user_series").upsert(seriesPraSubir, { onConflict: 'user_id,serie_id' })
    }

    IDS_REMOVER.forEach(function(badId){
      delete mapaFinal[badId]
      localStorage.removeItem(uid + ":status-" + badId)
      localStorage.removeItem(uid + ":eps-" + badId)
      localStorage.removeItem(uid + ":total-" + badId)
    })
    await supabase.from("user_series").delete().eq("user_id", uid).in("serie_id", IDS_REMOVER)

    let listaBase = Object.values(mapaFinal)

    const comDados = await Promise.all(listaBase.map(async function(s){
      let img = s.img
      if (!img) {
        try {
          const res = await buscarSeriesPTBR(s.q || s.titulo)
          if(res[0]) img = res[0].img
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

      return {
  ...s,
        id: String(s.id),
        img: img || "https://picsum.photos/seed/"+s.id+"/400/600",
        status: st,
        progresso: progresso,
        epsVistos: epsVistos.length,
        totalEps: totalSalvo
      }
    }))

    setSeries(comDados)
    setLoading(false)
  }

  useEffect(() => {
    let channel

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = "/login"; return }
      const uid = session.user.id
      const u = session.user
      setUserId(uid)
      setUserFoto(u.user_metadata?.avatar_url || "")
      setUserInicial((u.user_metadata?.full_name || u.email || "P")[0].toUpperCase())
      const savedView = localStorage.getItem(uid + ":view-mode")
      if (savedView) setView(savedView)

      await carregarSeries(uid)

      // REALTIME: só INSERT e UPDATE, ignora DELETE
      channel = supabase.channel('user_series_realtime_' + uid)
    .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_series', filter: `user_id=eq.${uid}` },
        () => { carregarSeries(uid) }
      )
    .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'user_series', filter: `user_id=eq.${uid}` },
        () => { carregarSeries(uid) }
      )
    .subscribe()

      const handleFocus = () => carregarSeries(uid)
      window.addEventListener('focus', handleFocus)
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') handleFocus()
      })

      return () => {
        window.removeEventListener('focus', handleFocus)
      }
    }
    init()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (!busca.trim()) { setResultados([]); return }
    const t = setTimeout(async function(){
      const res = await buscarSeriesPTBR(busca)
      setResultados(res)
    }, 350)
    return function(){ clearTimeout(t) }
  }, [busca])

  function toggleView(){ const novo = view === "grade"? "lista" : "grade"; setView(novo); localStorage.setItem(userId + ":view-mode", novo) }

  async function adicionarSerie(s){
    const nova = {
      id: String(s.id),
      titulo: s.titulo,
      ano: s.ano || "0000",
      status: "quero_assistir",
      img: s.img,
      q: s.tituloOriginal || s.titulo,
      origem: s.origem || "tmdb",
      progresso:0,
      epsVistos:0,
      totalEps:0
    }

    const { error } = await supabase.from("user_series").upsert({
      user_id: userId,
      serie_id: nova.id,
      titulo: nova.titulo,
      ano: nova.ano,
      img: nova.img,
      q: nova.q,
      status: nova.status,
      origem: nova.origem,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,serie_id' })

    if (error) {
      alert("Erro: " + error.message)
      return
    }

    setBusca(""); setResultados([])
    setTimeout(function(){ window.location.href = "/serie/" + nova.id }, 100)
  }

  function abrir(s){
    localStorage.setItem(userId + ":serie-atual", JSON.stringify(s));
    window.location.href = "/serie/" + s.id
  }

  async function abandonarSerie(s, e){
    e.stopPropagation()
    e.preventDefault()

    if (!confirm("Abandonar " + s.titulo + "?")) return

    // 1. Fecha overlay e remove da tela AGORA
    setSerieOverlay(null)
    setSeries(prev => prev.filter(x => x.id!== s.id))

    // 2. Deleta do banco em background
    const { error } = await supabase
  .from("user_series")
  .delete()
  .eq("user_id", userId)
  .eq("serie_id", s.id)

    if (error) {
      alert("Erro ao abandonar: " + error.message)
      carregarSeries(userId)
      return
    }

    // 3. Limpa localStorage
    localStorage.removeItem(userId + ":status-" + s.id)
    localStorage.removeItem(userId + ":eps-" + s.id)
    localStorage.removeItem(userId + ":total-" + s.id)
  }

  const assistindo = series.filter(function(s){ return s.status === "assistindo" })
  const queroAssistir = series.filter(function(s){ return s.status === "quero_assistir" })
  const maratonei = series.filter(function(s){ return s.status === "maratonei" })

  function CardGrade(props){
    const s = props.s
    const mostrarOverlay = serieOverlay === s.id

    return (
      <div className="card-grade">
        <div
          className="poster-wrap"
          onClick={function(e){
            e.stopPropagation()
            setSerieOverlay(mostrarOverlay? null : s.id)
          }}
        >
          <img src={s.img} alt="" loading="lazy" />
          <div className="badge">{s.status === "quero_assistir"? "QUERO" : s.status.toUpperCase()}</div>
          <div className="progress-track"><div className="progress-fill" style={{ width: s.progresso + "%", background: s.status==="maratonei"? "#22c55e" : s.status==="quero_assistir"? "#8b5cf6" : "#FFD400" }} /></div>

          {mostrarOverlay && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              backdropFilter: 'blur(4px)'
            }}>
              <button
                onClick={function(e){ e.stopPropagation(); abrir(s); setSerieOverlay(null) }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  background: '#22c55e',
                  border: '2px solid rgba(255,255,255,0.2)',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  fontSize: 24,
                  color: '#fff',
                  fontWeight: 900
                }}
                title="Atualizar"
              >✓</button>
              <button
                onClick={function(e){ abandonarSerie(s, e) }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  background: '#ef4444',
                  border: '2px solid rgba(255,255,255,0.2)',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  fontSize: 20,
                  color: '#fff',
                  fontWeight: 900
                }}
                title="Abandonar"
              >🗑</button>
            </div>
          )}
        </div>
        <div className="titulo">{s.titulo}</div>
      </div>
    )
  }

  function CardLista(props){
    const s = props.s
    const mostrarOverlay = serieOverlay === s.id

    return (
      <div style={{ position: 'relative' }}>
        <div
          onClick={function(e){
            e.stopPropagation()
            setSerieOverlay(mostrarOverlay? null : s.id)
          }}
          style={{ display:"flex", gap:12, padding:10, background:"#12182F", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, cursor:"pointer", alignItems:"center" }}
        >
          <div style={{ width:52, height:78, minWidth:52, borderRadius:8, overflow:"hidden" }}>
            <img src={s.img} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:800 }}>{s.titulo}</div>
          </div>
        </div>

        {mostrarOverlay && (
          <div style={{
            position: 'absolute',
            top: 0,
            right: 10,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            zIndex: 10
          }}>
            <button
              onClick={function(e){ e.stopPropagation(); abrir(s); setSerieOverlay(null) }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                background: '#22c55e',
                border: '2px solid rgba(255,255,255,0.2)',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                fontSize: 20,
                color: '#fff',
                fontWeight: 900
              }}
              title="Atualizar"
            >✓</button>
            <button
              onClick={function(e){ abandonarSerie(s, e) }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                background: '#ef4444',
                border: '2px solid rgba(255,255,255,0.2)',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                fontSize: 18,
                color: '#fff',
                fontWeight: 900
              }}
              title="Abandonar"
            >🗑</button>
          </div>
        )}
      </div>
    )
  }

  function Secao(props){
    return (
      <div style={{ marginTop:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <div style={{ width:3, height:14, background:props.cor, borderRadius:99 }} />
          <b style={{ fontSize:14, fontFamily:"Sora,sans-serif" }}>{props.titulo}</b>
          <span style={{ fontSize:11, opacity:0.4 }}>- {props.qtd}</span>
        </div>
        {props.qtd===0? (
          <div style={{background:"#12182F", border:"1px dashed rgba(255,255,255,0.12)", borderRadius:12, padding:"18px 14px", textAlign:"center"}}>
            <div style={{fontSize:11, opacity:0.35}}>Nenhuma série em {props.titulo.toLowerCase()}</div>
            <div style={{fontSize:11, color:"#FFD400", marginTop:4, fontWeight:700}}>Busque acima para adicionar</div>
          </div>
        ) : view==="grade"? <div className="grid-responsive">{props.children}</div> : <div style={{ display:"grid", gap:8 }}>{props.children}</div>}
      </div>
    )
  }

  if(loading) return <div style={{minHeight:"100vh", background:"#0A0F2A", display:"grid", placeItems:"center", color:"#fff"}}>Sincronizando...</div>

  return (
    <div style={{ minHeight:"100vh", background:"#0A0F2A", color:"#fff", paddingBottom:90 }}>
      <style>{`.grid-responsive{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}@media(min-width:480px){.grid-responsive{grid-template-columns:repeat(4,1fr)}}@media(min-width:768px){.grid-responsive{grid-template-columns:repeat(5,1fr);gap:14px}}@media(min-width:1024px){.grid-responsive{grid-template-columns:repeat(6,1fr);gap:16px}}.card-grade{cursor:pointer;display:flex;flex-direction:column;width:100%}.poster-wrap{width:100%;height:0;padding-bottom:150%;position:relative;border-radius:12px;overflow:hidden;background:#12182F;border:1px solid rgba(255,255,255,0.08)}.poster-wrap img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.badge{position:absolute;top:6px;left:6px;background:#FFD400;color:#000;font-size:8px;font-weight:900;padding:3px 6px;border-radius:6px}.progress-track{position:absolute;bottom:0;left:0;right:0;height:4px;background:rgba(0,0,0,0.65)}.progress-fill{height:100%}.titulo{font-size:11.5px;font-weight:700;margin-top:7px;line-height:1.25;height:28px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}`}</style>
      <header style={{ height:62, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 14px", borderBottom:"1px solid rgba(255,255,255,0.06)", position:"sticky", top:0, background:"rgba(10,15,42,0.92)", backdropFilter:"blur(12px)", zIndex:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}><img src="/icon-192.png" alt="maratonei" style={{ width:32, height:32, borderRadius:8 }} /><b style={{ fontFamily:"Sora,sans-serif", fontWeight:900, fontSize:16 }}>maratonei</b></div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}><button onClick={toggleView} style={{ background:"#121A3A", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", borderRadius:8, padding:"6px 10px", fontSize:11, cursor:"pointer", height:32, fontWeight:700 }}>{view==="grade"? "Lista" : "Grade"}</button><button onClick={function(){ window.location.href="/perfil" }} style={{ width:36, height:36, borderRadius:999, overflow:"hidden", border:"1.5px solid #FFD40055", background:"#121B3A", display:"grid", placeItems:"center", cursor:"pointer", padding:0 }}>{userFoto? <img src={userFoto} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt=""/> : <span style={{ fontWeight:900, fontSize:12, color:"#FFD400" }}>{userInicial}</span>}</button></div>
      </header>
      <div style={{ maxWidth:1280, margin:"0 auto", padding:14, position:"relative" }}>
        <div style={{ background:"#121A3A", border:"1px solid rgba(255,255,255,0.08)", borderRadius:999, display:"flex", alignItems:"center", padding:"0 14px", height:42, maxWidth:420, margin:"0 auto" }}><span style={{ opacity:0.4, marginRight:8 }}>⌕</span><input value={busca} onChange={function(e){ setBusca(e.target.value) }} placeholder="Buscar série para adicionar..." style={{ flex:1, background:"transparent", border:0, outline:"none", color:"#fff", fontSize:13 }} />{busca && <span onClick={function(){ setBusca("") }} style={{ cursor:"pointer", opacity:0.5 }}>✕</span>}</div>
        {busca && <div style={{ position:"absolute", top:62, left:14, right:14, maxWidth:420, margin:"0 auto", background:"#12182F", border:"1px solid rgba(255,255,255,0.12)", borderRadius:16, zIndex:50, overflow:"hidden" }}>{resultados.map(function(r){ return (<div key={r.id} onClick={function(){ adicionarSerie(r) }} style={{ display:"flex", gap:10, padding:10, borderBottom:"1px solid rgba(255,255,255,0.05)", cursor:"pointer" }}><img src={r.img} style={{ width:44, height:66, borderRadius:8, objectFit:"cover" }} alt="" /><div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:800 }}>{r.titulo}</div><div style={{ fontSize:10, opacity:0.4 }}>{r.ano}</div><div style={{ fontSize:10, color:"#FFD400", fontWeight:800, marginTop:4 }}>+ ADICIONAR</div></div></div>) })}</div>}
        {!busca && <>
          <Secao titulo="Assistindo" cor="#FFD400" qtd={assistindo.length}>{assistindo.map(function(s){ return view==="grade"? <CardGrade key={s.id} s={s}/> : <CardLista key={s.id} s={s}/> })}</Secao>
          <Secao titulo="Quero Assistir" cor="#8b5cf6" qtd={queroAssistir.length}>{queroAssistir.map(function(s){ return view==="grade"? <CardGrade key={s.id} s={s}/> : <CardLista key={s.id} s={s}/> })}</Secao>
          <Secao titulo="Maratonei" cor="#22c55e" qtd={maratonei.length}>{maratonei.map(function(s){ return view==="grade"? <CardGrade key={s.id} s={s}/> : <CardLista key={s.id} s={s}/> })}</Secao>
        </>}
      </div><BottomNav />
    </div>
  )
}
