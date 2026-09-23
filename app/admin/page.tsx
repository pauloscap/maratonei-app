"use client"
import { useEffect, useState } from "react"

export default function AdminPage(){
  const [users,setUsers]=useState<any[]>([])
  const [stats,setStats]=useState<any>(null)

  useEffect(()=>{
    fetch("/api/admin/users").then(r=>r.json()).then(d=>setUsers(Array.isArray(d)?d:[]))
    fetch("/api/admin/analytics").then(r=>r.json()).then(setStats)
  },[])

  return (
    <div className="min-h-screen bg-[#0a0f1f] text-white p-6">
      <h1 className="text-3xl font-bold">Maratonei Admin</h1>
      <p className="text-gray-400 mb-6">maratoneiapp.vercel.app • base real</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#16213e] p-4 rounded-xl"><div className="text-xs text-gray-400">Usuários</div><div className="text-2xl font-bold">{stats?.totalUsuarios || users.length}</div></div>
        <div className="bg-[#16213e] p-4 rounded-xl"><div className="text-xs text-gray-400">Watchlist</div><div className="text-2xl font-bold">{stats?.totalWatchlist}</div></div>
        <div className="bg-[#16213e] p-4 rounded-xl"><div className="text-xs text-gray-400">Média / user</div><div className="text-2xl font-bold">{stats?.mediaPorUsuario}</div></div>
        <div className="bg-[#16213e] p-4 rounded-xl"><div className="text-xs text-gray-400">Top 1</div><div className="font-bold truncate">{stats?.topSeries?.[0]?.titulo || "-"}</div></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#16213e] p-4 rounded-xl">
          <h3 className="font-bold mb-3">Top séries/filmes</h3>
          {stats?.topSeries?.map((s:any,i:number)=><div key={i} className="flex justify-between py-2 border-b border-white/10 text-sm"><span>{i+1}. {s.titulo}</span><b>{s.count}</b></div>)}
        </div>
        <div className="bg-[#16213e] p-4 rounded-xl">
          <h3 className="font-bold mb-3">Gêneros</h3>
          {stats?.topGeneros?.length? stats.topGeneros.map((g:any,i:number)=><div key={i} className="flex justify-between py-2 border-b border-white/10 text-sm"><span>{g.genero}</span><b>{g.count}</b></div>) : <p className="text-sm text-gray-400">Salve um título novo com o código novo do salvar-titulo que o gênero já aparece aqui</p>}
        </div>
      </div>

      <div className="bg-[#16213e] p-4 rounded-xl">
        <h3 className="font-bold mb-4">Usuários ({users.length}) - Base real do Supabase</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {users.map((u:any)=>(
            <div key={u.id} className="flex items-center gap-3 bg-black/20 p-3 rounded-lg border border-white/5">
              <img src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.nome||"U")}`} className="w-10 h-10 rounded-full bg-white object-cover" alt="" />
              <div className="min-w-0">
                <div className="text-sm font-bold truncate">{u.nome || "Sem nome"}</div>
                <div className="text- text-gray-400">{new Date(u.criado_em).toLocaleDateString("pt-BR")}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
