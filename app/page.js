"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { BottomNav } from "../components/BottomNav"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

const BASE = [
  { id: 101, titulo: "Abbott Elementary", status: "assistindo" },
  { id: 102, titulo: "X-Men 97", q: "X-Men 97", status: "assistindo" },
  { id: 103, titulo: "Off Campus", status: "assistindo" },
  { id: 104, titulo: "The Walking Dead", status: "assistindo" },
  { id: 201, titulo: "Elle", q: "Elle Legally Blonde", status: "ja_assisti" },
  { id: 301, titulo: "Stranger Things", status: "maratonei" },
  { id: 302, titulo: "The Last of Us", status: "maratonei" },
]

export default function Home() {
  const [userId, setUserId] = useState("anon")
  const [busca, setBusca] = useState("")
  const [series, setSeries] = useState([])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) { window.location.href = "/login"; return }
      const uid = data.session.user.id
      setUserId(uid)

      const comCapas = await Promise.all(BASE.map(async (s) => {
        try {
          const q = s.q || s.titulo
          const r = await fetch("https://api.tvmaze.com/search/shows?q=" + encodeURIComponent(q))
          const j = await r.json()
          const img = j?.[0]?.show?.image?.original || j?.[0]?.show?.image?.medium || ""
          return {...s, img: img || `https://picsum.photos/seed/${s.id}/400/600` }
        } catch { return {...s, img: `https://picsum.photos/seed/${s.id}/400/600` } }
      }))

      const final = comCapas.map(s => {
        const st = localStorage.getItem(uid + ":status-" + s.id)
        return st? {...s, status: st } : s
      })
      setSeries(final)
    }
    load()
  }, [])

  const abrir = (s) => {
    localStorage.setItem(userId + ":serie-atual", JSON.stringify(s))
    window.location.href = "/serie/" + s.id
  }

  // --- BUSCA CONSERTADA ---
  const termo = busca.toLowerCase().trim()
  const filtradas = termo? series.filter(s => s.titulo.toLowerCase().includes(termo)) : series

  const assistindo = filtradas.filter(s => s.status === "assistindo")
  const jaAssisti = filtradas.filter(s => s.status === "ja_assisti")
  const maratonei = filtradas.filter(s => s.status === "maratonei")

  const Card = ({ s }) => (
    <div onClick={() => abrir(s)} style={{ width: 124, cursor: "pointer", flexShrink: 0 }}>
      <div style={{ width: 124, height: 184, borderRadius: 12, overflow: "hidden", background: "#12182F", border: "1px solid #FFD400", position: "relative" }}>
        <img src={s.img} alt={s.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", top: 6, left: 6, background: "#FFD400", color: "#000", fontSize: 8, fontWeight: 900, padding: "3px 6px", borderRadius: 6 }}>{s.status.toUpperCase()}</div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.titulo}</div>
    </div>
  )

  const Secao = ({ titulo, cor, qtd, children }) => (
    <div style={{ marginTop: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 3, height: 14, background: cor, borderRadius: 99 }} />
        <b style={{ fontSize: 14 }}>{titulo}</b><span style={{ fontSize: 11, opacity:.4 }}>• {qtd}</span>
        {termo && <span style={{ fontSize: 11, opacity:.3, marginLeft: 6 }}>filtrado por "{termo}"</span>}
      </div>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6 }}>{children.length? children : <span style={{ fontSize: 12, opacity:.3 }}>Nenhum resultado</span>}</div>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F2A", color: "#fff", paddingBottom: 90 }}>
      <header style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", borderBottom: "1px solid #ffffff0f", position: "sticky", top: 0, background: "#0A0F2A", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 28, height: 28, borderRadius: 8, background: "#FFD400", color: "#000", display: "grid", placeItems: "center", fontWeight: 900 }}>M</div><b>maratonei</b></div>
        <div onClick={() => window.location.href = "/perfil"} style={{ width: 30, height: 30, borderRadius: 999, background: "#FFD400", color: "#000", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 12, cursor: "pointer" }}>P</div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: 14 }}>
        <div style={{ background: "#121A3A", border: "1px solid #ffffff12", borderRadius: 999, display: "flex", alignItems: "center", padding: "0 14px", height: 42, maxWidth: 420, margin: "0 auto" }}>
          <span style={{ opacity:.4, marginRight: 8 }}>🔍</span>
          <input value={busca} onChange={e => setBusca(e.target.value)} autoComplete="off" placeholder="Buscar série para adicionar..." style={{ flex: 1, background: "transparent", border: 0, outline: "none", color: "#fff", fontSize: 13 }} />
          {busca && <span onClick={() => setBusca("")} style={{ cursor: "pointer", opacity:.5, fontSize: 12, marginLeft: 8 }}>✕</span>}
        </div>

        <Secao titulo="Assistindo" cor="#FFD400" qtd={assistindo.length}>{assistindo.map(s => <Card key={s.id} s={s} />)}</Secao>
        <Secao titulo="Ja Assisti" cor="#3B82F6" qtd={jaAssisti.length}>{jaAssisti.map(s => <Card key={s.id} s={s} />)}</Secao>
        <Secao titulo="Ja Maratonei" cor="#22c55e" qtd={maratonei.length}>{maratonei.map(s => <Card key={s.id} s={s} />)}</Secao>
      </div>
      <BottomNav />
    </div>
  )
}
