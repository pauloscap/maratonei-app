"use client"
import { useEffect, useState } from "react"

export default function AdminPage(){
  const [users,setUsers]=useState<any[]>([])
  const [stats,setStats]=useState<any>(null)

  useEffect(()=>{
    fetch("/api/admin/users").then(r=>r.json()).then(setUsers)
    fetch("/api/admin/analytics").then(r=>r.json()).then(setStats)
  },[])

  return (
    <div className="min-h-screen bg-[#0a0f1f] text-white p-6">
      <h1 className="text-3xl font-bold mb-2">Maratonei Admin</h1>
      <p className="text-gray-400 mb-6">maratoneiapp.vercel.app • {stats?.totalUsuarios || 0} usuários</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#16213e] p-5 rounded-2xl border border-white/10"><p className="text-gray-400 text-xs">USUÁRIOS</p><p className="text-3xl font-bold">{stats?.totalUsuarios?? "-"}</p></div>
        <div className="bg-[#16213e] p-5 rounded-2xl border border-white/10"><p className="text-gray-400 text-xs">WATCHLIST TOTAL</p><p className="text-3xl font-bold">{stats?.totalWatchlist?? "-"}</p></div>
        <div className="bg-[#16213e] p-5 rounded-2xl border border-white/10"><p className="text-gray-400 text-xs">MÉDIA / USER</p><p className="text-3xl font-bold">{stats?.mediaPorUsuario?? "-"}</p></div>
        <div className="bg-[#16213e] p-5 rounded-2xl border border-white/10"><p className="text-gray-400 text-xs">TOP 1 AGORA</p><p className="text-lg font-bold truncate">{stats?.topSeries?.[0]?.titulo || "-"}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#16213e] p-6 rounded-2xl border border-white/10 lg:col-span-2">
          <h2 className="font-bold mb-5">📈 Filmes / Séries mais salvos</h2>
          {stats?.topSeries?.length? stats.topSeries.map((s:any,i:number)=>(
            <div key={i} className="mb-4">
              <div className="flex justify-between text-sm mb-1"><span className="truncate pr-2">{i+1}. {s.titulo}</span><span className="font-bold">{s.count}</span></div>
              <div className="h-2.5 bg-black/40 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{width:`${(s.count/(stats.topSeries[0].count||1))*100}%`}} /></div>
            </div>
          )) : <p className="text-gray-500 text-sm">Salve 2-3 títulos novos pra aparecer aqui</p>}
        </div>

        <div className="bg-[#16213e] p-6 rounded-2xl border border-white/10">
          <h2 className="font-bold mb-5">🎭 Gêneros mais assistidos</h2>
          {stats?.topGeneros?.length? stats.topGeneros.map((g:any,i:number)=>{
            const total = stats.topGeneros.reduce((acc:any,cur:any)=>acc+cur.count,0)
            const pct = Math.round((g.count/total)*100)
            return (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full" style={{background:`hsl(${270-i*30} 80% 60%)`}} /><span className="text-sm">{g.genero}</span></div>
                <span className="text-sm font-bold">{g.count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
              </div>
            )
          }) : (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">🍿</p>
              <p className="text-sm text-gray-400">Ainda sem gêneros.<br/>Salve a Elle de novo com o código novo que já preenche.</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#16213e] p-6 rounded-2xl border border-white/10">
        <h2 className="font-bold mb-4">👥 Últimos usuários ({users.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {users.slice(0,18).map((u:any)=>(
            <div key={u.id} className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
              <img src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.nome||u.email||"U")}`} className="w-10 h-10 rounded-full bg-white" />
              <div className="min-w-0"><p className="text-sm font-bold truncate">{u.nome || "Sem nome"}</p><p className="text- text-gray-400 truncate">{u.email}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
