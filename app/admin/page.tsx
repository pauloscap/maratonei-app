"use client"
import { useEffect, useState } from "react"

type Stat = {
  totalUsuarios: number
  totalWatchlist: number
  mediaPorUsuario: string
  topSeries: { titulo: string; count: number }[]
  topGeneros: { genero: string; count: number }[]
}

export default function AdminPage(){
  const [users,setUsers]=useState<any[]>([])
  const [stats,setStats]=useState<Stat | null>(null)

  const load = async ()=>{
    try{
      const [uRes, sRes] = await Promise.all([
        fetch("/api/admin/users").then(r=>r.json()),
        fetch("/api/admin/analytics").then(r=>r.json())
      ])
      setUsers(Array.isArray(uRes) ? uRes : [])
      setStats(sRes)
    }catch{}
  }

  useEffect(()=>{ load() },[])

  const totalGeneros = stats?.topGeneros?.reduce((a,b)=>a+b.count,0) || 0

  return (
    <div className="min-h-screen bg-[#0a0f1f] text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Maratonei Admin</h1>
            <p className="text-sm text-white/50 mt-1">maratoneiapp.vercel.app • base real do Supabase</p>
          </div>
          <button onClick={load} className="text-xs bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 rounded-full transition">Atualizar</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-[#16213e] border border-white/10 rounded-2xl p-4">
            <div className="text-[11px] uppercase tracking-widest text-white/40">Usuários</div>
            <div className="text-3xl font-bold mt-1">{stats?.totalUsuarios ?? users.length ?? 0}</div>
            <div className="text-[11px] text-emerald-400 mt-1">● online</div>
          </div>
          <div className="bg-[#16213e] border border-white/10 rounded-2xl p-4">
            <div className="text-[11px] uppercase tracking-widest text-white/40">Watchlist</div>
            <div className="text-3xl font-bold mt-1">{stats?.totalWatchlist ?? 0}</div>
            <div className="text-[11px] text-white/40 mt-1">total salvo</div>
          </div>
          <div className="bg-[#16213e] border border-white/10 rounded-2xl p-4">
            <div className="text-[11px] uppercase tracking-widest text-white/40">Média / user</div>
            <div className="text-3xl font-bold mt-1">{stats?.mediaPorUsuario ?? "0"}</div>
            <div className="text-[11px] text-white/40 mt-1">filmes por pessoa</div>
          </div>
          <div className="bg-[#16213e] border border-white/10 rounded-2xl p-4">
            <div className="text-[11px] uppercase tracking-widest text-white/40">Top 1 agora</div>
            <div className="text-sm font-bold mt-2 truncate">{stats?.topSeries?.[0]?.titulo || "—"}</div>
            <div className="text-[11px] text-white/40 mt-1">{stats?.topSeries?.[0]?.count || 0} saves</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 bg-[#16213e] border border-white/10 rounded-2xl p-5">
            <h3 className="font-bold text-sm mb-4">📈 Filmes / Séries mais salvos</h3>
            <div className="space-y-3">
              {(stats?.topSeries || []).map((s,i)=>{
                const max = stats?.topSeries?.[0]?.count || 1
                const pct = Math.round((s.count / max) * 100)
                return (
                  <div key={i} className="group">
                    <div className="flex justify-between text-[13px] mb-1.5">
                      <span className="truncate pr-3 font-medium">{i+1}. {s.titulo}</span>
                      <span className="font-bold text-white/80">{s.count}</span>
                    </div>
                    <div className="h-2.5 bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-700" style={{width: `${pct}%`}} />
                    </div>
                  </div>
                )
              })}
              {!stats?.topSeries?.length && <p className="text-sm text-white/40 py-6 text-center">Sem dados ainda</p>}
            </div>
          </div>

          <div className="bg-[#16213e] border border-white/10 rounded-2xl p-5">
            <h3 className="font-bold text-sm mb-4">🎭 Gêneros mais vistos</h3>
            {totalGeneros > 0 ? (
              <>
                <div className="flex justify-center mb-5">
                  <div className="w-28 h-28 rounded-full" style={{
                    background: `conic-gradient(${stats!.topGeneros.map((g,i)=>`hsl(${260+i*32} 85% 65%) ${stats!.topGeneros.slice(0,i).reduce((a,c)=>a+c.count,0)/totalGeneros*100}% ${(stats!.topGeneros.slice(0,i+1).reduce((a,c)=>a+c.count,0)/totalGeneros*100)}%`).join(', ')})`
                  }}>
                    <div className="w-[72%] h-[72%] bg-[#16213e] rounded-full m-[14%] flex items-center justify-center text-xs font-bold">{totalGeneros}</div>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {stats!.topGeneros.map((g,i)=>{
                    const pct = Math.round((g.count/totalGeneros)*100)
                    return (
                      <div key={i} className="flex items-center justify-between text-[13px] border-b border-white/5 py-2 last:border-0">
                        <div className="flex items-center gap-2.5"><span className="w-2.5 h-2.5 rounded-full" style={{background:`hsl(${260+i*32} 85% 65%)`}} />{g.genero}</div>
                        <span className="font-bold">{g.count} <span className="font-normal text-white/40">({pct}%)</span></span>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">🍿</div>
                <p className="text-[13px] text-white/60 leading-relaxed">Ainda sem gêneros.<br/>Seu registro da Elle foi salvo com código antigo.<br/>Salve um título novo com o <b>salvar-titulo</b> novo que já preenche.</p>
                <div className="mt-4 text-[11px] text-white/30">Hoje: 16 users • 2 watchlists (ID 3 e Elle)</div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#16213e] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm">👥 Usuários ({users.length}) — Base real do Supabase</h3>
            <span className="text-[11px] text-white/40">profiles • criado_em</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {users.map((u:any)=>(
              <div key={u.id} className="flex items-center gap-3 bg-black/20 border border-white/5 rounded-xl p-3 hover:bg-black/30 transition">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.nome || 'U'}`} alt={u.nome} className="w-10 h-10 rounded-full bg-white object-cover shrink-0" />
                <div className="min-w-0">
                  <div className="text-[13px] font-bold truncate">{u.nome || "Sem nome"}</div>
                  <div className="text-[11px] text-white/40">{u.criado_em ? new Date(u.criado_em).toLocaleDateString("pt-BR") : ""}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
