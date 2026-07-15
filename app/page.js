"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

export default function Home() {
  const [series, setSeries] = useState([])
  const [statusMap, setStatusMap] = useState({})
  const [progressMap, setProgressMap] = useState({})
  const [busca, setBusca] = useState("")
  const [resultados, setResultados] = useState([])
  const [mounted, setMounted] = useState(false)

  async function carregarSeries() {
    const { data } = await supabase.from("series").select("*").order("created_at", { ascending: false })
    if (data) setSeries(data)
  }

  function carregarLS(lista) {
    const s = {}
    const p = {}
    for (let i=0; i<lista.length; i++) {
      const x = lista[i]
      const st = localStorage.getItem("status-" + x.id)
      const pg = localStorage.getItem("progress-" + x.id)
      if (st) s[x.id] = st
      if (pg) {
        try { p[x.id] = JSON.parse(pg) } catch (e) {}
      }
    }
    setStatusMap(s)
    setProgressMap(p)
  }

  useEffect(function(){ setMounted(true); carregarSeries() }, [])

  useEffect(function(){
    if (mounted && series.length) carregarLS(series)
  }, [mounted, series])

  useEffect(function(){
    function onFocus(){ if (series.length) carregarLS(series) }
    window.addEventListener("focus", onFocus)
    return function(){ window.removeEventListener("focus", onFocus) }
  }, [series])

  async function buscar(q) {
    setBusca(q)
    if (q.length < 2) { setResultados([]); return }
    const r = await fetch("https://api.themoviedb.org/3/search/tv?api_key=" + process.env.NEXT_PUBLIC_TMDB_KEY + "&language=pt-BR&query=" + encodeURIComponent(q))
    const j = await r.json()
    if (j.results) setResultados(j.results.slice(0,6))
    else setResultados([])
  }

  async function addQuero(item) {
    const { data: existente } = await supabase.from("series").select("*").eq("tmdb_id", item.id).maybeSingle()
    let serieFinal = existente
    if (!existente) {
      const nova = {
        tmdb_id: item.id,
        titulo: item.name,
        ano: item.first_air_date ? new Date(item.first_air_date).getFullYear() : null,
        sinopse: item.overview,
        poster: item.poster_path,
        nota: item.vote_average
      }
      const { data, error } = await supabase.from("series").insert([nova]).select().single()
      if (error) {
        if (error.message.indexOf("duplicate") !== -1 || error.message.indexOf("unique") !== -1) {
          const { data: retry } = await supabase.from("series").select("*").eq("tmdb_id", item.id).single()
          serieFinal = retry
        } else { alert(error.message); return }
      } else { serieFinal = data }
    }
    if (!serieFinal) return
    localStorage.setItem("status-" + serieFinal.id, "quero_assistir")
    if (!localStorage.getItem("progress-" + serieFinal.id)) localStorage.setItem("progress-" + serieFinal.id, JSON.stringify([]))
    let ja = false
    for (let i=0; i<series.length; i++) { if (series[i].id === serieFinal.id) ja = true }
    if (!ja) {
      const lista = [serieFinal].concat(series)
      setSeries(lista)
      carregarLS(lista)
    } else { carregarLS(series) }
    setResultados([])
    setBusca("")
  }

  if (!mounted) return null

  function isMaratonei(id) {
    const st = statusMap[id]
    const pg = progressMap[id] || []
    if (st === "ja_maratonei" || st === "maratonei" || st === "concluida" || st === "finalizada") return true
    for (let i=0; i<pg.length; i++) { if (pg[i]==="100%") return true }
    return false
  }
  function isAssistindo(id) {
    if (isMaratonei(id)) return false
    const st = statusMap[id]
    const pg = progressMap[id] || []
    if (st === "assistindo") return true
    if (pg && pg.length > 0) return true
    return false
  }

  const maratonei = []
  const assistindo = []
  const quero = []
  for (let i=0; i<series.length; i++) {
    const s = series[i]
    if (isMaratonei(s.id)) maratonei.push(s)
    else if (isAssistindo(s.id)) assistindo.push(s)
    else quero.push(s)
  }

  return (
    <div style={{ minHeight: "100vh", background: "#08162e", color: "white", paddingBottom: 90, fontFamily: "Inter, system-ui" }}>
      <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, background: "#08162e", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 900, fontSize: 18 }}><div style={{ width: 32, height: 32, borderRadius: 999, background: "#FFD400", display: "grid", placeItems: "center", color: "#08162e" }}>M</div> maratonei</div>
        <div style={{ display: "flex", gap: 10 }}><Link href="/estatisticas" style={iconBtn}>.</Link><Link href="/ranking" style={iconBtn}>.</Link><Link href="/perfil" style={iconBtnP}>P</Link></div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px" }}>
        <div style={{ position: "relative" }}>
          <input value={busca} onChange={function(e){ buscar(e.target.value) }} placeholder="Buscar serie..." style={{ width: "100%", height: 46, borderRadius: 999, background: "#122042", border: "1px solid rgba(255,255,255,0.1)", paddingLeft: 16, paddingRight: 16, color: "white", outline: "none" }} />
        </div>

        {resultados.length > 0 && (
          <div style={{ marginTop: 12, background: "#122042", borderRadius: 16, overflow: "hidden" }}>
            {resultados.map(function(r){
              return (
                <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize: 14 }}>{r.name}</span>
                  <button onClick={function(){ addQuero(r) }} style={{ height: 32, padding: "0 14px", borderRadius: 999, background: "#FFD400", color: "#08162e", fontWeight: 800, fontSize: 12, border: 0, cursor: "pointer" }}>+ Quero</button>
                </div>
              )
            })}
          </div>
        )}

        <h2 style={{ marginTop: 28, marginBottom: 12, fontWeight: 800, fontSize: 15 }}>Estou assistindo</h2>
        {assistindo.length ? <div style={{ display: "flex", gap: 12, overflowX: "auto" }}>{assistindo.map(function(s){ return <Card key={s.id} s={s} borda /> })}</div> : <div style={emptyStyle}>Nenhuma</div>}

        <h2 style={{ marginTop: 28, marginBottom: 12, fontWeight: 800, fontSize: 15 }}>Quero Assistir</h2>
        {quero.length ? <div style={{ display: "flex", gap: 12, overflowX: "auto" }}>{quero.map(function(s){ return <Card key={s.id} s={s} /> })}</div> : <div style={emptyStyle}>Nenhuma ainda</div>}

        <h2 style={{ marginTop: 28, marginBottom: 12, fontWeight: 800, fontSize: 15 }}>Ja maratonei</h2>
        {maratonei.length ? <div style={{ display: "flex", gap: 12, overflowX: "auto" }}>{maratonei.map(function(s){ return <Card key={s.id} s={s} selo /> })}</div> : <div style={emptyStyle}>Nenhuma finalizada</div>}
      </div>
    </div>
  )
}

function Card(props) {
  const s = props.s
  const borda = props.borda
  const selo = props.selo
  return (
    <Link href={"/serie/" + s.id} style={{ textDecoration: "none", color: "white", minWidth: 112 }}>
      <div style={{ width: 112, height: 164, borderRadius: 16, overflow: "hidden", background: "#122042", border: borda ? "2px solid #FFD400" : "1px solid rgba(255,255,255,0.06)", position: "relative" }}>
        <img src={s.poster ? "https://image.tmdb.org/t/p/w300" + s.poster : ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
        {selo && <div style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: 999, background: "#FFD400", display: "grid", placeItems: "center", color: "#08162e", fontSize: 12 }}>v</div>}
      </div>
      <div style={{ fontSize: 12, marginTop: 6, maxWidth: 112, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.titulo}</div>
    </Link>
  )
}

const iconBtn = { width: 36, height: 36, borderRadius: 999, background: "rgba(255,255,255,0.1)", display: "grid", placeItems: "center", textDecoration: "none", color: "white" }
const iconBtnP = { width: 36, height: 36, borderRadius: 999, background: "#FFD400", display: "grid", placeItems: "center", textDecoration: "none", color: "#08162e", fontWeight: 800 }
const emptyStyle = { height: 56, borderRadius: 16, border: "1px dashed rgba(255,255,255,0.15)", display: "grid", placeItems: "center", color: "rgba(255,255,255,0.35)", fontSize: 13 }
