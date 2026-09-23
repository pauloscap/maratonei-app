"use client"
import { useEffect, useState } from "react"

type Profile = {
  id: string
  nome: string | null
  avatar_url: string | null
  criado_em: string
}

export default function AdminPage() {
  const [auth, setAuth] = useState(false)
  const [pass, setPass] = useState("")
  const [users, setUsers] = useState<Profile[]>([])
  const [total, setTotal] = useState(0)

  const correctPass = "maratonei2025!"

  useEffect(() => {
    if (localStorage.getItem("maratonei_admin") === "ok") setAuth(true)
  }, [])
  useEffect(() => { if(auth) fetchUsers() }, [auth])

  async function fetchUsers() {
    const res = await fetch("/api/admin/users?t=" + Date.now(), { cache: "no-store" })
    const json = await res.json()
    setUsers(json.users || [])
    setTotal(json.total || 0)
  }

  if (!auth) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 w-full max-w-sm">
          <div className="text-xl font-bold text-white mb-2">🍿 maratonei admin</div>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Senha" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white mb-4" onKeyDown={e=>e.key==='Enter'&&handleLogin()} />
          <button onClick={handleLogin} className="w-full bg-[#FFD400] text-black font-bold py-3 rounded-xl">Entrar</button>
        </div>
      </div>
    )
  }
  function handleLogin(){ if(pass===correctPass){ localStorage.setItem("maratonei_admin","ok"); setAuth(true)} else alert("Senha errada") }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between mb-8"><h1 className="text-2xl font-bold">🍿 maratonei admin - {total} usuários</h1><button onClick={fetchUsers} className="bg-white/10 px-4 py-2 rounded-xl">↻</button></div>
        <div className="space-y-2">
          {users.map(u=>(
            <div key={u.id} className="flex items-center gap-3 bg-white/[0.03] p-3 rounded-xl">
              {u.avatar_url? <img src={u.avatar_url} className="w-8 h-8 rounded-full" alt="" /> : <div className="w-8 h-8 rounded-full bg-[#FFD400] text-black flex items-center justify-center font-bold">{(u.nome||"?")[0]}</div>}
              <div className="flex-1"><div className="text-sm font-medium">{u.nome||"Sem nome"}</div><div className="text-xs text-white/40">{u.id.slice(0,8)}</div></div>
              <div className="text-xs text-white/30">{new Date(u.criado_em).toLocaleDateString('pt-BR')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
