"use client"
import { useEffect, useState, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)
const MAPA_IDS_FAKE = { "101": 45582, "102": 71268, "103": 0, "104": 73, "201": 0, "301": 2993, "302": 61167 }

export default function DetalheSerie({ params }) {
  const id = String(params.id)
  const [userId, setUserId] = useState(null)
  const [serie, setSerie] = useState(null)
  const [status, setStatus] = useState("assistindo")
  const [epsVistos, setEpsVistos] = useState([])
  const [temporadas, setTemporadas] = useState([])
  const [aberta, setAberta] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) { window.location.href = "/login"; return }
      const uid = data.session.user.id; setUserId(uid)
      let { data: row } = await supabase.from("user_series").select("*").eq("user_id", uid).eq("serie_id", id).single()
      let s = row? { id: row.serie_id, titulo: row.titulo, ano: row.ano, img: row.img, q: row.q, status: row.status } : null
      if (!s) { try { const raw = localStorage.getItem(uid + ":serie-atual"); if (raw) s = JSON.parse(raw) } catch {} }
      if (!s) s = { id, titulo: id, img: "" }
      setSerie(s); setStatus(row?.status || s.status || "assistindo"); setEpsVistos(row?.eps_vistos || JSON.parse(localStorage.getItem(uid + ":eps-" + id) || "[]"))

      let rid = MAPA_IDS_FAKE[id] || id
      if (!rid || rid === 0 || Number(rid) < 1000) {
        try { const q = s.q || s.titulo; const sr = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(q)}`); const sj = await sr.json(); if (sj?.[0]?.show?.id) rid = sj[0].show.id } catch {}
      }
      try {
        const [showRes, seasonsRes, epsRes] = await Promise.all([ fetch(`https://api.tvmaze.com/shows/${rid}`), fetch(`https://api.tvmaze.com/shows/${rid}/seasons`), fetch(`https://api.tvmaze.com/shows/${rid}/episodes`) ])
        const show = await showRes.json(); const seasons = await seasonsRes.json(); const episodes = await epsRes.json()
        if (show?.name) { s = {...s, titulo: show.name, ano: show.premiered?.slice(0,4) || "", img: show.image?.original || show.image?.medium || s.img, banner: show.image?.original || s.img }; setSerie(s) }
        const mapa = {}; if (Array.isArray(seasons)) seasons.forEach(se => { mapa[se.number] = { numero: se.number, eps: [] } }); if (Array.isArray(episodes)) episodes.forEach(ep => { if (!mapa[ep.season]) mapa[ep.season] = { numero: ep.season, eps: [] }; mapa[ep.season].eps.push({ id: ep.id, numero: ep.number, nome: ep.name }) })
        const lista = Object.values(mapa).sort((a,b)=>a.numero-b.numero)

        // SALVA O TOTAL PRA HOME USAR NA BARRA DE PROGRESSO
        const totalEpsCalc = lista.reduce((a,t)=>a+t.eps.length,0)
        localStorage.setItem(uid + ":total-" + id, String(totalEpsCalc))
        // também salva no supabase pra sincronizar no outro aparelho
        if (row) { await supabase.from("user_series").update({ updated_at: new Date().toISOString() }).eq("user_id", uid).eq("serie_id", id) }

        setTemporadas(lista.length? lista : [{ numero:1, eps: Array.from({length:10},(_,i)=>({id:`${rid}-${i+1}`, numero:i+1, nome:`Episódio ${i+1}`})) }]); setAberta(lista[0]?.numero || 1)
      } catch { const fake = [1,2,3].map(n => ({ numero: n, eps: Array.from({length:10}, (_,i)=>({ id: `${rid}-${n}-${i+1}`, numero: i+1, nome: `Episódio ${i+1}` })) })); setTemporadas(fake); setAberta(1); localStorage.setItem(uid + ":total-" + id, String(30)) }
      setLoading(false)
    }; run()
  }, [id])

  const toggleEp = async (eid) => {
    let novo = epsVistos.includes(eid)? epsVistos.filter(x=>x!==eid) : [...epsVistos, eid];
    setEpsVistos(novo);
    await supabase.from("user_series").update({ eps_vistos: novo, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("serie_id", id)
    localStorage.setItem(userId + ":eps-" + id, JSON.stringify(novo))
  }
  const maratonarTemp = async (temp) => {
    const ids = temp.eps.map(e=>e.id);
    const todos = ids.every(i=>epsVistos.includes(i));
    let novo = todos? epsVistos.filter(i=>!ids.includes(i)) : [...new Set([...epsVistos,...ids])];
    setEpsVistos(novo);
    await supabase.from("user_series").update({ eps_vistos: novo, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("serie_id", id)
    localStorage.setItem(userId + ":eps-" + id, JSON.stringify(novo))
  }
  const mudarStatus = async (novo) => {
    setStatus(novo);
    await supabase.from("user_series").update({ status: novo, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("serie_id", id)
    localStorage.setItem(userId + ":status-" + id, novo)
  }
  const abandonar = async () => {
    if (!confirm(`Abandonar "${serie?.titulo}"? Seu progresso será apagado.`)) return;
    await supabase.from("user_series").delete().eq("user_id", userId).eq("serie_id", id);
    localStorage.removeItem(userId + ":status-" + id)
    localStorage.removeItem(userId + ":eps-" + id)
    localStorage.removeItem(userId + ":total-" + id)
    localStorage.removeItem(userId + ":serie-atual")
    window.location.href = "/"
  }

  const totalEps = useMemo(()=> temporadas.reduce((a,t)=>a+t.eps.length,0), [temporadas]); const progresso = totalEps? Math.round((epsVistos.length/totalEps)*100) : 0
  if (!serie) return null
  return (
    <div style={{ minHeight: "100vh", background: "#080B1F", color: "#fff" }}>
      <div style={{ height: 300, position: "relative" }}><img src={serie.banner || serie.img} style={{ width:"100%", height:"100%", objectFit:"cover", background:"#12182F" }} /><div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg, #00000030, #080B1F 95%)" }} /><button onClick={()=>history.back()} style={{ position:"absolute", top:14, left:14, width:34, height:34, borderRadius:999, background:"#0009", border:"1px solid #ffffff22", color:"#fff", cursor:"pointer" }}>‹</button><button onClick={abandonar} style={{ position:"absolute", top:14, right:14, padding:"7px 12px", borderRadius:999, background:"#ef4444", border:"1px solid #ef444499", color:"#fff", fontSize:11, fontWeight:900, cursor:"pointer" }}>Abandonar</button><div style={{ position:"absolute", bottom:-22, left:16, display:"flex", gap:12, alignItems:"flex-end", right:16 }}><img src={serie.img} style={{ width:90, height:135, borderRadius:12, objectFit:"cover", border:"2px solid #ffffff18", background:"#12182F" }} /><div style={{ flex:1, paddingBottom:6 }}><h1 style={{ margin:0, fontSize:18, fontWeight:900 }}>{serie.titulo}</h1><div style={{ fontSize:11, opacity:.6, marginTop:4 }}>{loading? "carregando...": `${temporadas.length} temp • ${epsVistos.length}/${totalEps} vistos • ${progresso}%`}</div><div style={{ height:4, background:"#ffffff1a", borderRadius:99, marginTop:8 }}><div style={{ width:progresso+"%", height:"100%", background:"#FFD400", borderRadius:99, transition:"width.3s" }} /></div></div></div></div>
      <div style={{ maxWidth:680, margin:"0 auto", padding:"38px 14px 14px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>{[{id:"assistindo",l:"Assistindo"},{id:"quero
