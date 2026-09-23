"use client"
import { useEffect, useState } from "react"

export default function AdminPage() {
  const [data, setData] = useState<any>(null)

  async function load() {
    const res = await fetch("/api/admin/analytics")
    const json = await res.json()
    setData(json)
  }
  useEffect(() => { load() }, [])

  if (!data) return <div className="p-10 text-white">Carregando base real...</div>

  const media = data.totalWatchlist && data.totalSeries
   ? (data.totalWatchlist / 17).toFixed(1)
    : 0

  return (
    <div className="min-h-screen bg-[#0f1020] text-white p-6">
      <h1 className="text-3xl font-bold">Maratonei Admin</h1>
      <p className="opacity-60 text-sm mb-6">maratoneiapp.vercel.app • base real do Supabase • 17 usuários</p>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1a1c36] p-4 rounded-xl">
          <p className="text-xs opacity-60">USUÁRIOS</p>
          <p className="text-3xl font-bold">17</p>
          <p className="text-xs text-emerald-400">● online</p>
        </div>
        <div className="bg-[#1a1c36] p-4 rounded-xl">
          <p className="text-xs opacity-60">WATCHLIST</p>
          <p className="text-3xl font-bold">{data.totalWatchlist}</p>
          <p className="text-xs opacity-60">total salvo</p>
        </div>
        <div className="bg-[#1a1c36] p-4 rounded-xl">
          <p className="text-xs opacity-60">MÉDIA / USER</p>
          <p className="text-3xl font-bold">{media}</p>
          <p className="text-xs opacity-60">filmes por pessoa</p>
        </div>
        <div className="bg-[#1a1c36] p-4 rounded-xl">
          <p className="text-xs opacity-60">TOP 1 AGORA</p>
          <p className="text-sm font-bold">{data.topSeries?.[0]?.titulo || '—'}</p>
          <p className="text-xs opacity-60">{data.topSeries?.[0]?.total || 0} saves</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-[#1a1c36] p-4 rounded-xl">
          <p className="font-bold mb-3">📺 Filmes / Séries mais salvos</p>
          {data.topSeries?.map((s:any,i:number)=>(
            <div key={i} className="mb-2">
              <p className="text-sm">{i+1}. {s.titulo}</p>
              <div className="h-2 bg-[#2a2c50] rounded">
                <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded" style={{width: `${(s.total / (data.topSeries[0]?.total||1))*100}%`}}></div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#1a1c36] p-4 rounded-xl">
          <p className="font-bold mb-3">🎭 Gêneros mais vistos - BASE REAL</p>
          {data.generosMaisVistos?.length === 0? (
            <p className="text-sm opacity-60">Sem dados ainda</p>
          ) : (
            data.generosMaisVistos.map((g:any,i:number)=>(
              <div key={i} className="flex justify-between text-sm py-1 border-b border-white/5">
                <span>{g.genero}</span>
                <span className="font-bold">{g.total}x</span>
              </div>
            ))
          )}
          <p className="text- opacity-40 mt-4">Hoje: 17 users • {data.totalWatchlist} watchlists • {data.totalSeries} títulos</p>
        </div>
      </div>
    </div>
  )
}
