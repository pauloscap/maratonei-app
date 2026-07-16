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
      const uid = data.session.user.id
      setUserId(uid)
      let result = await supabase.from("user_series").select("*").eq("user_id", uid).eq("serie_id", id).single()
      let row = result.data
      let s = row? { id: row.serie_id, titulo: row.titulo, ano: row.ano, img: row.img, q: row.q, status: row.status } : null
      if (!s) { try { const raw = localStorage.getItem(uid + ":serie-atual"); if (raw) s = JSON.parse(raw) } catch(e) {} }
      if (!s) s = { id: id, titulo: id, img: "" }
      setSerie(s)
      setStatus((row && row.status) || s.status || "assistindo")
      const epsLocal = JSON.parse(localStorage.getItem(uid + ":eps-" + id) || "[]")
      setEpsVistos((row && row.eps_vistos) || epsLocal || [])

      let rid = MAPA_IDS_FAKE[id] || id
      if (!rid || rid === 0 || Number(rid) < 1000) {
        try { const q = s.q || s.titulo; const sr = await fetch("https://api.tvmaze.com/search/shows?q=" + encodeURIComponent(q)); const sj = await sr.json(); if (sj && sj[0] && sj[0].show && sj[0].show.id) rid = sj[0].show.id } catch(e) {}
      }
      try {
        const responses = await Promise.all([ fetch("https://api.tvmaze.com/shows/" + rid), fetch("https://api.tvmaze.com/shows/" + rid + "/seasons"), fetch("https://api.tvmaze.com/shows/" + rid + "/episodes") ])
        const show = await responses[0].json()
        const seasons = await responses[1].json()
        const episodes = await responses[2].json()
        if (show && show.name) { s = {...s, titulo: show.name, ano: show.premiered? show.premiered.slice(0,4) : "", img: (show.image && (show.image.original || show.image.medium)) || s.img, banner: (show.image && show.image.original) || s.img }; setSerie(s) }
        const mapa = {}
        if (Array.isArray(seasons)) seasons.forEach(function(se){ mapa[se.number] = { numero: se.number, eps: [] } })
        if (Array.isArray(episodes)) episodes.forEach(function(ep){ if (!mapa[ep.season]) mapa[ep.season] = { numero: ep.season, eps: [] }; mapa[ep.season].eps.push({ id: ep.id, numero: ep.number, nome: ep.name }) })
        const lista = Object.values(mapa).sort(function(a,b){ return a.numero-b.numero })
        const totalEpsCalc = lista.reduce(function(a,t){ return a+t.eps.length }, 0)
        localStorage.setItem(uid + ":total-" + id, String(totalEpsCalc))
        if (lista.length) { setTemporadas(lista); setAberta(lista[0].numero) } else { setTemporadas([{ numero:1, eps: Array.from({length:10}, function(_,i){ return { id: rid + "-" + (i+1), numero: i+1, nome: "Episódio " + (i+1) } }) }]); setAberta(1) }
      } catch(e) { const fake = [1,2,3].map(function(n){ return { numero: n, eps: Array.from({length:10}, function(_,i){ return { id: rid + "-" + n + "-" + (i+1), numero: i+1, nome: "Episódio " + (i+1) } }) } }); setTemporadas(fake); setAberta(1); localStorage.setItem(uid + ":total-" + id, "30") }
      setLoading(false)
    }
    run()
  }, [id])

  const toggleEp = async function(eid){
    let novo = epsVistos.includes(eid)? epsVistos.filter(function(x){ return x!==eid }) : [].concat(epsVistos, [eid])
    setEpsVistos(novo)
    await supabase.from("user_series").update({ eps_vistos: novo, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("serie_id", id)
    localStorage.setItem(userId + ":eps-" + id, JSON.stringify(novo))
  }
  const maratonarTemp = async function(temp){
    const ids = temp.eps.map(function(e){ return e.id })
    const todos = ids.every(function(i){ return epsVistos.includes(i) })
    let novo = todos? epsVistos.filter(function(i){ return!ids.includes(i) }) : Array.from(new Set([].concat(epsVistos, ids)))
    setEpsVistos(novo)
    await supabase.from("user_series").update({ eps_vistos: novo, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("serie_id", id)
    localStorage.setItem(userId + ":eps-" + id, JSON.stringify(novo))
  }
  const mudarStatus = async function(novo){
    setStatus(novo)
    await supabase.from("user_series").update({ status: novo, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("serie_id", id)
    localStorage.setItem(userId + ":status-" + id, novo)
  }
  const abandonar = async function(){
    if (!confirm("Abandonar " + (serie? serie.titulo : "") + "?")) return
    await supabase.from("user_series").delete().eq("user_id", userId).eq("serie_id", id)
    localStorage.removeItem(userId + ":status-" + id)
    localStorage.removeItem(userId + ":eps-" + id)
    localStorage.removeItem(userId + ":total-" + id)
    localStorage.removeItem(userId + ":serie-atual")
    window.location.href = "/"
  }

  const totalEps = useMemo(function(){ return temporadas.reduce(function(a,t){ return a+t.eps.length },0) }, [temporadas])
  const progresso = totalEps? Math.round((epsVistos.length/totalEps)*100) : 0
  const progressoTexto = loading? "carregando..." : temporadas.length + " temp - " + epsVistos.length + "/" + totalEps + " vistos - " + progresso + "%"
  if (!serie) return null

  return (
    <div style={{ minHeight: "100vh", background: "#080B1F", color: "#fff" }}>
      <div style={{ height: 300, position: "relative" }}>
        <img src={serie.banner || serie.img} style={{ width:"100%", height:"100%", objectFit:"cover", background:"#12182F" }} alt="" />
        <div style={{ position:"absolute", inset:0, background
