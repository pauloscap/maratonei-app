"use client"
function handleStatus(novoStatus) {
  localStorage.setItem("status-" + id, novoStatus)
  // FORÇA A HOME A LER NA VOLTA
  localStorage.setItem("_ultima_atualizacao", Date.now().toString())
  ...
}
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

export default function SerieDetalhe() {
  const { id } = useParams()
  const router = useRouter()
  const [serie, setSerie] = useState(null)
  const [tmdb, setTmdb] = useState(null)
  const [temporadas, setTemporadas] = useState([])
  const [progress, setProgress] = useState([])
  const [status, setStatus] = useState("quero_assistir")
  const [aberta, setAberta] = useState(1)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("series").select("*").eq("id", id).single()
      if (!data) return
      setSerie(data)
      setStatus(localStorage.getItem("status-" + data.id) || "quero_assistir")
      const pg = localStorage.getItem("progress-" + data.id)
      if (pg) { try { setProgress(JSON.parse(pg)) } catch {} }

      // Busca TMDB para temporadas
      if (data.tmdb_id) {
        const r = await fetch(`https://api.themoviedb.org/3/tv/${data.tmdb_id}?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}&language=pt-BR`)
        const j = await r.json()
        setTmdb(j)
        setTemporadas(j.seasons?.filter(s => s.season_number > 0) || [])
      }
    }
    if (id) load()
  }, [id])

  function salvarProgress(novo) {
    setProgress(novo)
    localStorage.setItem("progress-" + id, JSON.stringify(novo))
    // Se marcou algum episodio, muda pra assistindo automaticamente
    if (novo.length > 0 && status === "quero_assistir") {
      setStatus("assistindo")
      localStorage.setItem("status-" + id, "assistindo")
    }
  }

  function toggleEp(temp, ep) {
    const key = `${temp}-${ep}`
    const existe = progress.includes(key)
    const novo = existe ? progress.filter(p => p !== key) : [...progress, key]
    salvarProgress(novo)
  }

  function marcarTemporadaCompleta(tempNum, totalEps) {
    const eps = Array.from({ length: totalEps }, (_, i) => `${tempNum}-${i+1}`)
    const todosMarcados = eps.every(e => progress.includes(e))
    let novo
    if (todosMarcados) novo = progress.filter(p => !p.startsWith(tempNum + "-"))
    else novo = [...new Set([...progress, ...eps])]
    salvarProgress(novo)
  }

  function handleStatus(novoStatus) {
    setStatus(novoStatus)
    localStorage.setItem("status-" + id, novoStatus)
    if (novoStatus === "ja_maratonei") {
      // Preenche 100% - marca todos episodios conhecidos
      // Se nao temos total, cria progresso fake 100%
      const fake100 = ["100%"]
      localStorage.setItem("progress-" + id, JSON.stringify(fake100))
      setProgress(fake100)
    }
    if (novoStatus === "quero_assistir") {
      // opcional: limpar progresso
    }
  }

  if (!serie) return <div style={{ minHeight: "100vh", background: "#08162e", display: "grid", placeItems: "center", color: "white" }}>Carregando...</div>

  const totalEpsTMDB = tmdb?.number_of_episodes || 20
  const pct = progress.includes("100%") ? 100 : Math.min(100, Math.round((progress.length / Math.max(totalEpsTMDB, 1)) * 100))

  return (
    <div style={{ minHeight: "100vh", background: "#08162e", color: "white", paddingBottom: 90 }}>
      {/* HEADER */}
      <div style={{ height: 56, display: "flex", alignItems: "center", gap: 12, padding: "0 16px", position: "sticky", top: 0, background: "#08162e", zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 999, background: "rgba(255,255,255,0.1)", border: 0, color: "white", fontSize: 18, cursor: "pointer" }}>‹</button>
        <div style={{ fontWeight: 800, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{serie.titulo}</div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* CAPA */}
        <div style={{ display: "flex", gap: 16, padding: 16 }}>
          <img src={serie.poster ? "https://image.tmdb.org/t/p/w300" + serie.poster : ""} style={{ width: 120, height: 180, borderRadius: 16, objectFit: "cover", background: "#122042", border: "1px solid rgba(255,255,255,0.08)" }} alt="" />
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.2 }}>{serie.titulo}</h1>
            <div style={{ fontSize: 13, opacity: 0.6, marginTop: 6 }}>{serie.ano} • {tmdb?.number_of_seasons || "?"} temp • {tmdb?.vote_average?.toFixed(1) || serie.nota} ★</div>
            <div style={{ marginTop: 12, background: "rgba(255,255,255,0.08)", borderRadius: 999, height: 6, overflow: "hidden" }}>
              <div style={{ width: pct + "%", height: "100%", background: "#FFD400", transition: "width .3s" }} />
            </div>
            <div style={{ fontSize: 11, marginTop: 6, opacity: 0.6 }}>{pct}% concluído • {progress.includes("100%") ? "Finalizada" : progress.length + " eps"}</div>
          </div>
        </div>

        {/* BOTOES STATUS */}
        <div style={{ display: "flex", gap: 8, padding: "0 16px", marginTop: 4 }}>
          <button onClick={() => handleStatus("assistindo")} style={status === "assistindo" ? btnActive : btn}>▶ Assistindo</button>
          <button onClick={() => handleStatus("quero_assistir")} style={status === "quero_assistir" ? btnActive : btn}>Quero Assistir</button>
          <button onClick={() => handleStatus("ja_maratonei")} style={status === "ja_maratonei" || status === "maratonei" || status === "concluida" ? btnMaratoneiActive : btnMaratonei}>✓ Já maratonei</button>
        </div>

        {serie.sinopse && <p style={{ padding: "16px", fontSize: 13, lineHeight: 1.5, opacity: 0.7 }}>{serie.sinopse}</p>}

        {/* TEMPORADAS */}
        <div style={{ padding: "8px 16px" }}>
          <h2 style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>Episódios</h2>
          {temporadas.length === 0 && <div style={{ opacity: 0.5, fontSize: 13 }}>Sem temporadas listadas no TMDB.</div>}
          {temporadas.map((temp) => (
            <div key={temp.id} style={{ background: "#122042", borderRadius: 16, marginBottom: 12, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <button onClick={() => setAberta(aberta === temp.season_number ? 0 : temp.season_number)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "none", border: 0, color: "white", fontWeight: 700, cursor: "pointer" }}>
                <span>Temporada {temp.season_number} • {temp.episode_count} eps</span>
                <span style={{ opacity: 0.5 }}>{aberta === temp.season_number ? "−" : "+"}</span>
              </button>
              {aberta === temp.season_number && <Episodios tempNum={temp.season_number} total={temp.episode_count} progress={progress} onToggle={toggleEp} onMarcarTudo={() => marcarTemporadaCompleta(temp.season_number, temp.episode_count)} />}
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 72, background: "#08162e", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-around", alignItems: "center" }}>
        <Link href="/" style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "#FFD400", textDecoration: "none" }}><span>📺</span><span style={{ fontSize: 10, fontWeight: 700 }}>Séries</span></Link>
        <Link href="/perfil" style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "rgba(255,255,255,0.4)", textDecoration: "none" }}><span>👤</span><span style={{ fontSize: 10 }}>Perfil</span></Link>
      </div>
    </div>
  )
}

function Episodios({ tempNum, total, progress, onToggle, onMarcarTudo }) {
  const todos = Array.from({ length: total }, (_, i) => i + 1)
  const marcados = todos.filter(ep => progress.includes(`${tempNum}-${ep}`)).length
  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "8px 8px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px" }}>
        <span style={{ fontSize: 12, opacity: 0.5 }}>{marcados}/{total} assistidos</span>
        <button onClick={onMarcarTudo} style={{ fontSize: 11, background: "#FFD400", color: "#08162e", border: 0, borderRadius: 999, padding: "4px 10px", fontWeight: 800, cursor: "pointer" }}>{marcados === total ? "Desmarcar tudo" : "Marcar temporada"}</button>
      </div>
      {todos.map(ep => {
        const key = `${tempNum}-${ep}`
        const checked = progress.includes(key)
        return (
          <label key={key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderRadius: 10, cursor: "pointer", background: checked ? "rgba(255,212,0,0.08)" : "transparent" }}>
            <input type="checkbox" checked={checked} onChange={() => onToggle(tempNum, ep)} style={{ width: 18, height: 18, accentColor: "#FFD400" }} />
            <span style={{ fontSize: 13, opacity: checked ? 1 : 0.85, textDecoration: checked ? "line-through" : "none", textDecorationColor: "#FFD400" }}>Episódio {ep}</span>
          </label>
        )
      })}
    </div>
  )
}

const btn = { height: 36, padding: "0 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }
const btnActive = { ...btn, background: "white", color: "#08162e", borderColor: "white" }
const btnMaratonei = { ...btn, borderColor: "rgba(255,212,0,0.3)", color: "#FFD400" }
const btnMaratoneiActive = { height: 36, padding: "0 14px", borderRadius: 999, border: 0, background: "#FFD400", color: "#08162e", fontSize: 12, fontWeight: 900, cursor: "pointer" }
