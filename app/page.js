'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

export default function Home() {
  const [user, setUser] = useState(null)
  const [series, setSeries] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [continuarAssistindo, setContinuarAssistindo] = useState([])
  const [watchlist, setWatchlist] = useState([])

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      buscarSeries()
      buscarContinuarAssistindo()
      buscarWatchlist()
    }
  }, [user])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
    } else {
      setUser(session.user)
    }
  }

  const router = useRouter()

  async function buscarSeries() {
    const { data } = await supabase
  .from('series')
  .select('*')
  .order('id', { ascending: false })
  .limit(20)

    setSeries(data || [])
    setLoading(false)
  }

  async function buscarContinuarAssistindo() {
    const { data } = await supabase
  .from('user_episodios')
  .select('serie_id, series(*)')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(10)

    if (data) {
      const seriesUnicas = []
      const idsVistos = new Set()

      data.forEach(item => {
        if (item.series &&!idsVistos.has(item.serie_id)) {
          idsVistos.add(item.serie_id)
          seriesUnicas.push(item.series)
        }
      })

      setContinuarAssistindo(seriesUnicas)
    }
  }

  async function buscarWatchlist() {
    const { data } = await supabase
  .from('watchlist')
  .select('series(*)')
  .eq('user_id', user.id)
  .limit(10)

    if (data) {
      setWatchlist(data.map(item => item.series).filter(Boolean))
    }
  }

  async function handleSearch(e) {
    e.preventDefault()
    if (!searchTerm.trim()) return

    const res = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}&language=pt-BR&query=${searchTerm}`)
    const data = await res.json()
    setSearchResults(data.results || [])
  }

  async function adicionarSerie(serieTMDB) {
    const { data: existente } = await supabase
  .from('series')
  .select('id')
  .eq('tmdb_id', serieTMDB.id)
  .single()

    if (existente) {
      router.push(`/serie/${existente.id}`)
      return
    }

    const { data: novaSerie } = await supabase
  .from('series')
  .insert({
      tmdb_id: serieTMDB.id,
      titulo: serieTMDB.name,
      sinopse: serieTMDB.overview,
      poster: serieTMDB.poster_path,
      nota: serieTMDB.vote_average,
      ano: new Date(serieTMDB.first_air_date).getFullYear()
    })
  .select()
  .single()

    if (novaSerie) {
      router.push(`/serie/${novaSerie.id}`)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return <main className="main"><div className="card">Redirecionando...</div></main>
  if (loading) return <main className="main"><div className="card">Carregando...</div></main>

  return (
    <main className="main">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <h1 style={{color: '#FACC15', fontSize: '32px', margin: 0}}>Maratonei</h1>
        <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
          <Link href="/stats" style={{color: '#94A3B8', fontSize: '14px', textDecoration: 'none'}}>📊 Stats</Link>
          <Link href="/ranking" style={{color: '#94A3B8', fontSize: '14px', textDecoration: 'none'}}>🏆 Ranking</Link>
          <button onClick={handleLogout} style={{background: 'none', border: 'none', color: '#94A3B8', fontSize: '14px', cursor: 'pointer'}}>
            Sair
          </button>
        </div>
      </div>

      <form onSubmit={handleSearch} style={{marginBottom: '24px'}}>
        <input
          type="text"
          placeholder="Buscar série..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #334155',
            background: '#1E293B',
            color: '#fff',
            fontSize: '16px'
          }}
        />
      </form>

      {searchResults.length > 0 && (
        <div style={{marginBottom: '32px'}}>
          <h2 style={{color: '#FACC15', fontSize: '20px', marginBottom: '16px'}}>Resultados da busca</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px'}}>
            {searchResults.map((serie) => (
              <div key={serie.id} onClick={() => adicionarSerie(serie)} style={{cursor: 'pointer'}}>
                <img
                  src={serie.poster_path? `https://image.tmdb.org/t/p/w300${serie.poster_path}` : '/placeholder.png'}
                  alt={serie.name}
                  style={{width: '100%', borderRadius: '8px', marginBottom: '8px'}}
                />
                <p style={{color: '#CBD5E1', fontSize: '14px', margin: 0}}>{serie.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {continuarAssistindo.length > 0 && (
        <div style={{marginBottom: '32px'}}>
          <h2 style={{color: '#FACC15', fontSize: '20px', marginBottom: '16px'}}>Continuar Assistindo</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px'}}>
            {continuarAssistindo.map((serie) => (
              <Link key={serie.id} href={`/serie/${serie.id}`} style={{textDecoration: 'none'}}>
                <img
                  src={`https://image.tmdb.org/t/p/w300${serie.poster}`}
                  alt={serie.titulo}
                  style={{width: '100%', borderRadius: '8px', marginBottom: '8px'}}
                />
                <p style={{color: '#CBD5E1', fontSize: '14px', margin: 0}}>{serie.titulo}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {watchlist.length > 0 && (
        <div style={{marginBottom: '32px'}}>
          <h2 style={{color: '#FACC15', fontSize: '20px', marginBottom: '16px'}}>Quero Assistir</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px'}}>
            {watchlist.map((serie) => (
              <Link key={serie.id} href={`/serie/${serie.id}`} style={{textDecoration: 'none'}}>
                <img
                  src={`https://image.tmdb.org/t/p/w300${serie.poster}`}
                  alt={serie.titulo}
                  style={{width: '100%', borderRadius: '8px', marginBottom: '8px'}}
                />
                <p style={{color: '#CBD5E1', fontSize: '14px', margin: 0}}>{serie.titulo}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 style={{color: '#FACC15', fontSize: '20px', marginBottom: '16px'}}>Catálogo</h2>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px'}}>
          {series.map((serie) => (
            <Link key={serie.id} href={`/serie/${serie.id}`} style={{textDecoration: 'none'}}>
              <img
                src={`https://image.tmdb.org/t/p/w300${serie.poster}`}
                alt={serie.titulo}
                style={{width: '100%', borderRadius: '8px', marginBottom: '8px'}}
              />
              <p style={{color: '#CBD5E1', fontSize: '14px', margin: 0}}>{serie.titulo}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
