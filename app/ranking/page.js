'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

export default function Ranking() {
  const [user, setUser] = useState(null)
  const [rankingTempo, setRankingTempo] = useState([])
  const [rankingSequencia, setRankingSequencia] = useState([])
  const [rankingEps, setRankingEps] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) buscarRanking()
  }, [user])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
    } else {
      setUser(session.user)
    }
  }

  async function buscarRanking() {
    // Busca todos os perfis
    const { data: perfis } = await supabase.from('profiles').select('*')

    const statsUsuarios = []

    for (const perfil of perfis || []) {
      // Busca episódios do usuário
      const { data: episodios } = await supabase
      .from('user_episodios')
      .select('created_at')
      .eq('user_id', perfil.id)

      const totalEps = episodios?.length || 0
      const tempoTotal = totalEps * 40 // 40min por ep médio

      // Calcula sequência
      let sequencia = 0
      if (episodios && episodios.length > 0) {
        const datas = [...new Set(episodios.map(e =>
          new Date(e.created_at).toDateString()
        ))].sort((a, b) => new Date(b) - new Date(a))

        let seqAtual = 1
        for (let i = 1; i < datas.length; i++) {
          const diff = (new Date(datas[i-1]) - new Date(datas[i])) / (1000 * 60 * 60 * 24)
          if (diff === 1) {
            seqAtual++
          } else {
            break
          }
        }
        sequencia = seqAtual
      }

      statsUsuarios.push({
      ...perfil,
        totalEps,
        tempoTotal,
        sequencia
      })
    }

    // Ordena os rankings
    setRankingTempo([...statsUsuarios].sort((a, b) => b.tempoTotal - a.tempoTotal).slice(0, 10))
    setRankingSequencia([...statsUsuarios].sort((a, b) => b.sequencia - a.sequencia).slice(0, 10))
    setRankingEps([...statsUsuarios].sort((a, b) => b.totalEps - a.totalEps).slice(0, 10))
    setLoading(false)
  }

  function formatarTempo(minutos) {
    const horas = Math.floor(minutos / 60)
    return horas >= 1? `${horas}h` : `${minutos}min`
  }

  if (!user) return <main className="main"><div className="card">Redirecionando...</div></main>
  if (loading) return <main className="main"><div className="card">Carregando ranking...</div></main>

  const CardRanking = ({ titulo, dados, valor, emoji }) => (
    <div className="card" style={{marginBottom: '24px'}}>
      <h3 style={{color: '#FACC15', marginBottom: '16px', fontSize: '18px'}}>{emoji} {titulo}</h3>
      {dados.map((usuario, index) => (
        <Link
          key={usuario.id}
          href={`/perfil/${usuario.id}`}
          style={{textDecoration: 'none'}}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            background: usuario.id === user.id? '#1E293B' : 'transparent',
            borderRadius: '8px',
            marginBottom: '8px',
            border: usuario.id === user.id? '1px solid #FACC15' : '1px solid #334155'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: index === 0? '#FACC15' : index === 1? '#94A3B8' : index === 2? '#CD7F32' : '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: index < 3? '#000' : '#fff',
              fontSize: '14px'
            }}>
              {index + 1}
            </div>
            <img
              src={usuario.avatar_url || 'https://via.placeholder.com/40'}
              alt={usuario.nome}
              style={{width: '40px', height: '40px', borderRadius: '50%'}}
            />
            <div style={{flex: 1}}>
              <p style={{color: '#fff', fontWeight: 'bold', fontSize: '14px'}}>
                {usuario.nome || 'Anônimo'} {usuario.id === user.id && '(Você)'}
              </p>
              <p style={{color: '#94A3B8', fontSize: '12px'}}>@{usuario.username || 'usuario'}</p>
            </div>
            <div style={{color: '#FACC15', fontWeight: 'bold', fontSize: '16px'}}>
              {valor(usuario)}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )

  return (
    <main className="main">
      <Link href="/" style={{color: '#FACC15', textDecoration: 'none', marginBottom: '16px', display: 'block'}}>
        ← Voltar
      </Link>

      <h1 style={{color: '#FACC15', marginBottom: '24px', fontSize: '28px'}}>🏆 Ranking</h1>

      <CardRanking
        titulo="Tempo Total Assistido"
        dados={rankingTempo}
        valor={(u) => formatarTempo(u.tempoTotal)}
        emoji="⏱️"
      />

      <CardRanking
        titulo="Maior Sequência"
        dados={rankingSequencia}
        valor={(u) => `${u.sequencia} dias`}
        emoji="🔥"
      />

      <CardRanking
        titulo="Mais Episódios"
        dados={rankingEps}
        valor={(u) => `${u.totalEps} eps`}
        emoji="✅"
      />
    </main>
  )
}
