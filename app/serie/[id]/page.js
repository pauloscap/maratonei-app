"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

export default function DetalheSerie({ params }) {
  const id = String(params.id)
  const [userId, setUserId] = useState("anon")
  const [serie, setSerie] = useState(null)
  const [status, setStatus] = useState("assistindo")
  const [eps, setEps] = useState([])
  const [aberta, setAberta] = useState(1)

  useEffect(() => {
    const run = async () => {
      const r = await supabase.auth.getSession()
      const sess = r.data.session
      if (!sess) { window.location.href = "/login"; return }
      const uid = sess.user.id
      setUserId(uid)
      let s = null
      try {
        const raw = localStorage.getItem(uid + ":serie-atual")
        if (raw) s = JSON.parse(raw)
      } catch {}
      if (!s || String(s.id)!== id) {
        s = { id: id, titulo: "Serie " + id, ano: "2024", img: "https://picsum.photos/seed/" + id + "/500/750" }
      }
      setSerie(s)
      const st = localStorage.getItem(uid + ":status-" + id)
      if (st) setStatus(st)
      const e = JSON.parse(localStorage.getItem(uid + ":eps-" + id) || "[]")
      setEps(e)
    }
    run()
  }, [id])

  const toggle = (eid) => {
    let novo
    if (eps.includes(eid)) { novo = eps.filter((x) => x!== eid) } else { novo = [...eps, eid] }
    setEps(novo)
    localStorage.setItem(userId + ":eps-" + id, JSON.stringify(novo))
  }

  const maratonar = (t) => {
    const lista = Array.from({ length: 10 }, (_, i) => t + "-" + (i + 1))
    const todos = lista.every((x) => eps.includes(x))
    let novo
    if (todos) { novo = eps.filter((x) =>!lista.includes(x)) } else { novo = [...new Set([...eps,...lista])] }
    setEps(novo)
    localStorage.setItem(userId + ":eps-" + id, JSON.stringify(novo))
  }

  if (!serie) return null
  const progresso = Math.round((eps.length / 30) * 100)

  return (
    <div style={{ minHeight: "100vh", background: "#080B1F", color: "#fff" }}>
      <div style={{ height: 280, position: "relative" }}>
        <img src={serie.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #00000030, #080B1F 95%)" }} />
        <button onClick={() => history.back()} style={{ position: "absolute", top: 14, left: 14, width: 34, height: 34, borderRadius: 999, background: "#0009", border: "1px solid #ffffff22", color: "#fff" }}>{"<"}</button>
        <div style={{ position: "absolute", bottom: -18, left: 16, display: "flex", gap: 12, alignItems: "flex-end" }}>
          <img src={serie.img} alt="" style={{ width: 90, height: 135, borderRadius: 12, objectFit: "cover", border: "2px solid #ffffff18" }} />
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{serie.titulo}</h1>
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>{eps.length} vistos • {progresso}%</div>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "36px 14px 14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          <button onClick={() => { setStatus("assistindo"); localStorage.setItem(userId + ":status-" + id, "assistindo") }} style={{ padding: 11, borderRadius: 12, fontWeight: 800, fontSize: 12, border: status === "assistindo"? "1px solid #FFD400" : "1px solid #ffffff12", background: status === "assistindo"? "#FFD400" : "#12182F", color: status === "assistindo"? "#000" : "#fff" }}>Assistindo</button>
          <button onClick={() => { setStatus("ja_assisti"); localStorage.setItem(userId + ":status-" + id, "ja_assisti") }} style={{ padding: 11, borderRadius: 12, fontWeight: 800, fontSize: 12, border: status === "ja_assisti"? "1px solid #3b82f6" : "1px solid #ffffff12", background: status === "ja_assisti"? "#3b82f6" : "#12182F", color: "#fff" }}>Ja Assisti</button>
          <button onClick={() => { setStatus("maratonei"); localStorage.setItem(userId + ":status-" + id, "maratonei") }} style={{ padding: 11, borderRadius: 12, fontWeight: 800, fontSize: 12, border: status === "maratonei"? "1px solid #22c55e" : "1px solid #ffffff12", background: status === "maratonei"? "#22c55e" : "#12182F", color: "#fff" }}>Maratonei</button>
        </div>
        <div style={{ background: "#12182F", border: "1px solid #ffffff0e", borderRadius: 16, padding: 12 }}>
          <b style={{ fontSize: 13 }}>Temporadas e Episodios</b>
          {[1, 2, 3].map((t) => {
            const vistos = Array.from({ length: 10 }, (_, i) => t + "-" + (i + 1)).filter((x) => eps.includes(x)).length
            const aberto = aberta === t
            return (
              <div key={t} style={{ borderTop: "1px solid #ffffff08", marginTop: 10, paddingTop: 10 }}>
                <div onClick={() => setAberta(aberto? 0 : t)} style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Temporada {t} <span style={{ fontSize: 11, background: "#ffffff12", padding: "2px 6px", borderRadius: 99 }}>{vistos}/10</span></span>
                  <button onClick={(e) => { e.stopPropagation(); maratonar(t) }} style={{ fontSize: 10, padding: "4px 8px", borderRadius: 99, border: "1px solid #FFD40040", background: vistos === 10? "#22c55e" : "#FFD40018", color: vistos === 10? "#fff" : "#FFD400" }}>{vistos === 10? "Desmarcar" : "Maratonar tudo"}</button>
                </div>
                {aberto && <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((ep) => {
                    const eid = t + "-" + ep
                    const ok = eps.includes(eid)
                    return <div key={eid} onClick={() => toggle(eid)} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 10px", borderRadius: 10, background: ok? "#ffffff0b" : "transparent", border: "1px solid #ffffff10", cursor: "pointer" }}><div style={{ width: 18, height: 18, borderRadius: 5, border: "1.5px solid #ffffff30", background: ok? "#22c55e" : "transparent", display: "grid", placeItems: "center", fontSize: 10, color: "#fff" }}>{ok? "✓" : ""}</div><div style={{ flex: 1, fontSize: 13 }}>Episodio {ep}</div><div style={{ fontSize: 10, opacity: 0.4 }}>{ok? "Visto" : "Marcar"}</div></div>
                  })}
                </div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
