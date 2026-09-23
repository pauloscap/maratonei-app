"use client"
import { useEffect, useState } from "react"

type Profile = any

export default function AdminPage() {
  const [auth, setAuth] = useState(false)
  const [pass, setPass] = useState("")
  const [users, setUsers] = useState<Profile[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const correctPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "maratonei2025!"

  useEffect(() => {
    if (localStorage.getItem("maratonei_admin") === "ok") setAuth(true)
  }, [])

  useEffect(() => {
    if (!auth) return
    fetchUsers()
  }, [auth])

  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/users?t=" + Date.now(), { cache: "no-store" })
      const json = await res.json()
      console.log("API RETORNOU:", json.users?.[0])
      setUsers(json.users || [])
      setTotal(json.total || json.count || 0)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const getNome = (u: any) => u.nome || u.full_name || u.name || "Sem nome"
  const getData = (u: any) => u.criado_em || u.created_at || u.createdAt
  const getAvatar = (u: any) => u.avatar_url || u.avatar

  const formatDate = (d: any) => {
    if (!d) return "—"
    const date = new Date(d)
    return isNaN(date.getTime())? "—" : date.toLocaleDateString('pt-BR')
  }

  const today = users.filter(u => {
    const dStr = getData(u)
    if(!dStr) return false
    const d = new Date(dStr)
    return!isNaN(d.getTime()) && d.toDateString() === new Date().toDateString()
  }).length

  const week = users.filter(u => {
    const dStr = getData(u)
    if(!dStr) return false
    const d = new Date(dStr)
    if(isNaN(d.getTime())) return false
    const diff = (Date.now() - d.getTime()) / (1000*60*60*24)
    return diff <= 7
  }).length

  if (!auth) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 w-full max-w-sm">
          <div className="text-xl font-bold text-white mb-2">🍿 maratonei admin</div>
          <div className="text-white/40 text-sm mb-6">Digite a senha</div>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Senha" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white outline-none mb-4" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          <button onClick={handleLogin} className="w-full bg-[#FFD400] text-black font-bold py-3 rounded-xl">Entrar</button>
        </div>
      </div>
    )
  }

  function handleLogin() {
    if (pass === correctPass) {
      localStorage.setItem("maratonei_admin", "ok")
      setAuth(true)
    } else alert("Senha errada")
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">🍿 maratonei admin</h1>
          <div className="flex gap-2">
            <button onClick={fetchUsers} className="bg-white/10 px-4 py-2 rounded-xl text-sm">↻ Atualizar</button>
            <button onClick={() => { localStorage.removeItem("maratonei_admin"); setAuth(false) }} className="bg-white/5 px-4 py-2 rounded-xl text-sm">Sair</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Stat label="Total Usuários" value={total} accent />
          <Stat label="Novos hoje" value={today} />
          <Stat label="Novos essa semana" value={week} />
          <Stat label="Último cadastro" value={users[0]? formatDate(getData(users[0])) : "—"} />
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Últimos usuários ({users.length}) {loading && "• carregando..."}</h2>
          <div className="space-y-2 max-h- overflow-auto pr-2">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between bg-white/[0.03] p-3 rounded-xl">
                <div className="flex items-center gap-3">
                  {getAvatar(u)? <img src={getAvatar(u)} className="w-8 h-8 rounded-full object-cover" alt="" /> : <div className="w-8 h-8 rounded-full bg-[#FFD400] text-black flex items-center justify-center font-bold text-xs">{getNome(u)[0].toUpperCase()}</div>}
                  <div>
                    <div className="text-sm font-medium">{getNome(u)}</div>
                    <div className="text-xs text-white/40">{u.id.slice(0,8)}</div>
                  </div>
                </div>
                <div className="text-xs text-white/30">{formatDate(getData(u))}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5"><div className="text- uppercase tracking-widest text-white/40 mb-3">{label}</div><div className={`text-2xl font-semibold tracking-tight leading-none ${accent? "text-[#FFD400]" : ""}`}>{value}</div></div>
}
