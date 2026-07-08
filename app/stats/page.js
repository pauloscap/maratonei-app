'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

export default function Stats() {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    totalEps: 0,
    totalSeries: 0,
    concluidas: 0,
    emAndamento: 0,
    tempoTotal: 0,
    sequencia: 0
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) calcularStats()
  }, [user])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
    } else {
      setUser(session.user)
    }
  }

  async function calcularStats() {
    const { data: eps } = await supabase
 .from('user_episodios')
 .select('serie_id, created_at')

    const totalEps = eps?.length || 0
    const seriesUnicas = [...new Set(eps?.map(e => e.serie_id) || [])]

    const { data: temporadas } = await supabase.from('temporadas').select('serie_id, episodios')

    let concluidas = 0
    let emAndamento = 0

    for (const serieId of seriesUnicas) {
      const epsSerie = eps.filter(e => e.serie_id === serieId).length
      const totalEpsSerie = temporadas
   .filter(t => t.serie_id === serieId)
   .reduce((acc, t) => acc + t.episodios, 0)

      if (epsSerie >= totalEpsSerie && totalEpsSerie > 0) {
        concluidas++
      } else if (epsSerie > 0) {
        emAndamento++
      }
    }

    const tempoTotal = totalEps * 45

    let sequencia = 0
    if (eps && eps.length > 0) {
      const datas = eps.map(e => new Date(e.created_at).toDateString())
      const datasUnicas = [...new Set(datas)].sort((a, b) => new Date(b) - new Date(a))

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

    setStats({
      totalEps,
      totalSeries: seriesUnicas.length,
      concluidas,
      emAndamento,
      tempoTotal,
      sequencia
    })
    setLoading(false)
  }

  if (!user) return <main className="main"><div className="card">Redirecionando...</div></main>
  if (loading) return <main className="main"><div className="card">Carregando...</div></main>

  const horas = Math.floor(stats.tempoTotal / 60)
  const minutos = stats.tempoTotal % 60

  const CardStat = ({ valor, label, emoji }) => (
    <div className="card" style={{textAlign: 'center', padding: '20px'}}>
      <div style={{fontSize: '32px', marginBottom: '8px'}}>{emoji}</div>
      <div style={{fontSize: '28px', fontWeight: 'bold', color: '#FACC15', marginBottom: '4px'}}>
        {valor}
      </div>
      <div style={{fontSize: '14px', color: '#94A3B8'}}>{label}</div>
    </div>
  )

  return (
    <main className="main">
      <Link href="/" style={{color: '#FACC15', textDecoration: 'none', marginBottom: '16px', display: 'block'}}>
        ← Voltar
      </Link>

      <h1 style={{color: '#FACC15', marginBottom: '24px', fontSize: '28px'}}>Suas Estatísticas</h1>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px'}}>
        <CardStat valor={stats.totalEps} label="Episódios" emoji="📺" />
        <CardStat valor={stats.totalSeries} label="Séries" emoji="🎬" />
        <CardStat valor={stats.concluidas} label="Concluídas" emoji="✅" />
        <CardStat valor={stats.emAndamento} label="Em andamento" emoji="⏳" />
      </div>

      <div className="card" style={{marginBottom: '16px'}}>
        <h3 style={{color: '#FACC15', marginBottom: '12px', fontSize: '16px'}}>⏱️ Tempo Total</h3>
        <div style={{fontSize: '32px', fontWeight: 'bold', color: '#fff'}}>
          {horas}h {minutos}min
        </div>
        <p style={{color: '#64748B', fontSize: '12px', marginTop: '8px'}}>
          Baseado em 45min por episódio
        </p>
      </div>

      <div className="card">
        <h3 style={{color: '#FACC15', marginBottom: '12px', fontSize: '16px'}}>🔥 Sequência Atual</h3>
        <div style={{fontSize: '32px', fontWeight: 'bold', color: '#fff'}}>
          {stats.sequencia} {stats.sequencia === 1? 'dia' : 'dias'}
        </div>
        <p style={{color: '#64748B', fontSize: '12px', marginTop: '8px'}}>
          {stats.sequencia > 0? 'Continue marcando todo dia!' : 'Marque um episódio pra começar'}
        </p>
      </div>
    </main>
  )
}
