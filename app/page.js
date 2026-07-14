'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_KEY

export default function Home() {
  const [user, setUser] = useState(null)
  const [series, setSeries] = useState([])
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState([])
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

  async function buscarSeries() {
    const { data } = await supabase
  .from('series')
  .select('*')
  .order('created_at', { ascending: false })
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

    const seriesUnicas = []
    const idsJaAdd = []
    data?.forEach(item => {
      if (!idsJaAdd.includes(item.serie_id)) {
        seriesUnicas.push(item.series)
        idsJaAdd.push(item.serie_id)
      }
    })
    setContinuarAssistindo(seriesUnicas)
  }

  async function buscarWatchlist() {
    const { data } = await supabase
  .from('watchlist')
  .select('series(*)')
  .eq('user_id', user.id)

    setWatchlist(data?.map(w => w.series) || [])
  }

  async function buscarNoTMDB(query) {
    if (query.length < 2) {
      setResultados([])
      return
    }

    const res = await fetch(
      `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_KEY}&language=pt-BR&query=${encodeURIComponent(query)}`
    )
    const data = await res.json()
    setResultados(data.results?.slice(0, 5) || [])
  }

  async function adicionarSerie(serieTMDB) {
    // Checa se já existe
    const { data: existe } = await supabase
  .from('series')
  .select('id')
  .eq('tmdb_id', serieTMDB.id)
  .single()

    if (existe) {
      router.push(`/serie/${existe.id}`)
      return
    }

    // Busca detalhes + temporadas
    const resDetalhes = await fetch(
      `https://api.themoviedb.org/3/tv/${serieTMDB.id}?api_key=${TMDB_KEY}&language=pt-BR`
    )
    const detalhes = await resDetalhes.json()

    // Insere série
    const { data: novaSerie } = await supabase
  .from('series')
  .insert({
      tmdb_id: detalhes.id,
      titulo: detalhes.name,
      sinopse: detalhes.overview,
      poster: detalhes.poster_path,
      nota: detalhes.vote_average,
      ano: new Date(detalhes.first_air_date).getFullYear(),
      status: detalhes.status
    })
  .select()
  .single()

    // Insere temporadas
    for (const temp of detalhes.seasons) {
      if (temp.season_number === 0) continue // Pula especiais

      await supabase
    .from('temporadas')
    .insert({
        serie_id: novaSerie.id,
        numero: temp.season_number,
        episodios: temp.episode_count
      })
    }

    setBusca('')
    setResultados([])
    buscarSeries()
    router.push(`/serie/${novaSerie.id}`)
  }

  const router = useRouter()

  if (!user) return <main className="main"><div className="card">Redirecionando...</div></main>

  return (
    <main className="main">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <h1 style={{color: '#FACC15', fontSize: '24px'}}>🍿 Maratonei</h1>
        <div
