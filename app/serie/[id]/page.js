'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

export default function SeriePage() {
  const [user, setUser] = useState(null)
  const [serie, setSerie] = useState(null)
  const [temporadas, setTemporadas] = useState([])
  const [episodiosAssistidos, setEpisodiosAssistidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [estaNaWatchlist, setEstaNaWatchlist] = useState(false)
  const params = useParams()
  const router = useRouter()
  const cardRef = useRef(null)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user && params.id) {
      buscarDados()
      verificarWatchlist()
    }
  }, [user, params.id])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
    } else {
      setUser(session.user)
    }
  }

  async function verificarWatchlist() {
    const { data } = await supabase
    .from('watchlist')
    .select('id')
    .eq('serie_id', params.id)
    .eq('user_id', user.id)
    .single()
    
    setEstaNaWatchlist(!!data)
  }

  async function toggleWatchlist() {
    if (estaNaWatchlist) {
      await supabase
      .from('watchlist')
      .delete()
      .eq('serie_id', params.id)
      .eq('user_id', user.id)
    } else {
      await supabase
      .from('watchlist')
      .insert({ serie_id: params.id, user_id: user.id })
    }
    setEstaNaWatchlist(!estaNaWatchlist)
  }

  async function buscarDados() {
    const { data: serieData } = await supabase
    .from('series')
    .select('*')
    .eq('id', params.id)
    .single()

    if (serieData) {
      setSerie(serieData)

      const { data: tempsData } = await supabase
      .from('temporadas')
      .select('*')
      .eq('serie_id', params.id)
      .order('numero', { ascending: true })

      setTemporadas(tempsData || [])

      const { data: assistidosData } = await supabase
      .from('user_episodios')
      .select('episodio_id')
      .eq('serie_id', params.id)
      .eq('user_id', user.id)

      setEpisodiosAssistidos(assistidosData?.map(e => e.episodio_id) || [])
    }
    setLoading(false)
  }

  async function toggleEpisodio(episodioId, temporadaId) {
    const jaAssistido = episodiosAssistidos.includes(episodioId)

    if (jaAssistido) {
      await supabase
      .from('user_episodios')
      .delete()
      .eq('episodio_id', episodioId)
      .eq('user_id', user.id)
      
      setEpisodiosAssistidos(episodiosAssistidos.filter(id => id !== episodioId))
    } else {
      await supabase
      .from('user_episodios')
      .insert({
        episodio_id: episodioId,
        serie_id: params.id,
        temporada_id: temporadaId,
        user_id: user.id
      })
      
      setEpisodiosAssistidos([...episodiosAssistidos, episodioId])
    }
  }

  const compartilharStories = async () => {
    if (!cardRef.current) return
    
    try {
      const dataUrl = await toPng(cardRef.current, { 
        quality: 1.0,
        backgroundColor: '#0F172A',
        width: 1080,
        height: 1920
      })
      
      const link = document.createElement('a')
      link.download = `${serie.titulo}-maratonei.png`
      link.href = dataUrl
      link.click()
      
      alert('Card salvo! Posta no Stories 📱')
    } catch (err) {
      alert('Erro ao gerar imagem')
    }
  }

  if (!user) return <main className="main"><div className="card">Redirecionando...</div></main>
  if (loading) return <main className="main"><div className="card">Carregando...</div></main>
  if (!serie) return <main className="main"><div className="card">Série não encontrada</div></main>

  const totalEpisodios = temporadas.reduce((acc, t) => acc + t.episodios, 0)
  const percentual = totalEpisodios > 0 ? Math.round((episodiosAssistidos.length / totalEpisodios) * 100) : 0

  return (
    <main className="main">
      <div style={{marginBottom: '16px'}}>
        <Link href="/" style={{color: '#FACC15', textDecoration: 'none', fontSize: '14px'}}>
          ← Voltar
        </Link>
      </div>

      <div ref={cardRef} style={{ background: '#0F172A', padding: '20px', borderRadius: '12px' }}>
        <div className="card" style={{marginBottom: '20px', background: '#1E293B'}}>
          <img
            src={`https://image.tmdb.org/t/p/w500${serie.poster}`}
            alt={serie.titulo}
            style={{
              width: '100%',
              height: '300px',
              objectFit: 'cover',
              borderRadius: '8px',
              marginBottom: '16px'
            }}
          />
          
          <h1 style={{color: '#FACC15', fontSize: '28px', marginBottom: '8px'}}>{serie.titulo}</h1>
          
          <div style={{color: '#94A3B8', fontSize: '16px', marginBottom: '16px'}}>
            <span>⭐ {serie.nota?.toFixed(1)}</span>
            <span style={{margin: '0 8px'}}>•</span>
            <span>{serie.ano}</span>
            <span style={{margin: '0 8px'}}>•</span>
            <span>{totalEpisodios} episódios</span>
          </div>

          <div style={{marginBottom: '20px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#94A3B8', marginBottom: '8px'}}>
              <span>{episodiosAssistidos.length}/{totalEpisodios} episódios</span>
              <span style={{color: '#FACC15', fontWeight: 'bold'}}>{percentual}%</span>
            </div>
            <div style={{width: '100%', height: '8px', background: '#0F172A', borderRadius: '4px', overflow: 'hidden'}}>
              <div style={{
                width: `${percentual}%`,
                height: '100%',
                background: '#FACC15',
                transition: 'width 0.3s'
              }} />
            </div>
          </div>

          <p style={{color: '#CBD5E1', fontSize: '15px', lineHeight: '1.6', marginBottom: '20px'}}>
            {serie.sinopse}
          </p>

          <div style={{display: 'flex', gap: '12px', marginBottom: '12px'}}>
            <button
              onClick={toggleWatchlist}
              style={{
                flex: 1,
                background: estaNaWatchlist? '#FACC15' : '#1E293B',
                color: estaNaWatchlist? '#000' : '#FACC15',
                border: estaNaWatchlist? 'none' : '1px solid #FACC15',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {estaNaWatchlist? '★ Na Lista' : '☆ Quero Assistir'}
            </button>
          </div>

          <button
            onClick={compartilharStories}
            style={{
              background: 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF)',
              color: '#fff',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            📱 Compartilhar no Stories
          </button>
        </div>

        {temporadas.map((temp) => (
          <div key={temp.id} className="card" style={{marginBottom: '16px', background: '#1E293B'}}>
            <h3 style={{color: '#FACC15', marginBottom: '12px'}}>
              Temporada {temp.numero}
            </h3>
            
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(45px, 1fr))', gap: '8px'}}>
              {Array.from({ length: temp.episodios }, (_, i) => i + 1).map((ep) => {
                const episodioId = `${temp.id}-${ep}`
                const assistido = episodiosAssistidos.includes(episodioId)
                
                return (
                  <button
                    key={ep}
                    onClick={() => toggleEpisodio(episodioId, temp.id)}
                    style={{
                      background: assistido ? '#FACC15' : '#0F172A',
                      color: assistido ? '#000' : '#94A3B8',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {ep}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
