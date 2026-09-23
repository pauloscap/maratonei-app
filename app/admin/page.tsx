"use client"
import { useEffect, useState } from "react"

type Analytics = {
  generosMaisVistos: { genero: string; total: number }[]
  topSeries: { titulo: string; total: number }[]
  totalSeries: number
  totalWatchlist: number
}

export default function AdminPage() {
  const [data, setData] = useState<Analytics | null>(null)

  useEffect(() => {
    fetch("/api/admin/analytics")
     .then(r => r.json())
     .then(setData)
  }, [])

  if (!data) {
    return <div className="min-h-screen bg-[#0e0f23] flex items-center justify-center text-white">Carregando base real...</div>
  }

  const media = (data.totalWatchlist / 17).toFixed(1)
  const top = data.topSeries?.[0]

  return (
    <div className="min-h-screen bg-[#0e0f23] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <h1 className="text-3xl font-black tracking-tight">Maratonei Admin</h1>
        <p className="text-white/50 text-sm mt-1 mb-6">maratoneiapp.vercel.app • base real do Supabase • 17 usuários • {data.totalSeries} títulos</p>

        {/* CARDS TOP */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-2xl bg-[#1a1c36] border border-white/5 p-5">
            <p className="text- tracking-widest text-white/40 font-bold">USUÁRIOS</p>
            <p className="text-4xl font-black mt-2">17</p>
            <p className="text- mt-2 flex items-center gap-1.5 text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-400 inline-block"></span> online</p>
          </div>
          <div className="rounded-2xl bg-[#1a1c36] border border-white/5 p-5">
            <p className="text- tracking-widest text-white/40 font-bold">WATCHLIST</p>
            <p className="text-4xl font-black mt-2">{data.totalWatchlist}</p>
            <p className="text- mt-2 text-white/40">total salvo</p>
          </div>
          <div className="rounded-2xl bg-[#1a1c36] border border-white/5 p-5">
            <p className="text- tracking-widest text-white/40 font-bold">MÉDIA / USER</p>
            <p className="text-4xl font-black mt-2">{media}</p>
            <p className="text- mt-2 text-white/40">filmes por pessoa</p>
          </div>
          <div className="rounded-2xl bg-[#1a1c36] border border-white/5 p-5">
            <p className="text- tracking-widest text-white/40 font-bold">TOP 1 AGORA</p>
            <p className="text-sm font-bold mt-2 line-clamp-2">{top?.titulo || '—'}</p>
            <p className="text- mt-2 text-white/40">{top?.total || 0} saves</p>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 rounded-2xl bg-[#1a1c36] border border-white/5 p-5">
            <p className="font-bold flex items-center gap-2 mb-4">📺 Filmes / Séries mais salvos</p>
            <div className="space-y-3">
              {data.topSeries?.length? data.topSeries.map((s,i)=>(
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{i+1}. {s.titulo}</span>
                    <span className="text-white/40">{s.total} saves</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5">
                    <div className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{width: `${(s.total / (top?.total || 1)) * 100}%`}} />
                  </div>
                </div>
              )) : <p className="text-sm text-white/40">Nenhum save ainda</p>}
            </div>
          </div>

          <div className="rounded-2xl bg-[#1a1c36] border border-white/5 p-5">
            <p className="font-bold flex items-center gap-2 mb-4">🎭 Gêneros mais vistos</p>
            <div className="space-y-2">
              {data.generosMaisVistos?.length? data.generosMaisVistos.map((g,i)=>(
                <div key={i} className="flex justify-between text-sm py-1.5 border-b border-white/[0.05] last:border-0">
                  <span className="text-white/80">{g.genero}</span>
                  <span className="font-bold">{g.total}x</span>
                </div>
              )) : <p className="text-sm text-white/40">Ainda sem gêneros</p>}
            </div>
            <p className="text- text-white/20 mt-6">BASE REAL • Hoje: 17 users • {data.totalWatchlist} watchlists • {data.totalSeries} títulos • paulor.garcia7@gmail.com incluído</p>
          </div>
        </div>
      </div>
    </div>
  )
}
