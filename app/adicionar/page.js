'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

export default function Adicionar() {
  const [user, setUser] = useState(null)
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [adicionando, setAdicionando] = useState(null)
  const [watchlist, setWatchlist] = useState({})
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) buscarWatchlist()
  }, [user])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
    } else {
      setUser(session.user)
    }
  }

  async function buscarWatchlist() {
    const { data } = await supabase
.from('watchlist')
.select('serie_id')
.eq('user_id', user.id)

    const watchlistObj = {}
    data?.forEach(w => { watchlistObj[w.serie_id] = true })
    setWatchlist(watchlistObj)
  }

  async function buscarSeries() {
    if (!busca.trim()) return
    setBuscando(true)

    const response = await fetch(
      `/api/buscar-series?q=${encodeURIComponent(busca)}`
    )
    const data = await response.json()
    setResultados(data.results || [])
    setBuscando(false)
  }

  async function adicionarSerie(serieId) {
    setAdicionando(serieId)

    const response = await fetch('/api/adicionar-serie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serieId })
    })

    if (response.ok) {
      alert('Série adicionada!')
      router.push(`/serie/${serieId}`)
    } else {
      alert('Erro ao adicionar série')
    }
    setAdicionando(null)
  }

  async function toggleWatchlist(serieId) {
    if (watchlist[serieId]) {
      await supabase
 .from('watchlist')
 .delete()
 .eq('user_id', user.id)
 .eq('serie_id', serieId)

      setWatchlist(prev => {
        const novo = {...prev }
        delete novo[serieId]
        return novo
      })
    } else {
      await supabase
 .from('watchlist')
 .insert({ user_id: user.id, serie_id: serieId })

      setWatchlist(prev => ({...prev, [serieId]: true }))
    }
  }

  if (!user) return <main className="main"><div className="card">Redirecionando...</div></main>

  return (
    <main className="main">
      <Link href="/" style={{color: '#FACC15', textDecoration: 'none', marginBottom: '16px', display: 'block'}}>
        ← Voltar
      </Link>

      <h1 style={{color: '#FACC15', marginBottom: '24px', fontSize: '28px'}}>Adicionar Série</h1>

      <div style={{display: 'flex', gap: '8px', marginBottom: '24px'}}>
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && buscarSeries()}
          placeholder="Digite o nome da série..."
          style={{
            flex: 1,
            background: '#1E293B',
            border: '1px solid #334155',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '16px',
            outline: 'none'
          }}
        />
        <button
          onClick={buscarSeries}
          disabled={buscando}
          style={{
            background: '#FACC15',
            color: '#000',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: buscando? 'not-allowed' : 'pointer',
            opacity: buscando? 0.5 : 1
          }}
        >
          {buscando? '...' : 'Buscar'}
        </button>
      </div>

      {resultados.map((serie) => (
        <div key={serie.id} className="card" style={{marginBottom: '16px', display: 'flex', gap: '16px'}}>
          <img
            src={serie.poster_path? `https://image.tmdb.org/t/p/w200${serie.poster_path}` : 'https://via.placeholder.com/100x150'}
            alt={serie.name}
            style={{
              width: '100px',
              height: '150px',
              objectFit: 'cover',
              borderRadius: '8px',
              flexShrink: 0
            }}
          />
          <div style={{flex: 1}}>
            <h3 style={{color: '#FACC15', marginBottom: '8px'}}>{serie.name}</h3>
            <p style={{color: '#94A3B8', fontSize: '14px', marginBottom: '12px'}}>
              {serie.first_air_date?.split('-')[0]} • ⭐ {serie.vote_average?.toFixed(1)}
            </p>
            <p style={{
              color: '#94A3B8',
              fontSize: '13px',
              lineHeight: '1.5',
              marginBottom: '12px',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {serie.overview}
            </p>
            <div style={{display: 'flex', gap: '8px'}}>
              <button
                onClick={() => adicionarSerie(serie.id)}
                disabled={adicionando === serie.id}
                style={{
                  background: '#22C55E',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: adicionando === serie.id? 'not-allowed' : 'pointer',
                  opacity: adicionando === serie.id? 0.5 : 1
                }}
              >
                {adicionando === serie.id? 'Adicionando...' : 'Adicionar'}
              </button>
              <button
                onClick={() => toggleWatchlist(serie.id.toString())}
                style={{
                  background: watchlist[serie.id]? '#FACC15' : '#1E293B',
                  color: watchlist[serie.id]? '#000' : '#FACC15',
                  border: watchlist[serie.id]? 'none' : '1px solid #FACC15',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {watchlist[serie.id]? '📌 Na Lista' : '📌 Quero Assistir'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </main>
  )
}
