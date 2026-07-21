"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { BottomNav } from "../components/BottomNav"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

const BASE = [
  { id: "45582", titulo: "Abbott Elementary", status: "assistindo" },
  { id: "71268", titulo: "X-Men '97", q: "X-Men 97", status: "assistindo" },
  { id: "73", titulo: "The Walking Dead", status: "assistindo" },
  { id: "2993", titulo: "Stranger Things", status: "maratonei" },
  { id: "61167", titulo: "The Last of Us", status: "maratonei" },
]

export default function Home() {
  const [userId, setUserId] = useState("anon")
  const [busca, setBusca] = useState("")
  const [series, setSeries] = useState([])
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [view, setView] = useState("grade")

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) { window.location.href = "/login"; return }
      const uid = data.session.user.id
      setUserId(uid)
      const savedView = localStorage.getItem(uid + ":view-mode")
      if (savedView) setView(savedView)

      const salvas = JSON.parse(localStorage.getItem(uid + ":minhas-series") || "null")
      const listaBase = salvas || BASE

      const comDados = await Promise.all(listaBase.map(async (s) => {
        let img = s.img
        if (!img) {
          try {
            const q = s.q || s.titulo
            const r = await fetch("https://api.tvmaze.com/search/shows?q=" + encodeURIComponent(q))
            const j = await r.json()
            img = j?.[0]?.show?.image?.medium || j?.[0]?.show?.image?.original || ""
          } catch {}
        }
        const st = localStorage.getItem(uid + ":status-" + s.id) || s.status
        const epsVistos = JSON.parse(localStorage.getItem(uid + ":eps-" + s.id) || "[]")
        const totalSalvo = Number(localStorage.getItem(uid + ":total-" + s.id) || 0)

        let progresso = 0
        if (st === "maratonei") progresso = 100
        else if (st === "quero_assistir") progresso = 0
        else if (totalSalvo > 0) progresso = Math.round((epsVistos.length / totalSalvo) * 100)
        else if (epsVistos.length > 0) progresso = Math.min(15 + epsVistos.length * 6, 92) // fallback até abrir a série uma vez

        return {...s, img: img || `https://picsum.photos/seed/${s.id}/400/600`, status: st, progresso, epsVistos: epsVistos.length, totalEps: totalSalvo }
      }))
      setSeries(comDados)
    }
    init()
  }, [])

  useEffect(() => {
    if (!busca.trim()) { setResultados([]); return }
    const t = setTimeout(async () => {
      setBuscando(true)
      try {
        const r = await fetch("https://api.tvmaze.com/search/shows?q=" + encodeURIComponent(busca))
        const j = await r.json()
        const lista = j.slice(0, 8).map(item => ({
          id: item.show.id, titulo: item.show.name, ano: item.show.premiered?.slice(0,4) || "",
          img: item.show.image?.medium || item.show.image?.original || `https://picsum.photos/seed/${item.show.id}/400/600`,
          sinopse: item.show.summary?.replace(/<[^>]+>/g,"").slice(0,110) + "..."
        }))
        setResultados(lista)
      } catch { setResultados([]) }
      setBuscando(false)
    }, 350)
    return () => clearTimeout(t)
  }, [busca])

  const toggleView = () => {
    const novo = view === "grade"? "lista" : "grade"
    setView(novo); localStorage.setItem(userId + ":view-mode", novo)
  }
  const salvarLista = (novaLista) => { setSeries(novaLista); localStorage.setItem(userId + ":minhas-series", JSON.stringify(novaLista)) }
  const adicionarSerie = (s) => {
    const nova = { id: s.id, titulo: s.titulo, ano: s.ano || "2024", status: "quero_assistir", img: s.img, q: s.titulo, progresso:0 }
    const novaLista = [nova,...series.filter(x => x.id!== s.id)]
    salvarLista(novaLista); localStorage.setItem(userId + ":serie-atual", JSON.stringify(nova)); setBusca(""); setResultados([]); setTimeout(() => window.location.href = "/serie/" + s.id, 100)
  }
  const abrir = (s) => { localStorage.setItem(userId + ":serie-atual", JSON.stringify(s)); window.location.href = "/serie/" + s.id }

  const assistindo = series.filter(s => s.status === "assistindo")
  const queroAssistir = series.filter(s => s.status === "quero_assistir")
  const maratonei = series.filter(s => s.status === "maratonei")

  const CardGrade = ({ s }) => (
    <div onClick={() => abrir(s)} className="card-grade">
      <div className="poster-wrap">
        <img src={s.img} alt={s.titulo} />
        <div className="badge">{s.status === "quero_assistir"? "QUERO" : s.status.toUpperCase()}</div>
        {/* BARRA DE PROGRESSO */}
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${s.progresso}%`, background: s.status==="maratonei"? "#22c55e" : s.status==="quero_assistir"? "#8b5cf6" : "#FFD400" }} />
        </div>
      </div>
      <div className="titulo">{s.titulo}</div>
      {s.status==="assistindo" && s.epsVistos>0 && <div className="sub">{s.epsVistos}{s.totalEps? `/${s.totalEps}`:''} eps • {s.progresso}%</div>}
    </div>
  )

  const CardLista = ({ s }) => (
    <div onClick={() => abrir(s)} style={{ display:"flex", gap:12, padding:10, background:"#12182F", border:"1px solid #ffffff10", borderRadius:12, cursor:"pointer" }}>
      <div style={{ position:"relative" }}>
        <img src={s.img} style={{ width:52, height:78, borderRadius:8, objectFit:"cover", display:"block" }} />
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:4, background:"#0008", borderRadius:"0 0 8px 8px", overflow:"hidden" }}>
          <div style={{ width:`${s.progresso}%`, height:"100%", background: s.status==="maratonei"? "#22c55e" : "#FFD400" }} />
        </div>
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:800 }}>{s.titulo}</div>
        <div style={{ fontSize:11, opacity:.5, marginTop:2 }}>{s.status==="maratonei"? "100% completo" : s.progresso>0? `${s.progresso}% assistido` : "Ainda não começou"}</div>
        <div style={{ marginTop:8, height:4, background:"#ffffff14", borderRadius:99, overflow:"hidden" }}><div style={{ width:`${s.progresso}%`, height:"100%", background: s.status==="maratonei"? "#22c55e": s.status==="quero_assistir"? "#8b5cf6": "#FFD400" }} /></div>
      </div>
      <div style={{ alignSelf:"center", opacity:.3 }}>›</div>
    </div>
  )

  const Secao = ({ titulo, cor, qtd, children }) => (
    <div style={{ marginTop: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><div style={{ width: 3, height: 14, background: cor, borderRadius: 99 }} /><b style={{ fontSize: 14 }}>{titulo}</b><span style={{ fontSize: 11, opacity:.4 }}>• {qtd}</span></div>
      {view === "grade"? <div className="grid-responsive">{children}</div> : <div style={{ display: "grid", gap: 8 }}>{children}</div>}
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F2A", color: "#fff", paddingBottom: 90 }}>
      <style>{`
      .grid-responsive { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        @media (min-width: 480px) {.grid-responsive { grid-template-columns: repeat(4, 1fr); } }
        @media (min-width: 768px) {.grid-responsive { grid-template-columns: repeat(5, 1fr); gap: 14px; } }
        @media (min-width: 1024px) {.grid-responsive { grid-template-columns: repeat(6, 1fr); } }
        @media (min-width: 1280px) {.grid-responsive { grid-template-columns: repeat(7, 1fr); } }
      .card-grade { cursor: pointer; }
      .poster-wrap { width: 100%; aspect-ratio: 2/3; border-radius: 12px; overflow: hidden; background: #12182F; border: 1px solid #ffffff12; position: relative; }
      .poster-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .badge { position: absolute; top: 6px; left: 6px; background: #FFD400; color: #000; font-size: 8px; font-weight: 900; padding: 3px 6px; border-radius: 6px; }
      .progress-track { position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: #00000099; }
      .progress-fill { height: 100%; border-radius: 0 99px 99px 0; transition: width.3s ease; }
      .titulo { font-size: 12px; font-weight: 700; margin-top: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .sub { font-size: 10px; opacity:.5; margin-top: 2px; }
      `}</style>

      <header style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", borderBottom: "1px solid #ffffff0f", position: "sticky", top: 0, background: "#0A0F2A", zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 28, height: 28, borderRadius: 8, background: "#FFD400", color: "#000", display: "grid", placeItems: "center", fontWeight: 900 }}>M</div><b>maratonei</b></div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
          <div onClick={() => window.location.href = "/perfil"} style={{ width: 30, height: 30, borderRadius: 999, background: "#FFD400", color: "#000", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 12, cursor: "pointer" }}>P</div>
          <button onClick={toggleView} style={{ background:"#121A3A", border:"1px solid #ffffff18", color:"#fff", borderRadius:8, padding:"4px 8px", fontSize:11, cursor:"pointer" }}>{view==="grade"? "≡ Lista" : "⊞ Grade"}</button>
        </div>
      </header>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: 14, position: "relative" }}>
        <div style={{ background: "#121A3A", border: "1px solid #ffffff12", borderRadius: 999, display: "flex", alignItems: "center", padding: "0 14px", height: 42, maxWidth: 420, margin: "0 auto" }}>
          <span style={{ opacity:.4, marginRight: 8 }}>🔍</span>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar série para adicionar..." style={{ flex: 1, background: "transparent", border: 0, outline: "none", color: "#fff", fontSize: 13 }} />
          {busca && <span onClick={() => setBusca("")} style={{ cursor: "pointer", opacity:.5, fontSize: 12, marginLeft: 8 }}>✕</span>}
        </div>

        {busca && (
          <div style={{ position: "absolute", top: 62, left: 14, right: 14, maxWidth: 420, margin: "0 auto", background: "#12182F", border: "1px solid #ffffff18", borderRadius: 16, zIndex: 50, overflow: "hidden", boxShadow: "0 20px 40px #00000080" }}>
            {resultados.map(r => (
              <div key={r.id} onClick={() => adicionarSerie(r)} style={{ display: "flex", gap: 10, padding: 10, borderBottom: "1px solid #ffffff0a", cursor: "pointer" }}>
                <img src={r.img} style={{ width: 44, height: 66, borderRadius: 8, objectFit: "cover" }} />
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 800 }}>{r.titulo}</div><div style={{ fontSize: 10, color: "#FFD400", marginTop: 4, fontWeight: 800 }}>+ ADICIONAR</div></div>
              </div>
            ))}
          </div>
        )}

        {!busca && (
          <>
            <Secao titulo="Assistindo" cor="#FFD400" qtd={assistindo.length}>{assistindo.map(s => view==="grade"? <CardGrade key={s.id} s={s}/> : <CardLista key={s.id} s={s}/>)}</Secao>
            <Secao titulo="Quero Assistir" cor="#8b5cf6" qtd={queroAssistir.length}>{queroAssistir.map(s => view==="grade"? <CardGrade key={s.id} s={s}/> : <CardLista key={s.id} s={s}/>)}</Secao>
            <Secao titulo="Maratonei" cor="#22c55e" qtd={maratonei.length}>{maratonei.map(s => view==="grade"? <CardGrade key={s.id} s={s}/> : <CardLista key={s.id} s={s}/>)}</Secao>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
