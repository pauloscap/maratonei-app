"use client"
import { useEffect, useState } from "react"

export default function AdminPage() {
  const [auth, setAuth] = useState(false)
  const [pass, setPass] = useState("")
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (localStorage.getItem("maratonei_admin") === "ok") setAuth(true)
  }, [])
  useEffect(() => { if (auth) load() }, [auth])

  async function load() {
    const r = await fetch("/api/admin/users?t=" + Date.now(), { cache: "no-store" })
    const j = await r.json()
    setUsers(j.users || [])
    setTotal(j.total || 0)
  }

  if (!auth) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#141414", border: "1px solid #222", borderRadius: 16, padding: 32, width: 360 }}>
          <div style={{ color: "white", fontWeight: 700, fontSize: 20, marginBottom: 8 }}>🍿 maratonei admin</div>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Senha" style={{ width: "100%", background: "#000", border: "1px solid #333", borderRadius: 12, padding: "12px 16px", color: "white", marginBottom: 16 }} />
          <button onClick={() => { if (pass === "maratonei2025!") { localStorage.setItem("maratonei_admin", "ok"); setAuth(true) } else alert("Senha errada") }} style={{ width: "100%", background: "#FFD400", color: "black", fontWeight: 700, padding: 12, borderRadius: 12, border: "none", cursor: "pointer" }}>Entrar</button>
        </div>
      </div>
    )
  }

  const today = users.filter(u => new Date(u.criado_em).toDateString() === new Date().toDateString()).length
  const week = users.filter(u => (Date.now() - new Date(u.criado_em).getTime()) / (1000 * 60 * 60 * 24) <= 7).length

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", color: "white", padding: 24, fontFamily: "Inter, sans-serif" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>🍿 maratonei admin - {total} usuários</h1>
          <button onClick={load} style={{ background: "#1A1A1A", border: "1px solid #2A2A2A", color: "white", padding: "8px 16px", borderRadius: 10, cursor: "pointer" }}>↻ Atualizar</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
          <div style={{ background: "#141414", border: "1px solid #222", borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: "#666", textTransform: "uppercase", marginBottom: 12 }}>Total Usuários</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#FFD400" }}>{total}</div>
          </div>
          <div style={{ background: "#141414", border: "1px solid #222", borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: "#666", textTransform: "uppercase", marginBottom: 12 }}>Novos hoje</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{today}</div>
          </div>
          <div style={{ background: "#141414", border: "1px solid #222", borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: "#666", textTransform: "uppercase", marginBottom: 12 }}>Novos essa semana</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{week}</div>
          </div>
          <div style={{ background: "#141414", border: "1px solid #222", borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: "#666", textTransform: "uppercase", marginBottom: 12 }}>Último cadastro</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{users[0]? new Date(users[0].criado_em).toLocaleDateString('pt-BR') : "—"}</div>
          </div>
        </div>

        <div style={{ background: "#141414", border: "1px solid #222", borderRadius: 20, padding: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 16 }}>Últimos usuários ({users.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {users.map(u => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "#0F0F0F", border: "1px solid #1E1E1E", borderRadius: 12, padding: 12 }}>
                {u.avatar_url? <img src={u.avatar_url} style={{ width: 36, height: 36, borderRadius: 999, objectFit: "cover" }} alt="" /> : <div style={{ width: 36, height: 36, borderRadius: 999, background: "#FFD400", color: "black", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{(u.nome || "?")[0].toUpperCase()}</div>}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{u.nome}</div>
                  <div style={{ fontSize: 11, color: "#666" }}>{u.id.slice(0, 8)} • {new Date(u.criado_em).toLocaleDateString('pt-BR')}</div>
                </div>
                <div style={{ fontSize: 11, color: "#555" }}>{new Date(u.criado_em).toLocaleDateString('pt-BR')}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
