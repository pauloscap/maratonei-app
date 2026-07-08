'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

export default function Stats() {
  const [stats, setStats] = useState({
    totalEps: 0,
    totalSeries: 0,
    seriesCompletas: 0,
    tempoTotal: 0,
    sequencia: 0,
    epsUltimos7Dias: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    calcularStats()
  }, [])

  async function calcularStats() {
    // 1. Total de episódios assistidos
    const { data: eps } = await supabase
    .from('user_episodios')
    .select('serie_id, created_at')
    .order('created_at', { ascending: false })

    const totalEps = eps?.length || 0

    // 2. Quantas séries diferentes você começou
    const seriesUnicas = [...new Set(eps?.map(e => e.serie_id) || [])]
    const totalSeries = seriesUnicas.length

    // 3. Quantas séries completou 100%
    let seriesCompletas = 0
    for (const serieId of seriesUnicas) {
      const { data: temps } = await supabase
      .from('temporadas')
      .select('episodios')
      .eq('serie_id', serieId)

      const totalEpsSerie = temps?.reduce((acc, t) => acc + t.episodios, 0) || 0
      const assistidos = eps?.filter(e => e.serie_id === serieId).length || 0

      if (totalEpsSerie > 0 && assistidos >= totalEpsSerie) {
        seriesCompletas++
      }
    }

    // 4. Tempo total - média de 45min por episódio
    const tempoTotal = Math.round(totalEps * 45 / 60) // em horas

    // 5. Sequência de dias assistindo
    let sequencia = 0
    if (eps && eps.length > 0) {
      const datasUnicas = [...new Set(eps.map(e =>
        new Date(e.created_at).toDateString()
      ))].sort((a, b) => new Date(b) - new Date(a))

      const hoje = new Date().toDateString()
      const ontem = new Date(Date.now() - 86400000).toDateString()

      if (datasUnicas[0] === hoje || datasUnicas[0] === ontem) {
        sequencia = 1
        for (let i = 1; i < datasUnicas.length; i++) {
          const diff = (new Date(datasUnicas[i-1]) - new Date(datasUnicas[i])) / 86400000
          if (diff === 1) {
            sequencia++
          } else {
            break
          }
        }
      }
    }

    // 6. Eps nos últimos 7 dias
    const seteDiasAtras = new Date(Date.now() - 7 * 86400000)
    const epsUltimos7Dias = eps?.filter(e =>
      new Date(e.created_at) >= seteDiasAtras
    ).length || 0

    setStats({
      totalEps,
      totalSeries,
      seriesCompletas,
      tempoTotal,
      sequencia,
      epsUltimos7Dias
    })
    setLoading(false)
  }

  if (loading) return <main className="main"><div className="card">Calculando...</div></main>

  const StatCard = ({ titulo, valor, emoji, cor = '#FACC15' }) => (
    <div className="card" style={{marginBottom: '12px'}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div>
          <p style={{color: '#94A3B8', fontSize: '14px', marginBottom: '4px'}}>{titulo}</p>
          <p style={{color: cor, fontSize: '28px', fontWeight: 'bold'}}>{valor}</p>
        </div>
        <span style={{fontSize: '40px'}}>{emoji}</span>
      </div>
    </div>
  )

  return (
    <main className="main">
      <Link href="/" style={{color: '#FACC15', textDecoration: 'none', marginBottom: '16px', display: 'block'}}>
        ← Voltar
      </Link>

      <h1 style={{color: '#FACC15', marginBottom: '24px', fontSize: '28px'}}>Suas Estatísticas</h1>

      <StatCard
        titulo="Episódios Assistidos"
        valor={stats.totalEps}
        emoji="📺"
      />

      <StatCard
        titulo="Tempo Total"
        valor={`${stats.tempoTotal}h`}
        emoji="⏱️"
        cor="#60A5FA"
      />

      <StatCard
        titulo="Séries Iniciadas"
        valor={stats.totalSeries}
        emoji="🎬"
        cor="#34D399"
      />

      <StatCard
        titulo="Séries Concluídas"
        valor={stats.seriesCompletas}
        emoji="🏆"
        cor="#F59E0B"
      />

      <StatCard
        titulo="Sequência Atual"
        valor={`${stats.sequencia} ${stats.sequencia === 1? 'dia' : 'dias'}`}
        emoji="🔥"
        cor="#EF4444"
      />

      <StatCard
        titulo="Últimos 7 dias"
        valor={`${stats.epsUltimos7Dias} episódios`}
        emoji="📈"
        cor="#A78BFA"
      />

      {stats.totalEps === 0 && (
        <div className="card" style={{textAlign: 'center', color: '#64748B', marginTop: '20px'}}>
          Comece a marcar episódios pra ver suas stats!
        </div>
      )}
    </main>
  )
}
