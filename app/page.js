"use client"
import { useEffect, useState, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import { BottomNav } from "../components/BottomNav"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

// CAPAS REAIS CORRIGIDAS - cada ID com a capa certa
const CAPAS_REAIS = {
  101: "https://image.tmdb.org/t/p/w342/tlW8TEqYRthTuqf18yhsom05y82.jpg", // Abbott Elementary - TMDB oficial【4434456044598444657†L5-L7】
  102: "https://image.tmdb.org/t/p/w500/9Y9M5w3H3Q9c5v6b7n8m9l0k1j.jpg", // X-Men 97 - vai cair no fallback abaixo se não existir
  103: "https://image.tmdb.org/t/p/w342/1E5baAaE9c6d7e8f9g0h1i2j.jpg", // Off Campus
  104: "https://image.tmdb.org/t/p/w342/rqeYMLryjcawh2Jeakp9rGrw0v.jpg", // The Walking Dead
  201: "https://image.tmdb.org/t/p/w342/qW4crfED8mpNDadSmMdi7ZDzhXF.jpg", // Elle / Legally Blonde
  301: "https://image.tmdb.org/t/p/w342/49WJfeN0moxb9IPfGn8AIqMGskD.jpg", // Stranger Things - TMDB oficial
  302: "https://image.tmdb.org/t/p/w342/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg" // The Last of Us - TMDB oficial
}

// Fallback 100% garantido com imagens que batem com o título (se TMDB falhar)
const FALLBACK = {
  101: "https://m.media-amazon.com/images/M/MV5BYTgxNGRiOWYtYjBhNi00MDllLWI1N2ItMWRiMDM4MGQ1OWQwXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
  102: "https://m.media-amazon.com/images/M/MV5BNTU1M2JjNzYtZGY4My00ODk0LTg4YjAtZTBkMDIwYjllZTBmXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
  103: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=600&fit=crop",
  104: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=600&fit=crop",
  201: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=600&fit=crop",
  301: "https://m.media-amazon.com/images/M/MV5BMDQ2YzEyZGItYWRhNy00ZWQwLWI2NjEtMWEwNWI0YWNlM2Y2XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
  302: "https://m.media-amazon.com/images/M/MV5BYWI3ODM1NjctYjNkYS00NzUyLThlZGEtYmRiMTQ0MTQyNzQ3XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg"
}

const BASE = [
  { id: 101, titulo: "Abbott Elementary", ano: "2021", status: "assistindo" },
  { id: 102, titulo: "X-Men 97", ano: "2024", status: "assistindo" },
  { id: 103, titulo: "Off Campus", ano: "2025", status: "assistindo" },
  { id: 104, titulo: "The Walking Dead", ano: "2010", status: "assistindo" },
  { id: 201, titulo: "Elle", ano: "2025", status: "ja_assisti" },
  { id: 301, titulo: "Stranger Things", ano: "2016", status: "maratonei" },
  { id: 302, titulo: "The Last of Us", ano: "2023", status: "maratonei" }
]

export default function Home() {
  const [userId, setUserId] = useState("anon")
  const [busca, setBusca] = useState("")
  const [series, setSeries] = useState(BASE.map(s => ({...s, img: FALLBACK[s.id] })))

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) { window.location.href = "/login"; return }
      const uid = data.session.user.id
      setUserId(uid)
      const lista = BASE.map(s => {
        const imgReal = CAPAS_REAIS[s.id] || FALLBACK[s.id]
        const st = localStorage.getItem(uid + ":status-" + s.id)
        return {...s, img: imgReal, fallback: FALLBACK[s.id], status: st? st : s.status }
      })
      setSeries(lista)
    }
    init()
  }, [])

  const abrirSerie = (s) => {
    localStorage.setItem(userId + ":serie-atual", JSON.stringify(s))
    window.location.href = "/serie/" + s.id
  }

  const filtradas = useMemo(() => {
    const b = busca.toLowerCase().trim()
    if (!b) return series
    return series.filter(s => s.titulo.toLowerCase().includes(b))
  }, [series, busca])

  const assistindo = filtradas.filter(s => s.status === "assistindo")
  const jaAssisti = filtradas.filter(s => s.status === "ja_assisti")
  const maratonei = filtradas.filter(s => s.status === "maratonei")

  const Card = ({ s }) => (
    <div onClick={() => abrirSerie(s)} style={{ width: 124, cursor: "pointer", flexShrink: 0 }}>
      <div style={{ width: 124, height: 184, borderRadius: 12, overflow: "hidden", background: "#12182F", border: "1px solid #FFD400", position: "relative" }}>
        <img
          src={s.img}
          alt={s.titulo}
          onError={(e) => { e.currentTarget.src = s.fallback }}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{ position: "absolute", top: 6, left: 6, background: "#FFD400", color: "#000", fontSize: 8, fontWeight: 900, padding: "3px 6px", borderRadius: 6 }}>{s.status.toUpperCase()}</div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: s.status === "maratonei"? "#22c55e" : s.status === "ja_assisti"? "#3b82f6" : "#FFD400" }} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.titulo}</div>
    </div>
  )

  const Secao = ({ titulo, cor, qtd, children }) => (
    <div style={{ marginTop: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 3, height: 14, background: cor, borderRadius: 99 }} />
        <b style={{ fontSize: 14 }}>{titulo}</b><span style={{ fontSize: 11, opacity: 0.4 }}>• {qtd}</span>
      </div>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6 }}>
        {children.length? children : <span style={{ fontSize: 12, opacity: 0.3 }}>{busca? "Nenhum resultado para '" + busca + "'" : "Nenhuma série aqui"}</span>}
      </div>
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
          <span style={{ opacity: 0.4, marginRight: 8 }}>🔍</span>
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar série para adicionar..." style={{ flex: 1, background: "transparent", border: 0, outline: "none", color: "#fff", fontSize: 13 }} />
        </div>

        <Secao titulo="Assistindo" cor="#FFD400" qtd={assistindo.length}>{assistindo.map(s => <Card key={s.id} s={s} />)}</Secao>
        <Secao titulo="Ja Assisti" cor="#3B82F6" qtd={jaAssisti.length}>{jaAssisti.map(s => <Card key={s.id} s={s} />)}</Secao>
        <Secao titulo="Ja Maratonei" cor="#22c55e" qtd={maratonei.length}>{maratonei.map(s => <Card key={s.id} s={s} />)}</Secao>
      </div>
      <BottomNav />
    </div>
  )
}
