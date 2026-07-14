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
  const [watchlist, setWatchlist] = useState([])
  const [continuarAssistindo, setContinuarAssistindo] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      buscarSeries()
      buscarWatchlist()
      buscarContinuarAssistindo()
    }
  }, [user])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
    } else {
      setUser(session.user)
    }
    setLoading(false)
  }

  async function buscarSeries() {
    const { data } = await supabase
     .from('series')
     .select('*')
     .order('titulo', { ascending: true })

    setSeries(data || [])
  }

  async function buscarWatchlist() {
    const { data } = await supabase
     .from('watchlist')
     .select('serie_id, series(*)')
     .eq('user_id', user.id)

    setWatchlist(data?.map(w => w.series) || [])
  }

  async function buscarContinuarAssistindo() {
    const { data } = await supabase
     .from('user_episodios')
     .select('serie_id, series(*)')
     .eq('user_id', user.id)
     .order('assistido_em', { ascending: false })

    const unicas = []
    const ids = new Set()
    data?.forEach(item => {
      if (!ids.has(item.serie_id)) {
        ids.add(item.serie_id)
        unicas.push(item.series)
      }
    })
    setContinuarAssistindo(unicas.slice(0, 10))
  }

  async function buscarTMDB() {
    if (!searchTerm) return buscarSeries()

    const res = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}&query=${searchTerm}&language=pt-BR`)
    const data = await res.json()
    setSeries(data.results || [])
  }

  async function adicionarSerie(tmdbSerie) {
    const { data: existe } = await supabase
     .from('series')
     .select('id')
     .eq('tmdb_id', tmdbSerie.id)
     .single()

    if (existe) {
      router.push(`/serie/${existe.id}`)
      return
    }

    const { data: novaSerie } = await supabase
     .from('series')
     .insert({
        tmdb_id: tmdbSerie.id,
        titulo: tmdbSerie.name,
        sinopse: tmdbSerie.overview,
        poster: tmdbSerie.poster_path,
        nota: tmdbSerie.vote_average,
        ano: tmdbSerie.first_air_date?.split('-')[0]
      })
     .select()
     .single()

    if (novaSerie) router.push(`/serie/${novaSerie.id}`)
  }

  if (loading) return <main className="main"><div className="card">Carregando...</div></main>

  return (
    <main className="main">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <h1 style={{color: '#FACC15', fontSize: '24px'}}>🍿 Maratonei</h1>
        <div style={{display: 'flex', gap: '12px'}}>
          <Link href="/stats" style={{color: '#FACC15', textDecoration: 'none', fontSize: '14px'}}>📊 Stats</Link>
          <Link href="/feed" style={{color: '#FACC15', textDecoration: 'none', fontSize: '14px'}}>📱 Feed</Link>
        </div>
      </div>

      <div style={{display: 'flex', gap: '8px', marginBottom: '24px'}}>
        <input
          type="text"
          placeholder="Buscar série..."
          value={searchTerm}
          onChange={(e
