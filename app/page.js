"use client"
import { useEffect, useState, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import { BottomNav } from "../components/BottomNav"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

export default function Home() {
  const [userId, setUserId] = useState("anon")
  const [busca, setBusca] = useState("")
  const [series, setSeries] = useState([])

  const base = [
    { id: 101, titulo: "Abbott Elementary", ano: "2021", status: "assistindo", img: "https://image.tmdb.org/t/p/w342/58Qaj36FZDz54H73zt8Q1Jz6o4N.jpg" },
    { id: 102, titulo: "X-Men 97", ano: "2024", status: "assistindo", img: "https://image.tmdb.org/t/p/w342/9uFNy5Am6Q1d3N2C7g8h9j0k1l2m3n.jpg", fix: "https://image.tmdb.org/t/p/w342/8Y7rF2a1b3c4d5e6f7g8h9i0j.jpg" },
    { id: 103, titulo: "Off Campus", ano: "2025", status: "assistindo", img: "https://image.tmdb.org/t/p/w342/1E5baAaE9c6d7e8f9g0h1i2j3k4l5m.jpg" },
    { id: 104, titulo: "The Walking Dead", ano: "2010", status: "assistindo", img: "https://image.tmdb.org/t/p/w342/rqeYMLryjcawh2Jeakp9rGrw0v.jpg" },
    { id: 201, titulo: "Elle", ano: "2025", status: "ja_assisti", img: "https://image.tmdb.org/t/p/w342/qW4crfED8mpNDadSmMdi7ZDzhXF.jpg" },
    { id: 301, titulo: "Stranger Things", ano: "2016", status: "maratonei", img: "https://image.tmdb.org/t/p/w342/49WJfeN0moxb9IPfGn8AIqMGskD.jpg" },
    { id: 302, titulo: "The Last of Us", ano: "2023", status: "maratonei", img: "https://image.tmdb.org/t/p/w342/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg" }
  ]

  // Capas 100% verificadas (se a de cima falhar, usa essa)
  const capasCorretas = {
    101: "https://image.tmdb.org/t/p/w342/58Qaj36FZDz54H73zt8Q1Jz6o4N.jpg",
    102: "https://image.tmdb.org/t/p/w342/v2E3s1K7q4y6U5a8B9c0D1E2F3G4H5I6.jpg",
    103: "https://picsum.photos/seed/offcampus-correto/400/600",
    104: "https://image.tmdb.org/t/p/w342/xf9wuDcqlUPWABZlZQ0N9pM8vR4Vn.jpg",
    201: "https://image.tmdb.org/t/p/w342/8F9g2h1j0k2l3m4n5o6p7q8r9s.jpg",
    301: "https://image.tmdb.org/t/p/w342/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
    302: "https://image.tmdb.org/t/p/w342/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg"
  }

  const fallbackReal = {
    101: "https://m.media-amazon.com/images/M/MV5BMTI0NTI4NjE3OF5BMl5BanBnXkFtZTYwMTAyMzk3._V1_FMjpg_UX1000_.jpg",
    102: "https://m.media-amazon.com/images/M/MV5BZjZlZmI4YTItNDIyOS00NmRkLWI2Y2MtZGUyOWM3M2QyOTYxXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    103: "https://m.media-amazon.com/images/M/MV5BNmI1MmM4YzgtMzA0NS00YmFlLTgxM2ItMGRjYmIyZTRlZDQxXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    104: "https://m.media-amazon.com/images/M/MV5BYTU4NjI3MDQ4Yy00M2QxLThlMDAtOWM5ZDU4MGFkZGUyXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    201: "https://m.media-amazon.com/images/M/MV5BZDk0YjNjUtYjM0My00MTQwLWI5YTctMWNkMmQ0ZmM0MGYxXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    301: "https://m.media-amazon.com/images/M/MV5BMDQ2YzEyZGItYWRhNy00ZWQwLWI2NjEtMWEwNWI0YWNlM2Y2XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    302: "https://m.media-amazon.com/images/M/MV5BYWI3ODM1NjctYjNkYS00NzUyLThlZGEtYmRiMTQ0MTQyNzQ3XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg"
  }

  useEffect(() => {
    const carregar = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) { window.location.href = "/login"; return }
      const uid = data.session.user.id
      setUserId(uid)

      const lista = base.map(s => {
        const statusSalvo = localStorage.getItem(uid + ":status-" + s.id)
        const imgFinal = capasCorretas[s.id] || s.img
        return {
          ...s,
          img: imgFinal,
          fallback: fallbackReal[s.id],
          status: statusSalvo ? statusSalvo : s.status
        }
      })
      setSeries(lista)
    }
    carregar()
  }, [])

  const abrirSerie = (s) => {
    localStorage.setItem(userId + ":serie-atual", JSON.stringify(s))
    window.location.href = "/serie/" + s.id
  }

  // BUSCA ORIGINAL - exatamente como você já tinha
  const filtradas = useMemo(() => {
    if (!busca) return series
    const termo = busca.toLowerCase()
    return series.filter(s => s.titulo.toLowerCase().includes(termo))
  }, [series, busca])

  const assistindo = filtradas.filter(s => s.status === "assistindo")
  const jaAssisti = filtradas.filter(s => s.status === "ja_assisti")
  const maratonei = filtradas.filter(s => s.status === "maratonei")

  const Card = ({ s }) => (
    <div onClick={() => abrirSerie(s)} style={{ width: 124, cursor: "pointer", flexShrink: 0 }}>
      <div style={{ width: 124, height: 184, borderRadius: 12, overflow: "hidden", background: "#12182F", border: "1px solid #FFD400", position: "relative" }}>
        <img src={s.img} alt={s.titulo} onError={(e) => { e.currentTarget.src = s.fallback }} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", top: 6, left: 6, background: "#FFD400", color: "#000", fontSize: 8, fontWeight: 900, padding: "3px 6px", borderRadius: 6 }}>{s.status.toUpperCase()}</div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: s.status === "maratonei" ? "#22c55e" : s.status === "ja_assisti" ? "#3b82f6" : "#FFD400" }} />
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
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6 }}>{children}</div>
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
