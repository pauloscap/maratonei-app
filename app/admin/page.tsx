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

  useEffect(() => {
    if (localStorage.getItem("maratonei_admin") === "ok") setAuth(true)
  }, [])
  useEffect(() => { if(auth) load() }, [auth])

  async function load(){
    const r = await fetch("/api/admin/users?t="+Date.now(), { cache:"no-store" })
    const j = await r.json()
    setUsers(j.users||[])
    setTotal(j.total||0)
  }

  function login(){
    if(pass==="maratonei2025!"){ localStorage.setItem("maratonei_admin","ok"); setAuth(true) }
    else alert("Senha errada")
  }

  if(!auth){
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-sm">
          <div className="text-xl font-bold text-white mb-2">🍿 maratonei admin</div>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Senha" className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white mt-4 mb-4" />
          <button onClick={login} className="w-full bg-yellow-400 text-black font-bold py-3 rounded-xl">Entrar</button>
        </div>
      </div>
    )
  }

  const today = users.filter(u=> new Date(u.criado_em).toDateString()===new Date().toDateString()).length
  const week = users.filter(u=> (Date.now()-new Date(u.criado_em).getTime())/(1000*60*60*24)<=7).length

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">🍿 maratonei admin</h1>
          <button onClick={load} className="bg-zinc-800 px-4 py-2 rounded-xl text-sm">↻ Atualizar</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"><div className="text-xs text-zinc-500 uppercase mb-2">Total</div><div className="text-2xl font-bold text-yellow-400">{total}</div></div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"><div className="text-xs text-zinc-500 uppercase mb-2">Hoje</div><div className="text-2xl font-bold">{today}</div></div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"><div className="text-xs text-zinc-500 uppercase mb-2">Essa semana</div><div className="text-2xl font-bold">{week}</div></div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"><div className="text-xs text-zinc-500 uppercase mb-2">Último</div><div className="text-lg font-bold">{users[0]? new Date(users[0].criado_em).toLocaleDateString('pt-BR'):"—"}</div></div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="font-semibold mb-4">Últimos usuários ({users.length})</div>
          <div className="space-y-2">
            {users.map(u=>(
              <div key={u.id} className="flex items-center gap-3 bg-black border border-zinc-800 p-3 rounded-xl">
                {u.avatar_url? <img src={u.avatar_url} className="w-9 h-9 rounded-full" alt="" /> : <div className="w-9 h-9 rounded-full bg-yellow-400 text-black font-bold flex items-center justify-center text-xs">{(u.nome||"?")[0].toUpperCase()}</div>}
                <div className="flex-1"><div className="text-sm font-medium">{u.nome}</div><div className="text-xs text-zinc-500">{u.id.slice(0,8)}</div></div>
                <div className="text-xs text-zinc-500">{new Date(u.criado_em).toLocaleDateString('pt-BR')}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
