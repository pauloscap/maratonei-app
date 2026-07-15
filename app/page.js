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
    const s = {}; const p = {}
    lista.forEach((x) => {
      const st = localStorage.getItem("status-" + x.id)
      const pg = localStorage.getItem("progress-" + x.id)
      if (st) s[x.id] = st
      if (pg) { try { p[x.id] = JSON.parse(pg) } catch {} }
    })
    setStatusMap(s); setProgressMap(p)
  }
  useEffect(() => { setMounted(true); carregarSeries() }, [])
  useEffect(() => { if (mounted && series.length) carregarLS(series) }, [mounted, series])

  async function buscar(q) {
    setBusca(q)
    if (q.length < 2) { setResultados([]); return }
    const r = await fetch("https://api.themoviedb.org/3/search/tv?api_key=" + process.env.NEXT_PUBLIC_TMDB_KEY + "&language=pt-BR&query=" + encodeURIComponent(q))
    const j = await r.json()
    setResultados(j.results ? j.results.slice(0, 6) : [])
  }
  async function addQuero(item) {
    const ja = series.find((s) => s.tmdb_id === item.id)
    if (ja) { localStorage.setItem("status-" + ja.id, "quero_assistir"); carregarLS(series); setResultados([]); setBusca(""); return }
    const nova = { tmdb_id: item.id, titulo: item.name, ano: item.first_air_date ? new Date(item.first_air_date).getFullYear() : null, sinopse: item.overview, poster: item.poster_path, nota: item.vote_average }
    const { data, error } = await supabase.from("series").insert([nova]).select().single()
    if (error) { alert(error.message); return }
    localStorage.setItem("status-" + data.id, "quero_assistir"); localStorage.setItem("progress-" + data.id, JSON.stringify([]))
    const lista = [data].concat(series); setSeries(lista); carregarLS(lista); setResultados([]); setBusca("")
  }

  if (!mounted) return null
  const assistindo = series.filter((s) => { const st = statusMap[s.id]; const pg = progressMap[s.id]; return st === "assistindo" || (pg && pg.length > 0) })
  const quero = series.filter((s) => !assistindo.find((a) => a.id === s.id))

  return (
    <div style={{ minHeight: "100vh", background: "#08162e", color: "white", paddingBottom: 90, fontFamily: "Inter, system-ui" }}>
      {/* TOPO */}
      <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, background: "#08162e", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 900, fontSize: 18, letterSpacing: -0.5 }}>
          <div style={{ width: 32, height: 32, borderRadius: 999, background: "#FFD400", display: "grid", placeItems: "center", color: "#08162e" }}>M</div> maratonei
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/estatisticas" style={iconBtn}>📊</Link>
          <Link href="/ranking" style={iconBtn}>🏆</Link>
          <Link href="/perfil" style={{ ...iconBtn, background: "#FFD400", color: "#08162e", fontWeight: 800 }}>P</Link>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px" }}>
        {/* BUSCA */}
        <div style={{ position: "relative" }}>
          <input value={busca} onChange={(e) => buscar(e.target.value)} placeholder="Buscar série..." style={{ width: "100%", height: 46, borderRadius: 999, background: "#122042", border: "1px solid rgba(255,255,255,0.1)", paddingLeft: 44, paddingRight: 16, color: "white", outline: "none" }} />
          <span style={{ position: "absolute", left: 16, top: 14, opacity: 0.5 }}>🔍</span>
        </div>

        {resultados.length > 0 && (
          <div style={{ marginTop: 12, background: "#122042", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
            {resultados.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <img src={r.poster_path ? "https://image.tmdb.org/t/p/w92" + r.poster_path : ""} style={{ width: 36, height: 52, borderRadius: 8, objectFit: "cover", background: "#1e2f5a" }} alt="" />
                  <span style={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>{r.name}</span>
                </div>
                <button onClick={() => addQuero(r)} style={{ height: 32, padding: "0 14px", borderRadius: 999, background: "#FFD400", color: "#08162e", fontWeight: 800, fontSize: 12, border: 0, cursor: "pointer" }}>+ Quero assistir</button>
              </div>
            ))}
          </div>
        )}

        <h2 style={{ marginTop: 28, marginBottom: 12, fontWeight: 800, fontSize: 15 }}>Estou assistindo</h2>
        {assistindo.length ? (
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6 }}>
            {assistindo.map((s) => {
              const prog = progressMap[s.id] || []; const pct = prog.length ? Math.min(100, prog.length * 6) : 8
              return (
                <Link key={s.id} href={"/serie/" + s.id} style={{ textDecoration: "none", color: "white", minWidth: 112 }}>
                  <div style={{ width: 112, height: 164, borderRadius: 16, overflow: "hidden", background: "#122042", position: "relative", border: "2px solid #FFD400" }}>
                    <img src={s.poster ? "https://image.tmdb.org/t/p/w300" + s.poster : ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                    <div style={{ position: "absolute", bottom: 0, left: 0, height: 4, width: pct + "%", background: "#FFD400" }} />
                  </div>
                  <div style={{ fontSize: 12, marginTop: 6, opacity: 0.9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 112 }}>{s.titulo}</div>
                </Link>
              )
            })}
          </div>
        ) : <div style={{ height: 88, borderRadius: 16, border: "1px dashed rgba(255,255,255,0.15)", display: "grid", placeItems: "center", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Nenhuma série em andamento</div>}

        <h2 style={{ marginTop: 28, marginBottom: 12, fontWeight: 800, fontSize: 15 }}>Quero Assistir</h2>
        {quero.length ? (
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6 }}>
            {quero.map((s) => (
              <Link key={s.id} href={"/serie/" + s.id} style={{ textDecoration: "none", color: "white", minWidth: 112 }}>
                <div style={{ width: 112, height: 164, borderRadius: 16, overflow: "hidden", background: "#122042" }}>
                  <img src={s.poster ? "https://image.tmdb.org/t/p/w300" + s.poster : ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                </div>
                <div style={{ fontSize: 12, marginTop: 6, opacity: 0.9, maxWidth: 112, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.titulo}</div>
              </Link>
            ))}
          </div>
        ) : <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>Nenhuma série ainda. Busque acima e clique em <b style={{ color: "white" }}>+ Quero assistir</b></div>}
      </div>

      {/* RODAPÉ */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 72, background: "#08162e", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-around", alignItems: "center", zIndex: 20 }}>
        <Link href="/" style={footActive}><span style={{ fontSize: 20 }}>📺</span><span style={{ fontSize: 10, fontWeight: 800 }}>Séries</span></Link>
        <Link href="/filmes" style={foot}><span style={{ fontSize: 20 }}>🎬</span><span style={{ fontSize: 10 }}>Filmes</span></Link>
        <button onClick={() => document.querySelector("input")?.focus()} style={{ ...foot, background: "none", border: 0, cursor: "pointer" }}><span style={{ fontSize: 20 }}>🔍</span><span style={{ fontSize: 10 }}>Buscar</span></button>
        <Link href="/perfil" style={foot}><span style={{ fontSize: 20 }}>👤</span><span style={{ fontSize: 10 }}>Perfil</span></Link>
      </div>
    </div>
  )
}
const iconBtn = { width: 36, height: 36, borderRadius: 999, background: "rgba(255,255,255,0.1)", display: "grid", placeItems: "center", textDecoration: "none", color: "white" }
const foot = { display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: "rgba(255,255,255,0.45)", textDecoration: "none" }
const footActive = { display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: "#FFD400", textDecoration: "none" }
