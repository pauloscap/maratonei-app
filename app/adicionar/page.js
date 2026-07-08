'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

export default function Adicionar() {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState([])
  const [loading, setLoading] = useState(false)
  const [adicionando, setAdicionando] = useState(null)
  const router = useRouter()

  // Pega a chave do TMDB do .env
  const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'a1e42d1491eedff27ee9e352a1f70735'

  async function buscarSeries() {
    if (!busca) return
    setLoading(true)
    
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_KEY}&language=pt-BR&query=${encodeURIComponent(busca)}`
      )
      const data = await res.json()
      setResultados(data.results?.slice(0, 10) || [])
    } catch (err) {
      alert('Erro ao buscar séries')
    }
    setLoading(false)
  }

  async function adicionarSerie(serieTmdb) {
    setAdicionando(serieTmdb.id)
    
    try {
      // 1. Verifica se já existe no banco
      const { data: existe } = await supabase
        .from('series')
        .select('id')
        .eq('tmdb_id', serieTmdb.id)
        .single()

      if (existe) {
        alert('Essa série já foi adicionada!')
        setAdicionando(null)
        return
      }

      // 2. Busca detalhes completos da série
      const resSerie = await fetch(
        `https://api.themoviedb.org/3/tv/${serieTmdb.id}?api_key=${TMDB_KEY}&language=pt-BR`
      )
      const detalhes = await resSerie.json()

      // 3. Insere a série
      const { data: novaSerie, error: erroSerie } = await supabase
        .from('series')
        .insert({
          tmdb_id: serieTmdb.id,
          titulo: detalhes.name,
          poster: detalhes.poster_path,
          sinopse: detalhes.overview,
          nota: detalhes.vote_average,
          ano: new Date(detalhes.first_air_date).getFullYear(),
          generos: detalhes.genres?.map(g => g.name).join(', ')
        })
        .select()
        .single()

      if (erroSerie) throw erroSerie

      // 4. Busca e insere as temporadas
      const resTemps = await fetch(
        `https://api.themoviedb.org/3/tv/${serieTmdb.id}?api_key=${TMDB_KEY}&language=pt-BR&append_to_response=season/1,season/2,season/3,season/4,season/5,season/6,season/7,season/8,season/9,season/10`
      )
      const dadosCompletos = await resTemps.json()

      const temporadas = dadosCompletos.seasons
        ?.filter(s => s.season_number > 0) // Remove temporada 0 que são especiais
        ?.map(s => ({
          serie_id: novaSerie.id,
          numero: s.season_number,
          episodios: s.episode_count
        })) || []

      if (temporadas.length > 0) {
        await supabase.from('temporadas').insert(temporadas)
      }

      alert(`✅ ${detalhes.name} adicionada com sucesso!`)
      router.push(`/serie/${novaSerie.id}`)
      
    } catch (err) {
      console.error(err)
      alert('Erro ao adicionar série: ' + err.message)
    }
    
    setAdicionando(null)
  }

  return (
    <main className="main">
      <Link href="/" style={{color: '#FACC15', textDecoration: 'none', marginBottom: '16px', display: 'block'}}>
        ← Voltar
      </Link>

      <h1 style={{color: '#FACC15', marginBottom: '24px', fontSize: '28px'}}>Adicionar Série</h1>

      <div style={{display: 'flex', gap: '8px', marginBottom: '24px'}}>
        <input
          type="text"
          placeholder="Busca: breaking bad, the office..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && buscarSeries()}
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
          disabled={loading}
          style={{
            background: '#FACC15',
            color: '#000',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading? 'not-allowed' : 'pointer',
            opacity: loading? 0.5 : 1
          }}
        >
          {loading? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {resultados.length === 0 &&!loading && busca && (
        <div className="card" style={{textAlign: 'center', color: '#64748B'}}>
          Nenhuma série encontrada pra "{busca}"
        </div>
      )}

      {resultados.map(serie => (
        <div key={serie.id} className="card" style={{marginBottom: '16px', display: 'flex', gap: '16px'}}>
          <img
            src={serie.poster_path 
              ? `https://image.tmdb.org/t/p/w200${serie.poster_path}`
              : 'https://via.placeholder.com/100x150?text=Sem+Poster'
            }
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
            <h3 style={{color: '#FACC15', marginBottom: '4px'}}>{serie.name}</h3>
            <p style={{color: '#94A3B8', fontSize: '14px', marginBottom: '8px'}}>
              {serie.first_air_date? new Date(serie.first_air_date).getFullYear() : 'Ano?'} • ⭐ {serie.vote_average?.toFixed(1)}
            </p>
            <p style={{color: '#64748B', fontSize: '13px', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
              {serie.overview || 'Sem sinopse disponível'}
            </p>
            
            <button
              onClick={() => adicionarSerie(serie)}
              disabled={adicionando === serie.id}
              style={{
                background: adicionando === serie.id? '#334155' : '#22C55E',
                color: '#fff',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: adicionando === serie.id? 'not-allowed' : 'pointer',
                width: '100%'
              }}
            >
              {adicionando === serie.id? 'Adicionando...' : '+ Adicionar Série'}
            </button>
          </div>
        </div>
      ))}
    </main>
  )
}
