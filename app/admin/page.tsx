"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

type Profile = {
  id: string
  email: string
  avatar_url: string | null
  full_name: string | null
  created_at: string
}

export default function AdminPage() {
  const [total, setTotal] = useState<number | null>(null)
  const [today, setToday] = useState(0)
  const [week, setWeek] = useState(0)
  const [recent, setRecent] = useState<Profile[]>([])
  const [growth, setGrowth] = useState<{ date: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchData() {
    setLoading(true)

    // Total - conta direto da tabela profiles
    const { count, error } = await supabase
     .from("profiles")
     .select("*", { count: 'exact', head: true })

    if (!error) setTotal(count?? 0)

    // Últimos 50 para calcular métricas
    const { data: users } = await supabase
     .from("profiles")
     .select("*")
     .order("created_at", { ascending: false })
     .limit(50)

    if (users) {
      setRecent(users.slice(0, 10))

      const now = new Date()
      const todayStr = now.toISOString().split("T")[0]

      const todayCount = users.filter(u =>
        u.created_at.startsWith(todayStr)
      ).length

      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weekCount = users.filter(u =>
        new Date(u.created_at) >= weekAgo
      ).length

      setToday(todayCount)
      setWeek(weekCount)

      // Gráfico 30 dias
      const map: Record<string, number> = {}
      for (let i = 29; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const key = d.toISOString().split("T")[0]
        map[key] = 0
      }
      users.forEach(u => {
        const key = u.created_at.split("T")[0]
        if (map[key]!== undefined) map[key]++
      })
      setGrowth(Object.entries(map).map(([date, count]) => ({ date, count })))
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F2A] text-white flex items-center justify-center">
        <div className="text-white/40 text-sm">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0F2A] text-white">
      <header className="border-b border-white/[0.06] px-8 h- flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#3B82F6] rounded- flex items-center justify-center">🍿</div>
          <span className="font-semibold tracking-tight">maratonei <span className="text-white/40 font-normal">admin</span></span>
        </div>
        <button onClick={fetchData} className="text-xs px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition">↻ Atualizar</button>
      </header>

      <main className="p-8 max-w- mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Stat label="Total Usuários" value={total?? "—"} accent />
          <Stat label="Novos hoje" value={today} />
          <Stat label="Novos essa semana" value={week} />
          <Stat label="Último cadastro" value={recent[0]? new Date(recent[0].created_at).toLocaleDateString("pt-BR") : "—"} />
        </div>

        <div className="rounded- bg-white/[0.03] border border-white/[0.06] p-6 mb-8">
          <h3 className="text-sm font-medium mb-6">Crescimento · 30 dias</h3>
          <div className="flex items-end gap- h-">
            {growth.map((g, i) => (
              <div key={i} className="flex-1 bg-[#FFD400] rounded- transition-all" style={{ height: `${Math.max(8, g.count * 18 + 8)}%`, opacity: 0.3 + (i / growth.length) * 0.7 }} />
            ))}
          </div>
        </div>

        <div className="rounded- bg-white/[0.03] border border-white/[0.06] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-medium">Últimos usuários</h3>
            <span className="text- text-white/40">{recent.length} registros</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {recent.map(u => (
              <div key={u.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <img src={u.avatar_url || `https://i.pravatar.cc/100?u=${u.id}`} className="w-8 h-8 rounded-full bg-white/10" alt="" />
                  <div>
                    <div className="text-">{u.full_name || u.email.split("@")[0]}</div>
                    <div className="text- text-white/40">{u.email}</div>
                  </div>
                </div>
                <div className="text- text-white/30">{new Date(u.created_at).toLocaleDateString("pt-BR")}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: any; accent?: boolean }) {
  return (
    <div className="rounded- bg-white/[0.03] border border-white/[0.06] p-5">
      <div className="text- uppercase tracking-widest text-white/40 mb-3">{label}</div>
      <div className={`text- font-semibold tracking-tight leading-none ${accent? "text-[#FFD400]" : ""}`}>{value}</div>
    </div>
  )
}
