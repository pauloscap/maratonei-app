'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)
const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_KEY

export default function SeriePage() {
  const { id } = useParams()
  const router = useRouter()
  const [serie, setSerie] = useState(null)
  const [tmdbData, setTmdbData] = useState(null)
  const [tempAberta, setTempAberta] = useState(1)
  const [episodiosTemp, setEpisodiosTemp] = useState([])
  const [assistidos, setAssistidos] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return router.push('/login')
    setUser(session.user)
    const { data: serieData } = await supabase.from('series').select('*').eq('id', id).single()
    if (!serieData) return router.push('/')
    setSerie(serieData)
    if (serieData.tmdb_id) {
      const res = await fetch(`https://api.themoviedb.org/3/tv/${serieData.tmdb_id}?api_key=${TMDB_KEY}&language=pt-BR`)
      const data = await res.json()
      setTmdbData(data)
      if (data.seasons?.length > 0) {
        const primeira = data.seasons.find(s => s.season_number > 0) || data.seasons[0]
        carregarEpisodios(primeira.season_number, serieData.tmdb_id)
      }
    }
    const { data: prog } = await supabase.from('user_episodios').select('*').eq('user_id', session.user.id).eq('serie_id', id)
    setAssistidos(prog || [])
    setLoading(false)
  }

  async function carregarEpisodios(numTemp, tmdbId) {
    const tid = tmdbId || serie?.tmdb_id
    if (!tid) return
    setTempAberta(numTemp)
    const res = await fetch(`https://api.themoviedb.org/3/tv/${tid}/season/${numTemp}?api_key=${TMDB_KEY}&language=pt-BR`)
    const data = await res.json()
    setEpisodiosTemp(data.episodes || [])
  }

  async function toggleEp(temp, epNum) {
    const existe = assistidos.find(a => a.temporada === temp && a.episodio === epNum)
    if (existe) {
      setAssistidos(prev => prev.filter(a => a.id!== existe.id))
      const { error } = await supabase.from('user_episodios').delete().eq('id', existe.id)
      if (error) {
        console.log('Erro delete', error)
        alert('Erro ao desmarcar: ' + error.message)
      }
    } else {
      const tempId = `temp-${Date.now()}`
      const novo = { id: tempId, temporada: temp, episodio: epNum }
      setAssistidos(prev => [...prev, novo])
      const { data, error } = await supabase.from('user_episodios').insert({
        user_id: user.id,
        serie_id: id,
        temporada: temp,
        episodio: epNum
      }).select().single()
      if (error) {
        console.log('Erro insert', error)
        alert('Erro ao salvar: ' + error.message)
        setAssistidos(prev => prev.filter(a => a.id!== tempId))
      } else if (data) {
        setAssistidos(prev => prev.map(a => a.id === tempId? data : a))
      }
