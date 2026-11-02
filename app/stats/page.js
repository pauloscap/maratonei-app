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
    const [
      { data: seriesRows, error: seriesError },
      { data: checkins, error: checkinsError }
    ] = await Promise.all([
      supabase
        .from('user_series')
        .select('serie_id, status, eps_vistos')
        .eq('user_id', user.id),
      supabase
        .from('checkins')
        .select('data')
        .eq('user_id', user.id)
        .order('data', { ascending: false })
    ])

    if (seriesError) {
      console.error('Erro ao carregar séries do usuário:', seriesError)
      setLoading(false)
      return
    }

    if (checkinsError) {
      console.warn('Não foi possível calcular a sequência de check-ins:', checkinsError)
    }

    const rows = seriesRows || []
    const totalEps = rows.reduce((total, row) => {
      return total + (Array.isArray(row.eps_vistos) ? row.eps_vistos.length : 0)
    }, 0)
    const seriesComProgresso = rows.filter(row => row.status === 'assistindo' || row.status === 'maratonei' || (Array.isArray(row.eps_vistos) && row.eps_vistos.length > 0))
    const seriesUnicas = [...new Set(seriesComProgresso.map(row => row.serie_id))]
    const concluidas = rows.filter(row => row.status === 'maratonei').length
    const emAndamento = rows.filter(row => row.status === 'assistindo').length
    const tempoTotal = totalEps * 45

    // A sequência é baseada nos check-ins privados do próprio usuário,
    // não em user_episodios, que o fluxo atual do app não grava.
    const dateKeys = [...new Set((checkins || []).map(row => row.data).filter(Boolean))]
      .sort((a, b) => b.localeCompare(a))

    const utcDay = value => {
      const [year, month, day] = String(value).slice(0, 10).split('-').map(Number)
      return Date.UTC(year, month - 1, day)
    }

    const now = new Date()
    const todayKey = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ].join('-')
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
    const yesterdayKey = [
      yesterday.getFullYear(),
      String(yesterday.getMonth() + 1).padStart(2, '0'),
      String(yesterday.getDate()).padStart(2, '0')
    ].join('-')

    let sequencia = 0
    if (dateKeys.length && (dateKeys[0] === todayKey || dateKeys[0] === yesterdayKey)) {
      sequencia = 1
      for (let i = 1; i < dateKeys.length; i++) {
        const diff = (utcDay(dateKeys[i - 1]) - utcDay(dateKeys[i])) / 86400000
        if (diff === 1) sequencia++
        else break
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
          {stats.sequencia > 0? 'Continue marcando todo dia!' : 'Faça um check-in para começar'}
        </p>
      </div>
    </main>
  )
}
