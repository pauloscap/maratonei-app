'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

export default function Serie() {
  const { id } = useParams()
  const [serie, setSerie] = useState(null)
  const [temporadas, setTemporadas] = useState([])
  const [assistidos, setAssistidos] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) buscarDados()
  }, [user])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user || null)
  }

  async function buscarDados() {
    const { data: serieData } = await supabase.from('series').select('*').eq('id', id).single()
    setSerie(serieData)

    const { data: temps } = await supabase.from('temporadas').select('*').eq('serie_id', id).order('numero')
    setTemporadas(temps || [])

    const { data: eps } = await supabase.from('user_episodios').select('temporada, episodio').eq('serie_id', id)
    if (eps) {
      setAssistidos(new Set(eps.map(e => `${e.temporada}-${e.episodio}`)))
    }

    setLoading(false)
  }

  async function toggleEpisodio(tempNum, epNum) {
    const key = `${tempNum}-${epNum}`
    const novo = new Set(assistidos)

    if (assistidos.has(key)) {
      novo.delete(key)
      await supabase.from('user_episodios').delete().match({
        user_id: user.id,
        serie_id: id,
        temporada: tempNum,
        episodio: epNum
      })
    } else {
      novo.add(key)
      await supabase.from('user_episodios').insert({
        user_id: user.id,
        serie_id: id,
        temporada: tempNum,
        episodio: epNum
      })
    }

    setAssistidos(novo)
  }

  async function toggleTemporada(tempNum, totalEps) {
    const todosKeys = Array.from({length: totalEps}, (_, i) => `${tempNum}-${i + 1}`)
    const todosAssistidos = todosKeys.every(k => assistidos.has(k))
    const novo = new Set(assistidos)

    if (todosAssistidos) {
      todosKeys.forEach(k => novo.delete(k))
      await supabase.from('user_episodios').delete().match({
        user_id: user.id,
        serie_id: id,
        temporada: tempNum
      })
    } else {
      todosKeys.forEach(k => novo.add(k))
      const inserts = todosKeys.filter(k =>!assistidos.has(k)).map(k => {
        const [, ep] = k.split('-')
        return {
          user_id: user.id,
          serie_id: id,
          temporada: tempNum,
          episodio: parseInt(ep)
        }
      })
      if (inserts.length > 0) {
        await supabase.from('user_episodios').insert(inserts)
      }
    }

    setAssistidos(novo)
  }

  if (loading) return <main className="main"><div className="card">Carregando...</div></main>
  if (!user) return <main className="main"><div className="card">Faça login...</div></main>
  if (!serie) return <main className="main"><div className="card">Série não encontrada</div></main>

  const totalEps = temporadas.reduce((acc, t) => acc + t.episodios, 0)
  const percentual = totalEps > 0? Math.round((assistidos.size / totalEps) * 100) : 0

  return (
    <main className="main">
      <Link href="/" style={{color: '#FACC15', textDecoration: 'none', marginBottom: '16px', display: 'block'}}>
        ← Voltar
      </Link>

      <img
        src={`https://image.tmdb.org/t/p/w500${serie.poster}`}
        alt={serie.titulo}
        style={{width: '100%', borderRadius: '12px', marginBottom: '16px'}}
      />

      <h1 style={{color: '#FACC15', fontSize: '24px', marginBottom: '8px'}}>{serie.titulo}</h1>
      <div style={{color: '#94A3B8', marginBottom: '16px'}}>
        <span>⭐ {serie.nota?.toFixed(1)}</span>
        <span style={{margin: '0 8px'}}>•</span>
        <span>{serie.ano}</span>
        <span style={{margin: '0 8px'}}>•</span>
        <span>{serie.generos}</span>
      </div>

      <div className="card" style={{marginBottom: '24px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
          <span style={{color: '#94A3B8'}}>Progresso</span>
          <span style={{color: '#FACC15', fontWeight: 'bold'}}>{percentual}%</span>
        </div>
        <div style={{width: '100%', height: '8px', background: '#1E293B', borderRadius: '4px', overflow: 'hidden'}}>
          <div style={{
            width: `${percentual}%`,
            height: '100%',
            background: '#FACC15',
            transition: 'width 0.3s'
          }} />
        </div>
        <p style={{color: '#64748B', fontSize: '14px', marginTop: '8px', margin: 0}}>
          {assistidos.size} de {totalEps} episódios
        </p>
      </div>

      {temporadas.map(temp => {
        const epsTemp = Array.from({length: temp.episodios}, (_, i) => i + 1)
        const todosAssistidos = epsTemp.every(ep => assistidos.has(`${temp.numero}-${ep}`))

        return (
          <div key={temp.id} className="card" style={{marginBottom: '16px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
              <h2 style={{color: '#FACC15', fontSize: '18px', margin: 0}}>
                Temporada {temp.numero}
              </h2>
              <button
                onClick={() => toggleTemporada(temp.numero, temp.episodios)}
                style={{
                  background: todosAssistidos? '#22C55E' : '#334155',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {todosAssistidos? '✓ Completa' : 'Marcar Tudo'}
              </button>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px'}}>
              {epsTemp.map(ep => {
                const key = `${temp.numero}-${ep}`
                const isAssistido = assistidos.has(key)

                return (
                  <button
                    key={key}
                    onClick={() => toggleEpisodio(temp.numero, ep)}
                    style={{
                      background: isAssistido? '#FACC15' : '#1E293B',
                      color: isAssistido? '#000' : '#94A3B8',
                      border: 'none',
                      padding: '12px 8px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: isAssistido? 'bold' : 'normal',
                      cursor: 'pointer'
                    }}
                  >
                    {ep}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </main>
  )
}
