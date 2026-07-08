'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

export default function Perfil() {
  const params = useParams()
  const [perfil, setPerfil] = useState(null)
  const [stats, setStats] = useState(null)
  const [seriesRecentes, setSeriesRecentes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    buscarPerfil()
  }, [params.id])

  async function buscarPerfil() {
    const { data: perfilData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single()

    if (perfilData) {
      setPerfil(perfilData)

      // Busca stats do usuário
      const { data: episodios } = await supabase
      .from('user_episodios')
      .select('serie_id, created_at')
      .eq('user_id', params.id)

      const totalEps = episodios?.length || 0
      const tempoTotal = totalEps * 40

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

      // Busca séries únicas assistidas
      const seriesIds = [...new Set(episodios?.map(e => e.serie_id) || [])]
      const { data: series } = await supabase
      .from('series')
      .select('id, titulo, poster')
      .in('id', seriesIds)
      .limit(6)

      setStats({
        totalEps,
        tempoTotal,
        sequencia,
        totalSeries: seriesIds.length
      })
      setSeriesRecentes(series || [])
    }
    setLoading(false)
  }

  function formatarTempo(minutos) {
    const horas = Math.floor(minutos / 60)
    const dias = Math.floor(horas / 24)
    if (dias >= 1) return `${dias}d ${horas % 24}h`
    return horas >= 1? `${horas}h ${minutos % 60}min` : `${minutos}min`
  }

  if (loading) return <main className="main"><div className="card">Carregando...</div></main>
  if (!perfil) return <main className="main"><div className="card">Perfil não encontrado</div></main>

  return (
    <main className="main">
      <Link href="/ranking" style={{color: '#FACC15', textDecoration: 'none', marginBottom: '16px', display: 'block'}}>
        ← Voltar pro Ranking
      </Link>

      <div className="card" style={{marginBottom: '24px', textAlign: 'center'}}>
        <img
          src={perfil.avatar_url || 'https://via.placeholder.com/120'}
          alt={perfil.nome}
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            margin: '0 auto 16px',
            border: '3px solid #FACC15'
          }}
        />
        <h1 style={{color: '#FACC15', marginBottom: '4px', fontSize: '24px'}}>
          {perfil.nome || 'Anônimo'}
        </h1>
        <p style={{color: '#94A3B8', fontSize: '14px', marginBottom: '16px'}}>
          @{perfil.username || 'usuario'}
        </p>
        {perfil.bio && (
          <p style={{color: '#94A3B8', fontSize: '14px', lineHeight: '1.6'}}>
            {perfil.bio}
          </p>
        )}
      </div>

      <div className="card" style={{marginBottom: '24px'}}>
        <h3 style={{color: '#FACC15', marginBottom: '16px', fontSize: '18px'}}>📊 Estatísticas</h3>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px'}}>
          <div style={{textAlign: 'center'}}>
            <p style={{color: '#FACC15', fontSize: '32px', fontWeight: 'bold', marginBottom: '4px'}}>
              {stats?.totalEps || 0}
            </p>
            <p style={{color: '#94A3B8', fontSize: '12px'}}>Episódios</p>
          </div>
          <div style={{textAlign: 'center'}}>
            <p style={{color: '#FACC15', fontSize: '32px', fontWeight: 'bold', marginBottom: '4px'}}>
              {stats?.totalSeries || 0}
            </p>
            <p style={{color: '#94A3B8', fontSize: '12px'}}>Séries</p>
          </div>
          <div style={{textAlign: 'center'}}>
            <p style={{color: '#FACC15', fontSize: '24px', fontWeight: 'bold', marginBottom: '4px'}}>
              {formatarTempo(stats?.tempoTotal || 0)}
            </p>
            <p style={{color: '#94A3B8', fontSize: '12px'}}>Tempo Total</p>
          </div>
          <div style={{textAlign: 'center'}}>
            <p style={{color: '#FACC15', fontSize: '32px', fontWeight: 'bold', marginBottom: '4px'}}>
              {stats?.sequencia || 0}
            </p>
            <p style={{color: '#94A3B8', fontSize: '12px'}}>Dias Seguidos</p>
          </div>
        </div>
      </div>

      {seriesRecentes.length > 0 && (
        <div className="card">
          <h3 style={{color: '#FACC15', marginBottom: '16px', fontSize: '18px'}}>🎬 Séries Assistidas</h3>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px'}}>
            {seriesRecentes.map(serie => (
              <img
                key={serie.id}
                src={`https://image.tmdb.org/t/p/w200${serie.poster}`}
                alt={serie.titulo}
                style={{
                  width: '100%',
                  aspectRatio: '2/3',
                  objectFit: 'cover',
                  borderRadius: '6px'
                }}
              />
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
