"use client"
import { useEffect, useState } from "react"

export default function AdminPage(){
  const [users, setUsers] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)

  useEffect(()=>{
    fetch("/api/admin/users").then(r=>r.json()).then(setUsers)
    fetch("/api/admin/analytics").then(r=>r.json()).then(setStats)
  },[])

  return (
    <div className="min-h-screen bg-[#0a0f1f] text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard Maratonei • maratoneiapp.vercel.app</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#16213e] p-5 rounded-2xl"><p className="text-gray-400 text-sm">Usuários</p><p className="text-3xl font-bold">{stats?.totalUsuarios?? "-"}</p></div>
        <div className="bg-[#16213e] p-5 rounded-2xl"><p className="text-gray-400 text-sm">Total Watchlist</p><p className="text-3xl font-bold">{stats?.totalWatchlist?? "-"}</p></div>
        <div className="bg-[#16213e] p-5 rounded-2xl"><p className="text-gray-400 text-sm">Média por usuário</p><p className="text-3xl font-bold">{stats?.mediaPorUsuario?? "-"}</p></div>
        <div className="bg-[#16213e] p-5 rounded-2xl"><p className="text-gray-400 text-sm">Séries mais salvas</p><p className="text-3xl font-bold">{stats?.topSeries?.[0]?.titulo || "-"}</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#16213e] p-5 rounded-2xl">
          <h2 className="font-bold mb-4">Top séries / filmes mais salvos</h2>
          {stats?.topSeries?.map((s:any,i:number)=>(
            <div key={i} className="mb-3">
              <div className="flex justify-between text-sm mb-1"><span>{s.titulo}</span><span>{s.count}</span></div>
              <div className="h-2 bg-black/30 rounded"><div className="h-2 bg-purple-500 rounded" style={{width:`${(s.count/(stats.topSeries[0].count||1))*100}%`}} /></div>
            </div>
          )) || <p className="text-gray-400">Sem dados ainda</p>}
        </div>
        <div className="bg-[#16213e] p-5 rounded-2xl">
          <h2 className="font-bold mb-4">Top usuários engajados</h2>
          {stats?.topUsuarios?.map((u:any)=><div key={u.user_id} className="flex justify-between py-2 border-b border-white/10 text-sm"><span className="truncate">{u.user_id}</span><span>{u.count} itens</span></div>)}
        </div>
      </div>

      <div className="bg-[#16213e] p-5 rounded-2xl">
        <h2 className="font-bold mb-4">Últimos cadastros - {users.length} usuários</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {users.slice(0,12).map((u:any)=>(
            <div key={u.id} className="flex items-center gap-3 bg-black/20 p-3 rounded-xl">
              <img src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.nome || u.email}`} className="w-10 h-10 rounded-full" />
              <div><p className="text-sm font-bold truncate">{u.nome || "Sem nome"}</p><p className="text-xs text-gray-400 truncate">{u.email}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
